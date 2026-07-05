import type { Result } from '@/shared/networking'
import { err, ok } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

// Soft delete (INV): nunca se borra físicamente un plan — deleted_at marca la
// eliminación. Idempotente: eliminar un plan ya eliminado no es un error.
export async function deleteMealPlan(
  id: string,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<void>> {
  const existing = await repo.findById(id)
  if (!existing.ok) return existing
  if (!existing.data || existing.data.user_id !== userId) {
    return err(new NotFoundError('MEAL_PLAN_NOT_FOUND', id))
  }
  if (existing.data.deleted_at !== null) return ok(undefined)

  return repo.softDelete(id)
}
