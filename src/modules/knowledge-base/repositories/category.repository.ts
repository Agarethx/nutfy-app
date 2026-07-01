import { BaseRepository, mapResponse, wrapError, ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import { mapIngredientCategory, mapIngredientSubcategory } from '../mappers/ingredient.mapper'
import type { IngredientCategory, IngredientSubcategory } from '../domain/ingredient.types'

export class CategoryRepository extends BaseRepository {
  async listCategories(): Promise<Result<IngredientCategory[]>> {
    try {
      const response = await this.db
        .from('ingredient_categories')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name')
      const rows = mapResponse(response)
      return ok(rows.map(mapIngredientCategory))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async listSubcategories(categoryId?: string): Promise<Result<IngredientSubcategory[]>> {
    try {
      let query = this.db
        .from('ingredient_subcategories')
        .select('*')
        .eq('status', 'ACTIVE')
      if (categoryId) query = query.eq('category_id', categoryId)
      const response = await query.order('name')
      const rows = mapResponse(response)
      return ok(rows.map(mapIngredientSubcategory))
    } catch (e) {
      return err(wrapError(e))
    }
  }
}
