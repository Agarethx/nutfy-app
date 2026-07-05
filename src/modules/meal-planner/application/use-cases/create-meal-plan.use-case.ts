import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { ValidationError, BusinessRuleError } from '@/shared/types'
import type { CreateMealPlanInput, MealPlanWithDetails } from '../../domain/meal-plan.types'
import {
  MealPlanScheduleBuilder,
  ISO_DATE_RE,
  isMonday,
} from '../../domain/services/meal-plan-schedule-builder'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

// INV-01: un plan no puede existir sin días (siempre 7, ver ScheduleBuilder).
// INV: la demanda debe describir al menos una comida.
export async function createMealPlan(
  input: CreateMealPlanInput,
  userId: string,
  repo: MealPlanRepository,
): Promise<Result<MealPlanWithDetails>> {
  const errors: Record<string, string[]> = {}

  if (!input.name || input.name.trim().length < 2) {
    errors.name = ['El nombre debe tener al menos 2 caracteres']
  }

  if (!ISO_DATE_RE.test(input.week_start_date)) {
    errors.week_start_date = ['La fecha debe tener el formato YYYY-MM-DD']
  } else if (!isMonday(input.week_start_date)) {
    errors.week_start_date = ['La semana del plan debe empezar en lunes']
  }

  if (!input.demand || input.demand.length === 0) {
    errors.demand = ['El plan debe incluir al menos una comida']
  } else if (input.demand.some((d) => d.count <= 0)) {
    errors.demand = ['Cada tipo de comida debe tener una cantidad mayor a 0']
  }

  for (const constraint of input.constraints ?? []) {
    if (
      (constraint.constraint_type === 'MAX_COOK_TIME_MIN' ||
        constraint.constraint_type === 'MAX_ACTIVE_TIME_MIN' ||
        constraint.constraint_type === 'MAX_BUDGET_TOTAL') &&
      constraint.numeric_value <= 0
    ) {
      errors.constraints = ['El valor numérico de una restricción debe ser mayor a 0']
    }
  }

  if (Object.keys(errors).length > 0) return err(new ValidationError(errors))

  const existing = await repo.findByWeek(userId, input.week_start_date)
  if (!existing.ok) return existing
  if (existing.data) {
    return err(
      new BusinessRuleError(
        'MEAL_PLAN_WEEK_ALREADY_PLANNED',
        `Ya existe un plan para la semana ${input.week_start_date}`,
      ),
    )
  }

  const days = MealPlanScheduleBuilder.build(input.week_start_date, input.demand)

  return repo.create(
    userId,
    { name: input.name, week_start_date: input.week_start_date, notes: input.notes },
    days,
    input.constraints ?? [],
  )
}
