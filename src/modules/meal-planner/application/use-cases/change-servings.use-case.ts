import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { ValidationError, NotFoundError } from '@/shared/types'
import type { ChangeServingsInput, MealAssignment } from '../../domain/meal-plan.types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

export async function changeServings(
  input: ChangeServingsInput,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<MealAssignment>> {
  if (input.servings <= 0) {
    return err(new ValidationError({ servings: ['Las porciones deben ser mayores a 0'] }))
  }

  const ctx = await repo.findAssignmentWithOwner(input.meal_assignment_id)
  if (!ctx.ok) return ctx
  if (!ctx.data || ctx.data.ownerId !== userId) {
    return err(new NotFoundError('MEAL_ASSIGNMENT_NOT_FOUND', input.meal_assignment_id))
  }

  return repo.updateAssignmentServings(input.meal_assignment_id, input.servings)
}
