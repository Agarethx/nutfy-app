import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { ValidationError, NotFoundError, BusinessRuleError } from '@/shared/types'
import type { DuplicateMealPlanInput, MealPlanWithDetails } from '../../domain/meal-plan.types'
import { ISO_DATE_RE, isMonday } from '../../domain/services/meal-plan-schedule-builder'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

// Copia estructura completa (días/slots/asignaciones/restricciones) de un plan
// existente hacia una semana nueva. Útil para reutilizar una "buena semana"
// (precursor funcional de MealPlanTemplate, ver docs/13-meal-planning.md).
export async function duplicateMealPlan(
  sourcePlanId: string,
  input: DuplicateMealPlanInput,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<MealPlanWithDetails>> {
  const source = await repo.findWithDetails(sourcePlanId)
  if (!source.ok) return source
  if (!source.data || source.data.user_id !== userId || source.data.deleted_at !== null) {
    return err(new NotFoundError('MEAL_PLAN_NOT_FOUND', sourcePlanId))
  }

  const errors: Record<string, string[]> = {}
  if (!ISO_DATE_RE.test(input.new_week_start_date)) {
    errors.new_week_start_date = ['La fecha debe tener el formato YYYY-MM-DD']
  } else if (!isMonday(input.new_week_start_date)) {
    errors.new_week_start_date = ['La semana del plan debe empezar en lunes']
  }
  if (input.name !== undefined && input.name.trim().length < 2) {
    errors.name = ['El nombre debe tener al menos 2 caracteres']
  }
  if (Object.keys(errors).length > 0) return err(new ValidationError(errors))

  const existingForWeek = await repo.findByWeek(userId, input.new_week_start_date)
  if (!existingForWeek.ok) return existingForWeek
  if (existingForWeek.data) {
    return err(
      new BusinessRuleError(
        'MEAL_PLAN_WEEK_ALREADY_PLANNED',
        `Ya existe un plan para la semana ${input.new_week_start_date}`,
      ),
    )
  }

  const name = input.name ?? `${source.data.name} (copia)`
  return repo.duplicate(source.data, userId, input.new_week_start_date, name)
}
