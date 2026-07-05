import type { Unit, UnitConversion, RecipeWithDetails } from '@/modules/knowledge-base'
// Import directo al archivo fuente (no al barrel `@/modules/knowledge-base`):
// el barrel re-exporta también los hooks de React Query, que a su vez cargan
// el singleton de Supabase con side-effects de React Native — inofensivo en
// la app, pero rompe la carga del módulo bajo Jest/Node. UnitConverter es un
// servicio puro (ADR-015); importarlo desde su archivo fuente evita ese
// arrastre sin tocar knowledge-base ni la configuración de test.
import { UnitConverter } from '@/modules/knowledge-base/domain/services/unit-converter'
import type { AggregatedIngredientDemand } from '../shopping-snapshot.types'

// ─── MealPlanIngredientAggregator ─────────────────────────────────────────────
// Agrega los ingredientes de todas las recetas COOK_AT_HOME asignadas en un
// plan para producir la demanda que alimentará un MealPlanShoppingSnapshot.
// Puro — recibe las recetas ya cargadas (con sus RecipeIngredient) y la lista
// de unidades/conversiones globales de Knowledge Base (ADR-015: UnitConverter
// es un servicio puro exportado, consumible aquí sin violar bounded-contexts.md).
//
// Lo que NO hace:
//   - No decide qué recetas están asignadas — recibe la lista ya resuelta por
//     el use-case `generateShoppingSnapshot`.
//   - No conoce inventario del usuario ni supermercados (eso es Inventory /
//     Shopping List / Supermarket, fuera del alcance de Meal Planner).
//   - No genera una lista de compra editable — solo la demanda agregada; el
//     módulo Shopping List (Fase 6) es quien construye la lista real a partir
//     de este snapshot.
//   - No incluye ingredientes marcados `is_optional` de la receta.
//   - No llama a IA ni decide sustituciones.

export type MealAssignmentForAggregation = {
  recipe: RecipeWithDetails
  servings: number
}

type Bucket = {
  ingredient_id: string
  unit_id: string
  total_quantity: number
  recipeIds: Set<string>
}

export const MealPlanIngredientAggregator = {
  aggregate(
    assignments: MealAssignmentForAggregation[],
    units: Unit[],
    conversions: UnitConversion[],
  ): AggregatedIngredientDemand[] {
    const canonicalUnitByIngredient = new Map<string, string>()
    const buckets = new Map<string, Bucket>()

    for (const { recipe, servings } of assignments) {
      const scale = servings / recipe.servings_min

      for (const ri of recipe.ingredients) {
        if (ri.is_optional) continue

        const ingredientId = ri.ingredient.id
        const scaledQuantity = ri.quantity * scale

        const canonicalUnitId =
          canonicalUnitByIngredient.get(ingredientId) ??
          ri.ingredient.default_unit_id ??
          ri.unit.id
        if (!canonicalUnitByIngredient.has(ingredientId)) {
          canonicalUnitByIngredient.set(ingredientId, canonicalUnitId)
        }

        let finalQuantity = scaledQuantity
        let finalUnitId = ri.unit.id

        if (ri.unit.id === canonicalUnitId) {
          finalUnitId = canonicalUnitId
        } else {
          const canonicalUnit = units.find((u) => u.id === canonicalUnitId)
          const converted = canonicalUnit
            ? UnitConverter.convert(
                scaledQuantity,
                ri.unit,
                canonicalUnit,
                units,
                conversions,
                ri.ingredient,
              )
            : null

          if (converted?.ok) {
            finalQuantity = converted.data
            finalUnitId = canonicalUnitId
          }
          // Si no se pudo convertir, se conserva en la unidad original (una
          // fila separada) en vez de perder la cantidad o sumarla mal.
        }

        const key = `${ingredientId}:${finalUnitId}`
        const existing = buckets.get(key)
        if (existing) {
          existing.total_quantity += finalQuantity
          existing.recipeIds.add(recipe.id)
        } else {
          buckets.set(key, {
            ingredient_id: ingredientId,
            unit_id: finalUnitId,
            total_quantity: finalQuantity,
            recipeIds: new Set([recipe.id]),
          })
        }
      }
    }

    return Array.from(buckets.values()).map((bucket) => ({
      ingredient_id: bucket.ingredient_id,
      unit_id: bucket.unit_id,
      total_quantity: bucket.total_quantity,
      recipe_count: bucket.recipeIds.size,
    }))
  },
}
