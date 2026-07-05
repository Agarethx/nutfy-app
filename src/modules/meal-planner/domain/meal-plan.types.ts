import type {
  MealType,
  MealPlanStatus,
  SlotKind,
  AssignmentSource,
  ConstraintType,
  ConstraintHardness,
  MacroGoal,
} from './shared.types'

// ─── Miembros del agregado MealPlan ───────────────────────────────────────────

// INV: pertenece a un único MealPlan; date debe caer dentro de la semana del
// plan padre y position (0-6) debe corresponder a week_start_date + position
// días — invariante cross-agregado validada en el use-case, no en el tipo.
export type MealPlanDay = {
  id: string
  meal_plan_id: string
  date: string // YYYY-MM-DD
  position: number // 0 = lunes … 6 = domingo
}

// Una ocasión de comer dentro de un día. Puede no tener ninguna asignación
// (demanda declarada, aún sin receta — el motor de Fase 2 la completará).
// slot_kind = COOK_AT_HOME es la única variante con demanda de ingredientes;
// EAT_OUT/LEFTOVERS/SKIP no requieren receta ni participan del shopping snapshot.
export type MealSlot = {
  id: string
  meal_plan_day_id: string
  meal_type: MealType
  slot_kind: SlotKind
  target_servings: number
  position: number
  notes: string | null
}

// Receta puesta en un slot. INV: una misma receta no puede asignarse dos veces
// al mismo slot (unique en DB). Varias asignaciones por slot = comida compuesta
// (ej. plato principal + guarnición).
export type MealAssignment = {
  id: string
  meal_slot_id: string
  recipe_id: string
  servings: number
  source: AssignmentSource
  position: number
}

// Restricción de planificación del plan (absorbe MealPreference/PlanningConstraint
// del diseño original en un solo modelo extensible). Exactamente uno de
// numeric_value / macro_goal_value / text_value está poblado, según constraint_type
// (ver CHECK de la tabla meal_plan_constraints).
export type MealPlanConstraint = {
  id: string
  meal_plan_id: string
  constraint_type: ConstraintType
  hardness: ConstraintHardness
  numeric_value: number | null
  macro_goal_value: MacroGoal | null
  text_value: string | null
}

// ─── MealPlan (agregado raíz) ─────────────────────────────────────────────────
// week_start_date siempre lunes. Un plan = una semana (planificación mensual
// futura = varios planes consecutivos, ver docs/13-meal-planning.md MEJORA-XX).
// deleted_at: soft delete real (a diferencia del lifecycle_status de Knowledge
// Base) — los planes son datos transitorios de uso semanal, no un catálogo.
export type MealPlan = {
  id: string
  user_id: string
  name: string
  week_start_date: string // YYYY-MM-DD, siempre lunes
  status: MealPlanStatus
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type MealSlotWithAssignments = MealSlot & {
  assignments: MealAssignment[]
}

export type MealPlanDayWithSlots = MealPlanDay & {
  slots: MealSlotWithAssignments[]
}

// MealPlan con todos sus miembros del agregado cargados
export type MealPlanWithDetails = MealPlan & {
  days: MealPlanDayWithSlots[]
  constraints: MealPlanConstraint[]
}

// ─── Especificación de demanda (input de creación) ────────────────────────────
// No es un tipo persistido: describe cuántos slots de cada tipo debe construir
// MealPlanScheduleBuilder ("5 almuerzos, 4 cenas, 2 comidas afuera").
export type MealDemandItem = {
  meal_type: MealType
  slot_kind: SlotKind
  count: number
  target_servings?: number
}

// ─── Borradores del schedule builder (no persistidos) ─────────────────────────
// Salida pura de MealPlanScheduleBuilder antes de que el repositorio los
// inserte y les asigne id.
export type MealSlotDraft = {
  meal_type: MealType
  slot_kind: SlotKind
  target_servings: number
  position: number
}

export type MealPlanDayDraft = {
  date: string
  position: number
  slots: MealSlotDraft[]
}

// ─── Inputs de restricciones ──────────────────────────────────────────────────

// Un literal por miembro (en vez de agrupar MAX_COOK_TIME_MIN|MAX_ACTIVE_TIME_MIN
// bajo un solo miembro) para que TypeScript pueda angostar el discriminated
// union de forma fiable con simples `if (c.constraint_type === '...')`.
export type CreateMealPlanConstraintInput =
  | { constraint_type: 'MAX_COOK_TIME_MIN'; hardness?: ConstraintHardness; numeric_value: number }
  | { constraint_type: 'MAX_ACTIVE_TIME_MIN'; hardness?: ConstraintHardness; numeric_value: number }
  | { constraint_type: 'MAX_BUDGET_TOTAL'; hardness?: ConstraintHardness; numeric_value: number }
  | { constraint_type: 'MACRO_GOAL'; hardness?: ConstraintHardness; macro_goal_value: MacroGoal }
  | { constraint_type: 'PREFER_CUISINE'; hardness?: ConstraintHardness; text_value: string }
  | { constraint_type: 'AVOID_INGREDIENT'; hardness?: ConstraintHardness; text_value: string }

// ─── Inputs de casos de uso ───────────────────────────────────────────────────

export type CreateMealPlanInput = {
  name: string
  week_start_date: string
  demand: MealDemandItem[]
  constraints?: CreateMealPlanConstraintInput[]
  notes?: string
}

export type UpdateMealPlanInput = {
  name?: string
  notes?: string
  status?: MealPlanStatus
}

export type ListMealPlansInput = {
  status?: MealPlanStatus
  limit?: number
  offset?: number
}

export type DuplicateMealPlanInput = {
  new_week_start_date: string
  name?: string
}

export type AssignRecipeToMealInput = {
  meal_slot_id: string
  recipe_id: string
  servings: number
  source?: AssignmentSource
}

export type ChangeServingsInput = {
  meal_assignment_id: string
  servings: number
}
