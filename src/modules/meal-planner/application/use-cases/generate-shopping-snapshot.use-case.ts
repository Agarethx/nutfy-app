import type { Result } from '@/shared/networking'
import { err, ok } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { RecipeRepository, RecipeWithDetails, StorageRepository } from '@/modules/knowledge-base'
import {
  MealPlanIngredientAggregator,
  type MealAssignmentForAggregation,
} from '../../domain/services/meal-plan-ingredient-aggregator'
import type { MealPlanShoppingSnapshotWithItems } from '../../domain/shopping-snapshot.types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'
import type { ShoppingSnapshotRepository } from '../../infrastructure/repositories/shopping-snapshot.repository'

export type GenerateShoppingSnapshotDeps = {
  mealPlanRepo: MealPlanRepository
  snapshotRepo: ShoppingSnapshotRepository
  recipeRepo: RecipeRepository
  storageRepo: StorageRepository
}

// Determinístico y sin dependencias externas (no crypto): describe el
// contenido exacto que produjo el snapshot, para detectar si el plan cambió
// desde la última generación sin tener que recomputar el agregado completo.
function computePlanSignature(planUpdatedAt: string, assignments: MealAssignmentForAggregation[]): string {
  const tokens = assignments
    .map((a) => `${a.recipe.id}:${a.servings}`)
    .sort()
    .join(',')
  return `updated_at=${planUpdatedAt}|assignments=${tokens}`
}

// Genera (o regenera) el MealPlanShoppingSnapshot de un plan a partir de las
// recetas actualmente asignadas en slots COOK_AT_HOME. NO genera una lista de
// compra (eso es del módulo Shopping List, Fase 6) — solo congela la demanda
// de ingredientes del plan en una nueva versión inmutable.
export async function generateShoppingSnapshot(
  mealPlanId: string,
  userId: string,
  deps: GenerateShoppingSnapshotDeps,
): Promise<Result<MealPlanShoppingSnapshotWithItems>> {
  const planResult = await deps.mealPlanRepo.findWithDetails(mealPlanId)
  if (!planResult.ok) return planResult
  if (!planResult.data || planResult.data.user_id !== userId || planResult.data.deleted_at !== null) {
    return err(new NotFoundError('MEAL_PLAN_NOT_FOUND', mealPlanId))
  }
  const plan = planResult.data

  const cookAtHomeAssignments = plan.days.flatMap((day) =>
    day.slots
      .filter((slot) => slot.slot_kind === 'COOK_AT_HOME')
      .flatMap((slot) => slot.assignments),
  )

  const uniqueRecipeIds = Array.from(new Set(cookAtHomeAssignments.map((a) => a.recipe_id)))

  const [recipeResults, unitsResult, conversionsResult] = await Promise.all([
    Promise.all(uniqueRecipeIds.map((id) => deps.recipeRepo.findWithDetails(id))),
    deps.storageRepo.listUnits(),
    deps.storageRepo.listUnitConversions(),
  ])

  for (const result of recipeResults) {
    if (!result.ok) return result
  }
  if (!unitsResult.ok) return unitsResult
  if (!conversionsResult.ok) return conversionsResult

  const recipesById = new Map<string, RecipeWithDetails>()
  for (const result of recipeResults) {
    if (result.ok && result.data) recipesById.set(result.data.id, result.data)
  }

  const assignmentsForAggregation: MealAssignmentForAggregation[] = cookAtHomeAssignments
    .map((a) => {
      const recipe = recipesById.get(a.recipe_id)
      return recipe ? { recipe, servings: a.servings } : null
    })
    .filter((a): a is MealAssignmentForAggregation => a !== null)

  const items = MealPlanIngredientAggregator.aggregate(
    assignmentsForAggregation,
    unitsResult.data,
    conversionsResult.data,
  )

  const planSignature = computePlanSignature(plan.updated_at, assignmentsForAggregation)

  return deps.snapshotRepo.generate(userId, mealPlanId, planSignature, items)
}
