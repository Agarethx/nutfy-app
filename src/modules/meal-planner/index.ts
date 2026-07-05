// ─── Public API del módulo Meal Planner ───────────────────────────────────────
// Única entrada pública. Otros módulos solo importan desde aquí.
// Ver docs/13-meal-planning.md para el diseño completo del dominio.
//
// Fase actual: dominio + persistencia + casos de uso fundamentales.
// Sin IA, sin UI, sin hooks activos — ver docs/03-roadmap.md Fase 5/2.

// ─── Domain types ─────────────────────────────────────────────────────────────

export type {
  MealType,
  NutritionalInfo,
  MealPlanStatus,
  SlotKind,
  AssignmentSource,
  ConstraintType,
  ConstraintHardness,
  MacroGoal,
  SnapshotStatus,
  MealPlanStatistics,
  DayStatistics,
} from './domain/shared.types'

export type {
  MealPlanDay,
  MealSlot,
  MealAssignment,
  MealPlanConstraint,
  MealPlan,
  MealSlotWithAssignments,
  MealPlanDayWithSlots,
  MealPlanWithDetails,
  MealDemandItem,
  MealSlotDraft,
  MealPlanDayDraft,
  CreateMealPlanConstraintInput,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  ListMealPlansInput,
  DuplicateMealPlanInput,
  AssignRecipeToMealInput,
  ChangeServingsInput,
} from './domain/meal-plan.types'

export type {
  MealPlanShoppingSnapshot,
  MealPlanShoppingSnapshotItem,
  MealPlanShoppingSnapshotWithItems,
  AggregatedIngredientDemand,
} from './domain/shopping-snapshot.types'

// ─── Domain Services ──────────────────────────────────────────────────────────

export { MealPlanScheduleBuilder } from './domain/services/meal-plan-schedule-builder'
export {
  MealPlanIngredientAggregator,
  type MealAssignmentForAggregation,
} from './domain/services/meal-plan-ingredient-aggregator'
export { MealPlanStatisticsCalculator } from './domain/services/meal-plan-statistics-calculator'

// ─── Infrastructure ───────────────────────────────────────────────────────────

export { MealPlanRepository } from './infrastructure/repositories/meal-plan.repository'
export { ShoppingSnapshotRepository } from './infrastructure/repositories/shopping-snapshot.repository'

// ─── Casos de uso ─────────────────────────────────────────────────────────────

export { createMealPlan } from './application/use-cases/create-meal-plan.use-case'
export { updateMealPlan } from './application/use-cases/update-meal-plan.use-case'
export { deleteMealPlan } from './application/use-cases/delete-meal-plan.use-case'
export { duplicateMealPlan } from './application/use-cases/duplicate-meal-plan.use-case'
export { getMealPlan, getMealPlanWithDetails } from './application/use-cases/get-meal-plan.use-case'
export { getCurrentWeekMealPlan } from './application/use-cases/get-current-week-meal-plan.use-case'
export {
  assignRecipeToMeal,
  type AssignRecipeToMealDeps,
} from './application/use-cases/assign-recipe-to-meal.use-case'
export { removeRecipeFromMeal } from './application/use-cases/remove-recipe-from-meal.use-case'
export { changeServings } from './application/use-cases/change-servings.use-case'
export {
  generateShoppingSnapshot,
  type GenerateShoppingSnapshotDeps,
} from './application/use-cases/generate-shopping-snapshot.use-case'

// ─── Query keys ───────────────────────────────────────────────────────────────

export { queryKeys as mealPlannerQueryKeys } from './application/query-keys'
