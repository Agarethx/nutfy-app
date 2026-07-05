import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { ValidationError, NotFoundError } from '@/shared/types'
import type { MealPlan, UpdateMealPlanInput } from '../../domain/meal-plan.types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

// INV: ownership — un plan de otro usuario responde 404, nunca 403 (evita
// filtrar la existencia del recurso). INV: un plan soft-deleted no es editable.
export async function updateMealPlan(
  id: string,
  input: UpdateMealPlanInput,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<MealPlan>> {
  const existing = await repo.findById(id)
  if (!existing.ok) return existing
  if (!existing.data || existing.data.user_id !== userId) {
    return err(new NotFoundError('MEAL_PLAN_NOT_FOUND', id))
  }
  if (existing.data.deleted_at !== null) {
    return err(new ValidationError({ status: ['No se puede editar un plan eliminado'] }))
  }

  const errors: Record<string, string[]> = {}
  if (input.name !== undefined && input.name.trim().length < 2) {
    errors.name = ['El nombre debe tener al menos 2 caracteres']
  }
  if (Object.keys(errors).length > 0) return err(new ValidationError(errors))

  return repo.update(id, input)
}
