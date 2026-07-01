import type { Result } from '@/shared/networking'
import { ok, err } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { NutritionalInfo } from '../../domain/shared.types'
import { NutritionCalculator } from '../../domain/services/nutrition-calculator'
import {
  RecipeVariantGenerator,
  DIET_VARIANT_METADATA,
  type ChangePlan,
  type DietVariantType,
  type VariantIngredientContext,
} from '../../domain/services/recipe-variant-generator'
import { matchIngredientLine } from './match-ingredient.use-case'
import type { RecipeRepository } from '../../infrastructure/repositories/recipe.repository'
import type { IngredientRepository } from '../../infrastructure/repositories/ingredient.repository'
import type { StorageRepository } from '../../infrastructure/repositories/storage.repository'
import type { Ingredient } from '../../domain/ingredient.types'
import type {
  CreateRecipeVariationOverrideInput,
  RecipeIngredient,
  RecipeVariation,
} from '../../domain/recipe.types'

// Una entrada por cambio, siempre con el motivo exacto — "indicar exactamente
// qué cambió" del enunciado. Refleja 1:1 los VariationIngredientOverride
// persistidos, en un formato más cómodo para mostrar en UI.
export type VariantChangeSummary = {
  type: 'remove' | 'replace' | 'adjust_quantity'
  originalIngredientName: string
  newIngredientName?: string
  newQuantity?: number
  reason: string
}

export type GeneratedVariantResult =
  | {
      variantType: DietVariantType
      created: true
      variation: RecipeVariation
      nutrition: NutritionalInfo
      changes: VariantChangeSummary[]
    }
  | {
      variantType: DietVariantType
      created: false
      // already_compliant: ningún ingrediente viola la dieta, no hay nada que cambiar.
      // insufficient_data: (alta proteína / baja calórica) no hay datos nutricionales
      //   suficientes para proponer un cambio, o la resolución de sustitutos falló.
      reason: 'already_compliant' | 'insufficient_data'
    }

export type GenerateRecipeVariantsDeps = {
  recipeRepo: RecipeRepository
  ingredientRepo: IngredientRepository
  storageRepo: StorageRepository
}

export const ALL_DIET_VARIANT_TYPES: DietVariantType[] = [
  'high_protein',
  'low_calorie',
  'vegetarian',
  'vegan',
  'keto',
  'gluten_free',
  'dairy_free',
]

const BOOST_VARIANT_TYPES: DietVariantType[] = ['high_protein', 'low_calorie']

// Genera automáticamente variantes dietéticas de una receta ya guardada:
//   1. RecipeVariantGenerator (puro) decide QUÉ ingredientes cambiar.
//   2. Los sustitutos se resuelven a ingredient_id reales reutilizando el
//      motor de matching (match-ingredient.use-case) — nunca se llama a IA.
//   3. La nutrición se recalcula con NutritionCalculator (ya existente, puro)
//      — tampoco llama a IA.
//   4. Cada variante se guarda como RecipeVariation + VariationIngredientOverride[]
//      relacionada con la receta original (delta model, ADR-009). Los pasos
//      (RecipeStep) de la receta base NUNCA se tocan ni se duplican.
export async function generateRecipeVariants(
  recipeId: string,
  deps: GenerateRecipeVariantsDeps,
  variantTypes: DietVariantType[] = ALL_DIET_VARIANT_TYPES,
): Promise<Result<GeneratedVariantResult[]>> {
  const [recipeResult, unitsResult, conversionsResult] = await Promise.all([
    deps.recipeRepo.findWithDetails(recipeId),
    deps.storageRepo.listUnits(),
    deps.storageRepo.listUnitConversions(),
  ])

  if (!recipeResult.ok) return recipeResult
  if (!unitsResult.ok) return unitsResult
  if (!conversionsResult.ok) return conversionsResult
  if (!recipeResult.data)
    return err(new NotFoundError('RECIPE_NOT_FOUND', recipeId))

  const recipe = recipeResult.data
  const units = unitsResult.data
  const conversions = conversionsResult.data

  if (recipe.ingredients.length === 0) {
    return ok(
      variantTypes.map((variantType) => ({
        variantType,
        created: false as const,
        reason: 'insufficient_data' as const,
      })),
    )
  }

  const contextsResult = await buildContexts(
    recipe.ingredients,
    deps.ingredientRepo,
  )
  if (!contextsResult.ok) return contextsResult
  const contexts = contextsResult.data

  const results: GeneratedVariantResult[] = []

  for (const variantType of variantTypes) {
    const plans = RecipeVariantGenerator.plan(contexts, variantType)

    if (plans.length === 0) {
      results.push({
        variantType,
        created: false,
        reason: BOOST_VARIANT_TYPES.includes(variantType)
          ? 'insufficient_data'
          : 'already_compliant',
      })
      continue
    }

    const resolvedResult = await resolvePlans(
      plans,
      recipe.ingredients,
      deps.ingredientRepo,
    )
    if (!resolvedResult.ok) return resolvedResult
    const resolved = resolvedResult.data

    if (resolved.overrideInputs.length === 0) {
      results.push({ variantType, created: false, reason: 'insufficient_data' })
      continue
    }

    const variationResult = await deps.recipeRepo.createVariation(recipeId, {
      name: DIET_VARIANT_METADATA[variantType].name,
      overrides: resolved.overrideInputs,
    })
    if (!variationResult.ok) return variationResult
    const variation = variationResult.data

    const allIngredients: Ingredient[] = [
      ...recipe.ingredients.map((ri) => ri.ingredient),
      ...resolved.newIngredients,
    ]

    const nutrition = NutritionCalculator.calculateForVariation(
      recipe,
      variation,
      recipe.ingredients,
      allIngredients,
      units,
      conversions,
    )

    results.push({
      variantType,
      created: true,
      variation,
      nutrition,
      changes: resolved.changes,
    })
  }

  return ok(results)
}

