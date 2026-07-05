import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { ValidationError, NotFoundError, BusinessRuleError } from '@/shared/types'
import type { RecipeRepository } from '@/modules/knowledge-base'
import type { AssignRecipeToMealInput, MealAssignment } from '../../domain/meal-plan.types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

export type AssignRecipeToMealDeps = {
  mealPlanRepo: MealPlanRepository
  recipeRepo: RecipeRepository
}

// INV: servings > 0. INV: ownership del slot (a través del plan) — 404 si el
// slot no existe o pertenece a otro usuario. INV (domain-rules.md §7): el
// recipe_id debe existir y estar ACTIVE en Knowledge Base; si está DEPRECATED
// se rechaza. INV: una misma receta no puede asignarse dos veces al mismo slot.
export async function assignRecipeToMeal(
  input: AssignRecipeToMealInput,
  userId: string,
  deps: AssignRecipeToMealDeps,
): Promise<Result<MealAssignment>> {
  if (input.servings <= 0) {
    return err(new ValidationError({ servings: ['Las porciones deben ser mayores a 0'] }))
  }

  const slotCtx = await deps.mealPlanRepo.findSlotWithOwner(input.meal_slot_id)
  if (!slotCtx.ok) return slotCtx
  if (!slotCtx.data || slotCtx.data.ownerId !== userId) {
    return err(new NotFoundError('MEAL_SLOT_NOT_FOUND', input.meal_slot_id))
  }

  const recipeResult = await deps.recipeRepo.findById(input.recipe_id)
  if (!recipeResult.ok) return recipeResult
  if (!recipeResult.data) {
    return err(new NotFoundError('RECIPE_NOT_FOUND', input.recipe_id))
  }
  if (recipeResult.data.status === 'DEPRECATED') {
    return err(
      new BusinessRuleError('RECIPE_NOT_ASSIGNABLE', 'No se puede planificar una receta deprecada'),
    )
  }

  const existingAssignment = await deps.mealPlanRepo.findAssignmentBySlotAndRecipe(
    input.meal_slot_id,
    input.recipe_id,
  )
  if (!existingAssignment.ok) return existingAssignment
  if (existingAssignment.data) {
    return err(
      new BusinessRuleError('MEAL_SLOT_OCCUPIED', 'Esta receta ya está asignada a este espacio'),
    )
  }

  return deps.mealPlanRepo.createAssignment(
    input.meal_slot_id,
    input.recipe_id,
    input.servings,
    input.source ?? 'MANUAL',
  )
}
