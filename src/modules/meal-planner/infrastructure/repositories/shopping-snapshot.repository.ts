import { BaseRepository, mapResponse, mapNullableResponse, wrapError, ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import type { Tables } from '@/shared/types/database.types'
import { mapShoppingSnapshot, mapShoppingSnapshotItem } from '../mappers/shopping-snapshot.mapper'
import type {
  MealPlanShoppingSnapshotWithItems,
  AggregatedIngredientDemand,
} from '../../domain/shopping-snapshot.types'

type SnapshotItemRow = Tables<'meal_plan_shopping_snapshot_items'>

export class ShoppingSnapshotRepository extends BaseRepository {
  async findActiveByPlan(mealPlanId: string): Promise<Result<MealPlanShoppingSnapshotWithItems | null>> {
    try {
      const response = await this.db
        .from('meal_plan_shopping_snapshots')
        .select('*, meal_plan_shopping_snapshot_items ( * )')
        .eq('meal_plan_id', mealPlanId)
        .eq('status', 'ACTIVE')
        .maybeSingle()
      const data = mapNullableResponse(response)
      if (!data) return ok(null)

      const d = data as any
      const items: SnapshotItemRow[] = d.meal_plan_shopping_snapshot_items ?? []
      return ok({ ...mapShoppingSnapshot(data), items: items.map(mapShoppingSnapshotItem) })
    } catch (e) {
      return err(wrapError(e))
    }
  }

  // Regenera el snapshot de un plan: la versión ACTIVE anterior (si existe)
  // pasa a SUPERSEDED y se crea una versión nueva (version + 1) con los items
  // agregados. Nunca se actualiza el contenido de una versión existente —
  // ver INV de inmutabilidad en docs/13-meal-planning.md.
  async generate(
    userId: string,
    mealPlanId: string,
    planSignature: string,
    items: AggregatedIngredientDemand[],
  ): Promise<Result<MealPlanShoppingSnapshotWithItems>> {
    try {
      const currentResponse = await this.db
        .from('meal_plan_shopping_snapshots')
        .select('*')
        .eq('meal_plan_id', mealPlanId)
        .eq('status', 'ACTIVE')
        .maybeSingle()
      const current = mapNullableResponse(currentResponse)

      if (current) {
        const supersedeResponse = await this.db
          .from('meal_plan_shopping_snapshots')
          .update({ status: 'SUPERSEDED' as const })
          .eq('id', current.id)
        if (supersedeResponse.error) throw supersedeResponse.error
      }

      const nextVersion = (current?.version ?? 0) + 1

      const snapshotResponse = await this.db
        .from('meal_plan_shopping_snapshots')
        .insert({
          meal_plan_id: mealPlanId,
          user_id: userId,
          version: nextVersion,
          status: 'ACTIVE' as const,
          plan_signature: planSignature,
        })
        .select('*')
        .single()
      const snapshotRow = mapResponse(snapshotResponse)

      let itemRows: SnapshotItemRow[] = []
      if (items.length > 0) {
        const itemsResponse = await this.db
          .from('meal_plan_shopping_snapshot_items')
          .insert(
            items.map((i) => ({
              snapshot_id: snapshotRow.id,
              ingredient_id: i.ingredient_id,
              unit_id: i.unit_id,
              total_quantity: i.total_quantity,
              recipe_count: i.recipe_count,
            })),
          )
          .select('*')
        itemRows = mapResponse(itemsResponse)
      }

      return ok({ ...mapShoppingSnapshot(snapshotRow), items: itemRows.map(mapShoppingSnapshotItem) })
    } catch (e) {
      return err(wrapError(e))
    }
  }
}
