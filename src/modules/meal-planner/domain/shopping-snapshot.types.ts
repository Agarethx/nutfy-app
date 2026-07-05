import type { SnapshotStatus } from './shared.types'

// ─── MealPlanShoppingSnapshot (agregado raíz, inmutable) ──────────────────────
// Congela la demanda de ingredientes de un MealPlan en un momento dado.
// NO es una lista de compra: no conoce inventario ni supermercados — eso es
// responsabilidad del módulo Shopping List (Fase 6), que consumirá este
// snapshot vía `getActivePlan`/lectura de Meal Planner.
// Regenerar crea una fila nueva con version + 1; la anterior pasa a SUPERSEDED.
// Nunca se actualiza el contenido de una versión existente (INV de inmutabilidad).
export type MealPlanShoppingSnapshot = {
  id: string
  meal_plan_id: string
  user_id: string
  version: number
  status: SnapshotStatus
  // Hash del contenido relevante del plan (recetas + servings asignados) en el
  // momento de generar. Permite detectar si el plan cambió desde la última
  // generación sin tener que recomputar el agregado completo.
  plan_signature: string
  generated_at: string
}

// Ingrediente agregado de todas las recetas asignadas al plan al momento del
// snapshot. ingredient_id/unit_id referencian Knowledge Base por lectura
// (ADR-005 también aplica aquí: no se copian datos nutricionales, solo la
// cantidad total demandada).
export type MealPlanShoppingSnapshotItem = {
  id: string
  snapshot_id: string
  ingredient_id: string
  unit_id: string
  total_quantity: number
  recipe_count: number
}

export type MealPlanShoppingSnapshotWithItems = MealPlanShoppingSnapshot & {
  items: MealPlanShoppingSnapshotItem[]
}

// ─── Salida del domain service de agregación (no persistida) ─────────────────
// MealPlanIngredientAggregator produce esta lista; el repositorio la persiste
// como filas de MealPlanShoppingSnapshotItem.
export type AggregatedIngredientDemand = {
  ingredient_id: string
  unit_id: string
  total_quantity: number
  recipe_count: number
}
