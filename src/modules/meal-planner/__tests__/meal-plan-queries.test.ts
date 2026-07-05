import { getMealPlan, getMealPlanWithDetails } from '../application/use-cases/get-meal-plan.use-case'
import { getCurrentWeekMealPlan } from '../application/use-cases/get-current-week-meal-plan.use-case'
import { NotFoundError } from '@/shared/types'
import { ok } from '@/shared/networking'
import {
  OTHER_USER_ID,
  USER_ID,
  makeMealPlan,
  makeMealPlanWithDetails,
  mockMealPlanRepo,
} from './fixtures'

describe('getMealPlan use-case', () => {
  it('devuelve el plan si el usuario es el dueño', async () => {
    const result = await getMealPlan('plan-001', USER_ID, mockMealPlanRepo())
    expect(result.ok).toBe(true)
  })

  it('falla con 404 si el plan no existe', async () => {
    const repo = mockMealPlanRepo({ findById: jest.fn().mockResolvedValue(ok(null)) })
    const result = await getMealPlan('plan-999', USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('falla con 404 (no 403) si el plan es de otro usuario', async () => {
    const repo = mockMealPlanRepo({
      findById: jest.fn().mockResolvedValue(ok(makeMealPlan({ user_id: OTHER_USER_ID }))),
    })
    const result = await getMealPlan('plan-001', USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect((result.error as NotFoundError).code).toBe('MEAL_PLAN_NOT_FOUND')
  })

  it('falla con 404 si el plan está soft-deleted', async () => {
    const repo = mockMealPlanRepo({
      findById: jest.fn().mockResolvedValue(ok(makeMealPlan({ deleted_at: '2026-07-01T00:00:00Z' }))),
    })
    const result = await getMealPlan('plan-001', USER_ID, repo)
    expect(result.ok).toBe(false)
  })
})

describe('getMealPlanWithDetails use-case', () => {
  it('devuelve el plan con detalles si el usuario es el dueño', async () => {
    const result = await getMealPlanWithDetails('plan-001', USER_ID, mockMealPlanRepo())
    expect(result.ok).toBe(true)
  })

  it('falla con 404 si pertenece a otro usuario', async () => {
    const repo = mockMealPlanRepo({
      findWithDetails: jest.fn().mockResolvedValue(ok(makeMealPlanWithDetails({ user_id: OTHER_USER_ID }))),
    })
    const result = await getMealPlanWithDetails('plan-001', USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
  })
})

describe('getCurrentWeekMealPlan use-case', () => {
  it('devuelve null si no hay plan para la semana actual (no es un error)', async () => {
    const repo = mockMealPlanRepo({ findByWeek: jest.fn().mockResolvedValue(ok(null)) })
    const result = await getCurrentWeekMealPlan(USER_ID, repo, new Date('2026-07-01T12:00:00Z'))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toBeNull()
  })

  it('calcula el lunes de la semana a partir de una fecha de referencia', async () => {
    const repo = mockMealPlanRepo({ findByWeek: jest.fn().mockResolvedValue(ok(null)) })
    // 2026-07-01 es miércoles → el lunes de esa semana es 2026-06-29
    await getCurrentWeekMealPlan(USER_ID, repo, new Date('2026-07-01T12:00:00Z'))
    expect(repo.findByWeek).toHaveBeenCalledWith(USER_ID, '2026-06-29')
  })

  it('cuando la referencia ya es lunes, usa esa misma fecha', async () => {
    const repo = mockMealPlanRepo({ findByWeek: jest.fn().mockResolvedValue(ok(null)) })
    await getCurrentWeekMealPlan(USER_ID, repo, new Date('2026-06-29T00:00:00Z'))
    expect(repo.findByWeek).toHaveBeenCalledWith(USER_ID, '2026-06-29')
  })

  it('cuando la referencia es domingo, retrocede 6 días hasta el lunes', async () => {
    const repo = mockMealPlanRepo({ findByWeek: jest.fn().mockResolvedValue(ok(null)) })
    await getCurrentWeekMealPlan(USER_ID, repo, new Date('2026-07-05T00:00:00Z'))
    expect(repo.findByWeek).toHaveBeenCalledWith(USER_ID, '2026-06-29')
  })

  it('devuelve el plan con detalles si existe uno para la semana', async () => {
    const repo = mockMealPlanRepo({
      findByWeek: jest.fn().mockResolvedValue(ok(makeMealPlan())),
      findWithDetails: jest.fn().mockResolvedValue(ok(makeMealPlanWithDetails())),
    })
    const result = await getCurrentWeekMealPlan(USER_ID, repo, new Date('2026-06-29T00:00:00Z'))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).not.toBeNull()
  })
})
