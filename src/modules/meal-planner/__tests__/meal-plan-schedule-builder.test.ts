import {
  MealPlanScheduleBuilder,
  addDaysISO,
  isMonday,
  ISO_DATE_RE,
} from '../domain/services/meal-plan-schedule-builder'
import { WEEK_START_DATE } from './fixtures'

describe('addDaysISO', () => {
  it('suma días dentro del mismo mes', () => {
    expect(addDaysISO('2026-06-29', 1)).toBe('2026-06-30')
  })

  it('cruza el límite de mes', () => {
    expect(addDaysISO('2026-06-29', 3)).toBe('2026-07-02')
  })

  it('con 0 días devuelve la misma fecha', () => {
    expect(addDaysISO('2026-06-29', 0)).toBe('2026-06-29')
  })
})

describe('isMonday', () => {
  it('reconoce un lunes', () => {
    expect(isMonday('2026-06-29')).toBe(true)
  })

  it('rechaza un domingo', () => {
    expect(isMonday('2026-06-28')).toBe(false)
  })

  it('rechaza un sábado', () => {
    expect(isMonday('2026-07-04')).toBe(false)
  })
})

describe('ISO_DATE_RE', () => {
  it('acepta YYYY-MM-DD', () => {
    expect(ISO_DATE_RE.test('2026-06-29')).toBe(true)
  })

  it('rechaza otros formatos', () => {
    expect(ISO_DATE_RE.test('29-06-2026')).toBe(false)
    expect(ISO_DATE_RE.test('2026/06/29')).toBe(false)
    expect(ISO_DATE_RE.test('2026-06-29T00:00:00Z')).toBe(false)
  })
})

describe('MealPlanScheduleBuilder.build', () => {
  describe('INV-01: siempre produce 7 días consecutivos', () => {
    it('devuelve exactamente 7 días', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [])
      expect(days).toHaveLength(7)
    })

    it('las fechas son consecutivas empezando en week_start_date', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [])
      expect(days.map((d) => d.date)).toEqual([
        '2026-06-29',
        '2026-06-30',
        '2026-07-01',
        '2026-07-02',
        '2026-07-03',
        '2026-07-04',
        '2026-07-05',
      ])
    })

    it('las posiciones son 0..6 en orden', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [])
      expect(days.map((d) => d.position)).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('sin demanda, todos los días tienen slots vacíos', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [])
      expect(days.every((d) => d.slots.length === 0)).toBe(true)
    })
  })

  describe('distribución de demanda', () => {
    it('reparte 5 ocurrencias uniformemente entre 7 días', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'lunch', slot_kind: 'COOK_AT_HOME', count: 5 },
      ])
      const daysWithLunch = days
        .map((d, i) => (d.slots.length > 0 ? i : null))
        .filter((i): i is number => i !== null)
      expect(daysWithLunch).toEqual([0, 1, 2, 4, 5])
    })

    it('reparte 4 ocurrencias uniformemente entre 7 días', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'dinner', slot_kind: 'COOK_AT_HOME', count: 4 },
      ])
      const daysWithDinner = days
        .map((d, i) => (d.slots.length > 0 ? i : null))
        .filter((i): i is number => i !== null)
      expect(daysWithDinner).toEqual([0, 1, 3, 5])
    })

    it('count=0 no genera ningún slot para ese item', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'snack', slot_kind: 'COOK_AT_HOME', count: 0 },
      ])
      expect(days.every((d) => d.slots.length === 0)).toBe(true)
    })

    it('count > 7 hace que algunos días reciban más de una ocurrencia', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'snack', slot_kind: 'COOK_AT_HOME', count: 9 },
      ])
      const total = days.reduce((sum, d) => sum + d.slots.length, 0)
      expect(total).toBe(9)
      expect(days.some((d) => d.slots.length > 1)).toBe(true)
    })

    it('combina varios items de demanda en el mismo día ordenados por meal_type', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'lunch', slot_kind: 'COOK_AT_HOME', count: 5 },
        { meal_type: 'dinner', slot_kind: 'COOK_AT_HOME', count: 4 },
        { meal_type: 'dinner', slot_kind: 'EAT_OUT', count: 2 },
      ])
      const day0 = days[0]
      expect(day0.slots.map((s) => ({ meal_type: s.meal_type, slot_kind: s.slot_kind }))).toEqual([
        { meal_type: 'lunch', slot_kind: 'COOK_AT_HOME' },
        { meal_type: 'dinner', slot_kind: 'COOK_AT_HOME' },
        { meal_type: 'dinner', slot_kind: 'EAT_OUT' },
      ])
    })

    it('asigna position secuencial (0..N) a los slots de cada día', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'lunch', slot_kind: 'COOK_AT_HOME', count: 5 },
        { meal_type: 'dinner', slot_kind: 'COOK_AT_HOME', count: 4 },
      ])
      const day0 = days[0]
      expect(day0.slots.map((s) => s.position)).toEqual([0, 1])
    })

    it('target_servings por defecto es 1 si no se especifica', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'lunch', slot_kind: 'COOK_AT_HOME', count: 1 },
      ])
      expect(days[0].slots[0].target_servings).toBe(1)
    })

    it('respeta target_servings explícito', () => {
      const days = MealPlanScheduleBuilder.build(WEEK_START_DATE, [
        { meal_type: 'lunch', slot_kind: 'COOK_AT_HOME', count: 1, target_servings: 4 },
      ])
      expect(days[0].slots[0].target_servings).toBe(4)
    })
  })
})
