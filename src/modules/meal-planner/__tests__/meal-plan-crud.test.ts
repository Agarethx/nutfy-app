import { createMealPlan } from '../application/use-cases/create-meal-plan.use-case'
import { updateMealPlan } from '../application/use-cases/update-meal-plan.use-case'
import { deleteMealPlan } from '../application/use-cases/delete-meal-plan.use-case'
import { duplicateMealPlan } from '../application/use-cases/duplicate-meal-plan.use-case'
import { ValidationError, NotFoundError, BusinessRuleError } from '@/shared/types'
import { ok, err } from '@/shared/networking'
import {
  USER_ID,
  OTHER_USER_ID,
  WEEK_START_DATE,
  makeCreateMealPlanInput,
  makeMealPlan,
  makeMealPlanWithDetails,
  mockMealPlanRepo,
} from './fixtures'

describe('createMealPlan use-case', () => {
  describe('INV: nombre válido', () => {
    it('falla si el nombre está vacío', async () => {
      const result = await createMealPlan(makeCreateMealPlanInput({ name: '' }), USER_ID, mockMealPlanRepo())
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect((result.error as ValidationError).fields.name).toBeDefined()
      }
    })
  })

  describe('INV-01: la semana debe empezar en lunes', () => {
    it('falla si week_start_date no es lunes', async () => {
      const result = await createMealPlan(
        makeCreateMealPlanInput({ week_start_date: '2026-06-28' }),
        USER_ID,
        mockMealPlanRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect((result.error as ValidationError).fields.week_start_date).toBeDefined()
      }
    })

    it('falla si el formato de fecha es inválido', async () => {
      const result = await createMealPlan(
        makeCreateMealPlanInput({ week_start_date: '29-06-2026' }),
        USER_ID,
        mockMealPlanRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect((result.error as ValidationError).fields.week_start_date).toBeDefined()
      }
    })

    it('acepta un lunes válido', async () => {
      const result = await createMealPlan(makeCreateMealPlanInput(), USER_ID, mockMealPlanRepo())
      expect(result.ok).toBe(true)
    })
  })

  describe('INV: el plan debe incluir al menos una comida', () => {
    it('falla con demanda vacía', async () => {
      const result = await createMealPlan(makeCreateMealPlanInput({ demand: [] }), USER_ID, mockMealPlanRepo())
      expect(result.ok).toBe(false)
      if (!result.ok) expect((result.error as ValidationError).fields.demand).toBeDefined()
    })

    it('falla si algún item de demanda tiene count <= 0', async () => {
      const result = await createMealPlan(
        makeCreateMealPlanInput({ demand: [{ meal_type: 'lunch', slot_kind: 'COOK_AT_HOME', count: 0 }] }),
        USER_ID,
        mockMealPlanRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect((result.error as ValidationError).fields.demand).toBeDefined()
    })
  })

  describe('INV: restricciones numéricas > 0', () => {
    it('falla si numeric_value <= 0', async () => {
      const result = await createMealPlan(
        makeCreateMealPlanInput({
          constraints: [{ constraint_type: 'MAX_COOK_TIME_MIN', numeric_value: 0 }],
        }),
        USER_ID,
        mockMealPlanRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect((result.error as ValidationError).fields.constraints).toBeDefined()
    })
  })

  describe('INV: un plan por usuario y semana', () => {
    it('falla si ya existe un plan para esa semana', async () => {
      const repo = mockMealPlanRepo({ findByWeek: jest.fn().mockResolvedValue(ok(makeMealPlan())) })
      const result = await createMealPlan(makeCreateMealPlanInput(), USER_ID, repo)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(BusinessRuleError)
        expect((result.error as BusinessRuleError).code).toBe('MEAL_PLAN_WEEK_ALREADY_PLANNED')
      }
    })
  })

  it('delega al repositorio con los días construidos por el schedule builder', async () => {
    const repo = mockMealPlanRepo()
    await createMealPlan(makeCreateMealPlanInput(), USER_ID, repo)
    expect(repo.create).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ name: 'Mi semana', week_start_date: WEEK_START_DATE }),
      expect.any(Array),
      expect.any(Array),
    )
    const daysArg = (repo.create as jest.Mock).mock.calls[0][2]
    expect(daysArg).toHaveLength(7)
  })

  it('propaga el error del repositorio', async () => {
    const repo = mockMealPlanRepo({ create: jest.fn().mockResolvedValue(err(new Error('DB down'))) })
    const result = await createMealPlan(makeCreateMealPlanInput(), USER_ID, repo)
    expect(result.ok).toBe(false)
  })
})

