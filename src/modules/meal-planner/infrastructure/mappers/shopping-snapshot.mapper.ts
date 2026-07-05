import type { Tables } from '@/shared/types/database.types'
import type {
  MealPlanShoppingSnapshot,
  MealPlanShoppingSnapshotItem,
} from '../../domain/shopping-snapshot.types'

type SnapshotRow = Tables<'meal_plan_shopping_snapshots'>
type SnapshotItemRow = Tables<'meal_plan_shopping_snapshot_items'>

export function mapShoppingSnapshot(row: SnapshotRow): MealPlanShoppingSnapshot {
  return {
    id: row.id,
    meal_plan_id: row.meal_plan_id,
    user_id: row.user_id,
    version: row.version,
    status: row.status,
    plan_signature: row.plan_signature,
    generated_at: row.generated_at,
  }
}

export function mapShoppingSnapshotItem(row: SnapshotItemRow): MealPlanShoppingSnapshotItem {
  return {
    id: row.id,
    snapshot_id: row.snapshot_id,
    ingredient_id: row.ingredient_id,
    unit_id: row.unit_id,
    total_quantity: row.total_quantity,
    recipe_count: row.recipe_count,
  }
}
