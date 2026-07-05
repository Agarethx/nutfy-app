import type { Result } from '@/shared/networking'
import { ok, err } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { MealPlan, MealPlanWithDetails } from '../../domain/meal-plan.types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

// Ownership + soft delete (INV): un plan de otro usuario o eliminado responde
// 404, nunca 403 — evita filtrar la existencia del recurso.
export async function getMealPlan(
  id: string,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<MealPlan>> {
  const result = await repo.findById(id)
  if (!result.ok) return result
  if (!result.data || result.data.user_id !== userId || result.data.deleted_at !== null) {
    return err(new NotFoundError('MEAL_PLAN_NOT_FOUND', id))
  }
  return ok(result.data)
}

export async function getMealPlanWithDetails(
  id: string,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<MealPlanWithDetails>> {
  const result = await repo.findWithDetails(id)
  if (!result.ok) return result
  if (!result.data || result.data.user_id !== userId || result.data.deleted_at !== null) {
    return err(new NotFoundError('MEAL_PLAN_NOT_FOUND', id))
  }
  return ok(result.data)
}