describe('updateMealPlan use-case', () => {
  describe('ownership', () => {
    it('falla si el plan no existe', async () => {
      const repo = mockMealPlanRepo({ findById: jest.fn().mockResolvedValue(ok(null)) })
      const result = await updateMealPlan('plan-999', { name: 'X' }, USER_ID, repo)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
    })

    it('falla si el plan pertenece a otro usuario', async () => {
      const repo = mockMealPlanRepo({
        findById: jest.fn().mockResolvedValue(ok(makeMealPlan({ user_id: OTHER_USER_ID }))),
      })
      const result = await updateMealPlan('plan-001', { name: 'X' }, USER_ID, repo)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(NotFoundError)
        expect((result.error as NotFoundError).code).toBe('MEAL_PLAN_NOT_FOUND')
      }
    })

    it('acepta si el usuario es el dueño', async () => {
      const result = await updateMealPlan('plan-001', { name: 'Nuevo nombre' }, USER_ID, mockMealPlanRepo())
      expect(result.ok).toBe(true)
    })
  })

  describe('soft delete: un plan eliminado no es editable', () => {
    it('falla al intentar editar un plan con deleted_at', async () => {
      const repo = mockMealPlanRepo({
        findById: jest.fn().mockResolvedValue(ok(makeMealPlan({ deleted_at: '2026-07-01T00:00:00Z' }))),
      })
      const result = await updateMealPlan('plan-001', { name: 'X' }, USER_ID, repo)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError)
    })
  })

  it('falla si el nuevo nombre tiene menos de 2 caracteres', async () => {
    const result = await updateMealPlan('plan-001', { name: 'X' }, USER_ID, mockMealPlanRepo())
    expect(result.ok).toBe(false)
    if (!result.ok) expect((result.error as ValidationError).fields.name).toBeDefined()
  })

  it('delega al repositorio', async () => {
    const repo = mockMealPlanRepo()
    await updateMealPlan('plan-001', { notes: 'nuevo' }, USER_ID, repo)
    expect(repo.update).toHaveBeenCalledWith('plan-001', { notes: 'nuevo' })
  })
})

describe('deleteMealPlan use-case', () => {
  it('falla si el plan no existe', async () => {
    const repo = mockMealPlanRepo({ findById: jest.fn().mockResolvedValue(ok(null)) })
    const result = await deleteMealPlan('plan-999', USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('falla si el plan pertenece a otro usuario', async () => {
    const repo = mockMealPlanRepo({
      findById: jest.fn().mockResolvedValue(ok(makeMealPlan({ user_id: OTHER_USER_ID }))),
    })
    const result = await deleteMealPlan('plan-001', USER_ID, repo)
    expect(result.ok).toBe(false)
  })

  it('es idempotente: eliminar un plan ya eliminado no falla', async () => {
    const repo = mockMealPlanRepo({
      findById: jest.fn().mockResolvedValue(ok(makeMealPlan({ deleted_at: '2026-07-01T00:00:00Z' }))),
    })
    const result = await deleteMealPlan('plan-001', USER_ID, repo)
    expect(result.ok).toBe(true)
    expect(repo.softDelete).not.toHaveBeenCalled()
  })

  it('llama a softDelete cuando el plan es del dueño y no está eliminado', async () => {
    const repo = mockMealPlanRepo()
    await deleteMealPlan('plan-001', USER_ID, repo)
    expect(repo.softDelete).toHaveBeenCalledWith('plan-001')
  })
})

describe('duplicateMealPlan use-case', () => {
  it('falla si el plan origen no existe o no es del dueño', async () => {
    const repo = mockMealPlanRepo({ findWithDetails: jest.fn().mockResolvedValue(ok(null)) })
    const result = await duplicateMealPlan('plan-001', { new_week_start_date: '2026-07-06' }, USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('falla si new_week_start_date no es lunes', async () => {
    const repo = mockMealPlanRepo()
    const result = await duplicateMealPlan('plan-001', { new_week_start_date: '2026-07-07' }, USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError)
  })

  it('falla si ya existe un plan para la nueva semana', async () => {
    const repo = mockMealPlanRepo({ findByWeek: jest.fn().mockResolvedValue(ok(makeMealPlan())) })
    const result = await duplicateMealPlan('plan-001', { new_week_start_date: '2026-07-06' }, USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect((result.error as BusinessRuleError).code).toBe('MEAL_PLAN_WEEK_ALREADY_PLANNED')
  })

  it('usa "{name} (copia)" cuando no se especifica un nombre nuevo', async () => {
    const repo = mockMealPlanRepo({
      findWithDetails: jest.fn().mockResolvedValue(ok(makeMealPlanWithDetails({ name: 'Semana X' }))),
    })
    await duplicateMealPlan('plan-001', { new_week_start_date: '2026-07-06' }, USER_ID, repo)
    expect(repo.duplicate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Semana X' }),
      USER_ID,
      '2026-07-06',
      'Semana X (copia)',
    )
  })

  it('respeta el nombre explícito si se provee', async () => {
    const repo = mockMealPlanRepo()
    await duplicateMealPlan(
      'plan-001',
      { new_week_start_date: '2026-07-06', name: 'Copia manual' },
      USER_ID,
      repo,
    )
    expect(repo.duplicate).toHaveBeenCalledWith(expect.anything(), USER_ID, '2026-07-06', 'Copia manual')
  })
})
