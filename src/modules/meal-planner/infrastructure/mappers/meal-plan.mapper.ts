import type { Tables } from '@/shared/types/database.types'
import type {
  MealPlan,
  MealPlanDay,
  MealSlot,
  MealAssignment,
  MealPlanConstraint,
} from '../../domain/meal-plan.types'

type MealPlanRow = Tables<'meal_plans'>
type MealPlanDayRow = Tables<'meal_plan_days'>
type MealSlotRow = Tables<'meal_slots'>
type MealAssignmentRow = Tables<'meal_assignments'>
type MealPlanConstraintRow = Tables<'meal_plan_constraints'>

export function mapMealPlan(row: MealPlanRow): MealPlan {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    week_start_date: row.week_start_date,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

export function mapMealPlanDay(row: MealPlanDayRow): MealPlanDay {
  return {
    id: row.id,
    meal_plan_id: row.meal_plan_id,
    date: row.date,
    position: row.position,
  }
}

export function mapMealSlot(row: MealSlotRow): MealSlot {
  return {
    id: row.id,
    meal_plan_day_id: row.meal_plan_day_id,
    meal_type: row.meal_type,
    slot_kind: row.slot_kind,
    target_servings: row.target_servings,
    position: row.position,
    notes: row.notes,
  }
}

export function mapMealAssignment(row: MealAssignmentRow): MealAssignment {
  return {
    id: row.id,
    meal_slot_id: row.meal_slot_id,
    recipe_id: row.recipe_id,
    servings: row.servings,
    source: row.source,
    position: row.position,
  }
}

export function mapMealPlanConstraint(row: MealPlanConstraintRow): MealPlanConstraint {
  return {
    id: row.id,
    meal_plan_id: row.meal_plan_id,
    constraint_type: row.constraint_type,
    hardness: row.hardness,
    numeric_value: row.numeric_value,
    macro_goal_value: row.macro_goal_value,
    text_value: row.text_value,
  }
}
