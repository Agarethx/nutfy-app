import type { Result } from '@/shared/networking'
import { ok } from '@/shared/networking'
import type { MealPlanWithDetails } from '../../domain/meal-plan.types'
import type { MealPlanRepository } from '../../infrastructure/repositories/meal-plan.repository'

// Lunes (UTC) de la semana que contiene `date`.
function mondayOfWeek(date: Date): string {
  const dow = date.getUTCDay() // 0 = domingo … 6 = sábado
  const daysSinceMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(date)
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday)
  return monday.toISOString().slice(0, 10)
}

// No encontrar un plan para la semana actual no es un error — es un estado
// válido ("el usuario todavía no planificó esta semana").
export async function getCurrentWeekMealPlan(
  userId: string,
  repo: MealPlanRepository,
  referenceDate: Date = new Date(),
): Promise<Result<MealPlanWithDetails | null>> {
  const weekStartDate = mondayOfWeek(referenceDate)

  const found = await repo.findByWeek(userId, weekStartDate)
  if (!found.ok) return found
  if (!found.data) return ok(null)

  return repo.findWithDetails(found.data.id)
}