// Carga los detalles completos (attributes/allergens) de cada ingrediente
// único de la receta — RecipeVariantGenerator los necesita para clasificar
// violaciones, y RecipeIngredient.ingredient no los incluye.
async function buildContexts(
  recipeIngredients: RecipeIngredient[],
  ingredientRepo: IngredientRepository,
): Promise<Result<VariantIngredientContext[]>> {
  const uniqueIds = [
    ...new Set(recipeIngredients.map((ri) => ri.ingredient_id)),
  ]
  const detailsResults = await Promise.all(
    uniqueIds.map((id) => ingredientRepo.findWithDetails(id)),
  )

  const failed = detailsResults.find((r) => !r.ok)
  if (failed && !failed.ok) return failed

  const detailsMap = new Map(
    detailsResults
      .map((r) => (r.ok ? r.data : null))
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map((d) => [d.id, d]),
  )

  const contexts = recipeIngredients
    .map((ri) => {
      const details = detailsMap.get(ri.ingredient_id)
      return details ? { recipeIngredient: ri, details } : null
    })
    .filter((c): c is VariantIngredientContext => c !== null)

  return ok(contexts)
}

// Resuelve los ChangePlan (puros) a overrides persistibles. SECUENCIAL (no
// Promise.all): dos plans de la misma variante pueden apuntar al mismo
// sustituto de texto libre, y matchIngredientLine no debe crear duplicados
// si el primero ya lo creó.
async function resolvePlans(
  plans: ChangePlan[],
  recipeIngredients: RecipeIngredient[],
  ingredientRepo: IngredientRepository,
): Promise<
  Result<{
    overrideInputs: CreateRecipeVariationOverrideInput[]
    newIngredients: Ingredient[]
    changes: VariantChangeSummary[]
  }>
> {
  const overrideInputs: CreateRecipeVariationOverrideInput[] = []
  const newIngredients: Ingredient[] = []
  const changes: VariantChangeSummary[] = []
  const riById = new Map(recipeIngredients.map((ri) => [ri.id, ri]))

  for (const plan of plans) {
    const ri = riById.get(plan.recipeIngredientId)
    if (!ri) continue

    if (plan.kind === 'remove') {
      overrideInputs.push({
        override_type: 'REMOVE',
        original_ingredient_id: ri.ingredient_id,
        notes: plan.reason,
      })
      changes.push({
        type: 'remove',
        originalIngredientName: plan.ingredientName,
        reason: plan.reason,
      })
      continue
    }

    if (plan.kind === 'adjust_quantity') {
      overrideInputs.push({
        override_type: 'ADJUST_QUANTITY',
        original_ingredient_id: ri.ingredient_id,
        new_quantity: plan.newQuantity,
        new_unit_id: ri.unit_id,
        notes: plan.reason,
      })
      changes.push({
        type: 'adjust_quantity',
        originalIngredientName: plan.ingredientName,
        newQuantity: plan.newQuantity,
        reason: plan.reason,
      })
      continue
    }

    // replace: resolver el texto del sustituto contra el catálogo real,
    // reutilizando el motor de matching (nunca llama a IA).
    const matchResult = await matchIngredientLine(
      plan.substituteQuery,
      ingredientRepo,
    )
    if (!matchResult.ok) return matchResult

    const substituteResult = await ingredientRepo.findById(
      matchResult.data.ingredient_id,
    )
    if (!substituteResult.ok) return substituteResult
    if (!substituteResult.data) continue

    newIngredients.push(substituteResult.data)
    overrideInputs.push({
      override_type: 'REPLACE',
      original_ingredient_id: ri.ingredient_id,
      new_ingredient_id: substituteResult.data.id,
      new_quantity: ri.quantity,
      new_unit_id: ri.unit_id,
      notes: plan.reason,
    })
    changes.push({
      type: 'replace',
      originalIngredientName: plan.ingredientName,
      newIngredientName: substituteResult.data.name,
      reason: plan.reason,
    })
  }

  return ok({ overrideInputs, newIngredients, changes })
}
