// Enumeraciones y Value Objects compartidos dentro del módulo Meal Planner.
// Este archivo no importa nada externo — puro TypeScript (excepto MealType,
// reusado de shared.types del proyecto para no duplicar la definición).

export type { MealType } from '@/shared/types'
// Reusado de Knowledge Base (ADR-015): las estadísticas del plan se computan
// con NutritionCalculator, que trabaja sobre este mismo Value Object.
import type { NutritionalInfo } from '@/modules/knowledge-base'
export type { NutritionalInfo }

// ─── Enumeraciones ────────────────────────────────────────────────────────────

export type MealPlanStatus = 'DRAFT' | 'ACTIVE' | 'FINALIZED' | 'ARCHIVED'

// COOK_AT_HOME es la única variante que genera demanda de ingredientes
// (MealPlanIngredientAggregator ignora EAT_OUT/LEFTOVERS/SKIP).
export type SlotKind = 'COOK_AT_HOME' | 'EAT_OUT' | 'LEFTOVERS' | 'SKIP'

export type AssignmentSource = 'MANUAL' | 'AI_SUGGESTED' | 'TEMPLATE'

export type ConstraintType =
  | 'MAX_COOK_TIME_MIN'
  | 'MAX_ACTIVE_TIME_MIN'
  | 'MACRO_GOAL'
  | 'PREFER_CUISINE'
  | 'AVOID_INGREDIENT'
  | 'MAX_BUDGET_TOTAL'

export type ConstraintHardness = 'HARD' | 'SOFT'

export type MacroGoal =
  | 'HIGH_PROTEIN'
  | 'LOW_CALORIE'
  | 'LOW_CARB'
  | 'HIGH_FIBER'
  | 'MUSCLE_GAIN'
  | 'BALANCED'

export type SnapshotStatus = 'ACTIVE' | 'SUPERSEDED'

// ─── Value Objects ────────────────────────────────────────────────────────────

// Salida de MealPlanStatisticsCalculator. Nunca se persiste (ADR-005 aplicado
// también aquí): siempre se computa on-demand a partir de las recetas asignadas.
export type MealPlanStatistics = {
  total_cook_time_min: number
  meals_planned: number
  meals_cook_at_home: number
  meals_eat_out: number
  weekly_nutrition: NutritionalInfo
  by_day: DayStatistics[]
}

export type DayStatistics = {
  date: string
  cook_time_min: number
  meals_planned: number
  nutrition: NutritionalInfo
}
