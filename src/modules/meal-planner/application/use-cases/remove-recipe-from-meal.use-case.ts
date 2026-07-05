import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

export async function removeRecipeFromMeal(
  mealAssignmentId: string,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<void>> {
  const ctx = await repo.findAssignmentWithOwner(mealAssignmentId)
  if (!ctx.ok) return ctx
  if (!ctx.data || ctx.data.ownerId !== userId) {
    return err(new NotFoundError('MEAL_ASSIGNMENT_NOT_FOUND', mealAssignmentId))
  }

  return repo.deleteAssignment(mealAssignmentId)
}
