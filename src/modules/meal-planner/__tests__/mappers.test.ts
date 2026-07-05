import {
  mapMealPlan,
  mapMealPlanDay,
  mapMealSlot,
  mapMealAssignment,
  mapMealPlanConstraint,
} from '../infrastructure/mappers/meal-plan.mapper'
import {
  mapShoppingSnapshot,
  mapShoppingSnapshotItem,
} from '../infrastructure/mappers/shopping-snapshot.mapper'

describe('mapMealPlan', () => {
  it('mapea todos los campos de la fila a Domain', () => {
    const row = {
      id: 'plan-001',
      user_id: 'user-001',
      name: 'Mi semana',
      week_start_date: '2026-06-29',
      status: 'DRAFT' as const,
      notes: 'algunas notas',
      created_at: '2026-06-28T00:00:00Z',
      updated_at: '2026-06-28T00:00:00Z',
      deleted_at: null,
    }
    expect(mapMealPlan(row)).toEqual({
      id: 'plan-001',
      user_id: 'user-001',
      name: 'Mi semana',
      week_start_date: '2026-06-29',
      status: 'DRAFT',
      notes: 'algunas notas',
      created_at: '2026-06-28T00:00:00Z',
      updated_at: '2026-06-28T00:00:00Z',
      deleted_at: null,
    })
  })
})

describe('mapMealPlanDay', () => {
  it('mapea la fila a Domain', () => {
    const row = {
      id: 'day-001',
      meal_plan_id: 'plan-001',
      date: '2026-06-29',
      position: 0,
      created_at: '2026-06-28T00:00:00Z',
      updated_at: '2026-06-28T00:00:00Z',
    }
    expect(mapMealPlanDay(row)).toEqual({
      id: 'day-001',
      meal_plan_id: 'plan-001',
      date: '2026-06-29',
      position: 0,
    })
  })
})

describe('mapMealSlot', () => {
  it('mapea la fila a Domain', () => {
    const row = {
      id: 'slot-001',
      meal_plan_day_id: 'day-001',
      meal_type: 'lunch' as const,
      slot_kind: 'COOK_AT_HOME' as const,
      target_servings: 2,
      position: 0,
      notes: null,
      created_at: '2026-06-28T00:00:00Z',
      updated_at: '2026-06-28T00:00:00Z',
    }
    expect(mapMealSlot(row)).toEqual({
      id: 'slot-001',
      meal_plan_day_id: 'day-001',
      meal_type: 'lunch',
      slot_kind: 'COOK_AT_HOME',
      target_servings: 2,
      position: 0,
      notes: null,
    })
  })
})

describe('mapMealAssignment', () => {
  it('mapea la fila a Domain', () => {
    const row = {
      id: 'assign-001',
      meal_slot_id: 'slot-001',
      recipe_id: 'rec-001',
      servings: 2,
      source: 'MANUAL' as const,
      position: 0,
      created_at: '2026-06-28T00:00:00Z',
      updated_at: '2026-06-28T00:00:00Z',
    }
    expect(mapMealAssignment(row)).toEqual({
      id: 'assign-001',
      meal_slot_id: 'slot-001',
      recipe_id: 'rec-001',
      servings: 2,
      source: 'MANUAL',
      position: 0,
    })
  })
})

describe('mapMealPlanConstraint', () => {
  it('mapea una restricción numérica', () => {
    const row = {
      id: 'constraint-001',
      meal_plan_id: 'plan-001',
      constraint_type: 'MAX_COOK_TIME_MIN' as const,
      hardness: 'HARD' as const,
      numeric_value: 120,
      macro_goal_value: null,
      text_value: null,
      created_at: '2026-06-28T00:00:00Z',
      updated_at: '2026-06-28T00:00:00Z',
    }
    expect(mapMealPlanConstraint(row)).toEqual({
      id: 'constraint-001',
      meal_plan_id: 'plan-001',
      constraint_type: 'MAX_COOK_TIME_MIN',
      hardness: 'HARD',
      numeric_value: 120,
      macro_goal_value: null,
      text_value: null,
    })
  })

  it('mapea una restricción de macro_goal', () => {
    const row = {
      id: 'constraint-002',
      meal_plan_id: 'plan-001',
      constraint_type: 'MACRO_GOAL' as const,
      hardness: 'SOFT' as const,
      numeric_value: null,
      macro_goal_value: 'HIGH_PROTEIN' as const,
      text_value: null,
      created_at: '2026-06-28T00:00:00Z',
      updated_at: '2026-06-28T00:00:00Z',
    }
    expect(mapMealPlanConstraint(row).macro_goal_value).toBe('HIGH_PROTEIN')
  })
})

describe('mapShoppingSnapshot', () => {
  it('mapea la fila a Domain', () => {
    const row = {
      id: 'snap-001',
      meal_plan_id: 'plan-001',
      user_id: 'user-001',
      version: 1,
      status: 'ACTIVE' as const,
      plan_signature: 'sig-abc',
      generated_at: '2026-06-28T00:00:00Z',
    }
    expect(mapShoppingSnapshot(row)).toEqual({
      id: 'snap-001',
      meal_plan_id: 'plan-001',
      user_id: 'user-001',
      version: 1,
      status: 'ACTIVE',
      plan_signature: 'sig-abc',
      generated_at: '2026-06-28T00:00:00Z',
    })
  })
})

describe('mapShoppingSnapshotItem', () => {
  it('mapea la fila a Domain', () => {
    const row = {
      id: 'item-001',
      snapshot_id: 'snap-001',
      ingredient_id: 'ing-chicken',
      unit_id: 'unit-g',
      total_quantity: 400,
      recipe_count: 2,
      created_at: '2026-06-28T00:00:00Z',
    }
    expect(mapShoppingSnapshotItem(row)).toEqual({
      id: 'item-001',
      snapshot_id: 'snap-001',
      ingredient_id: 'ing-chicken',
      unit_id: 'unit-g',
      total_quantity: 400,
      recipe_count: 2,
    })
  })
})
