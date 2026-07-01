import { BaseRepository, mapResponse, mapNullableResponse, wrapError, ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import {
  mapIngredient,
  mapIngredientAllergen,
  mapIngredientMatchCandidate,
  mapIngredientMicronutrient,
  mapIngredientStorageRule,
  mapIngredientTranslation,
  mapIngredientUnitConversion,
  mapAttribute,
  mapIngredientCategory,
  mapIngredientSubcategory,
} from '../mappers/ingredient.mapper'
import { toSlug } from '@/shared/utils/slug'
import type {
  Ingredient,
  IngredientMatchCandidate,
  IngredientWithDetails,
  ListIngredientsInput,
  CreateIngredientInput,
  UpdateIngredientInput,
} from '../domain/ingredient.types'

export class IngredientRepository extends BaseRepository {
  async findById(id: string): Promise<Result<Ingredient | null>> {
    try {
      const response = await this.db.from('ingredients').select('*').eq('id', id).maybeSingle()
      const row = mapNullableResponse(response)
      return ok(row ? mapIngredient(row) : null)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async findBySlug(slug: string): Promise<Result<Ingredient | null>> {
    try {
      const response = await this.db.from('ingredients').select('*').eq('slug', slug).maybeSingle()
      const row = mapNullableResponse(response)
      return ok(row ? mapIngredient(row) : null)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async findWithDetails(id: string): Promise<Result<IngredientWithDetails | null>> {
    try {
      const response = await this.db
        .from('ingredients')
        .select(`
          *,
          ingredient_categories ( * ),
          ingredient_subcategories ( * ),
          ingredient_translations ( * ),
          ingredient_allergens ( *, allergens ( * ) ),
          ingredient_micronutrients ( *, micronutrients ( * ) ),
          ingredient_storage_rules ( *, storage_methods ( * ) ),
          ingredient_unit_conversions (
            *,
            from_unit:units!ingredient_unit_conversions_from_unit_id_fkey ( * ),
            to_unit:units!ingredient_unit_conversions_to_unit_id_fkey ( * )
          ),
          ingredient_attributes ( *, attributes ( * ) )
        `)
        .eq('id', id)
        .maybeSingle()

      const data = mapNullableResponse(response)
      if (!data) return ok(null)

      const d = data as any
      const base = mapIngredient(data)

      return ok({
        ...base,
        category: d.ingredient_categories ? mapIngredientCategory(d.ingredient_categories) : null,
        subcategory: d.ingredient_subcategories
          ? mapIngredientSubcategory(d.ingredient_subcategories)
          : null,
        translations: (d.ingredient_translations ?? []).map(mapIngredientTranslation),
        allergens: (d.ingredient_allergens ?? []).map((ia: any) =>
          mapIngredientAllergen(ia, ia.allergens),
        ),
        micronutrients: (d.ingredient_micronutrients ?? []).map((im: any) =>
          mapIngredientMicronutrient(im, im.micronutrients),
        ),
        storage_rules: (d.ingredient_storage_rules ?? []).map((sr: any) =>
          mapIngredientStorageRule(sr, sr.storage_methods),
        ),
        unit_conversions: (d.ingredient_unit_conversions ?? []).map((uc: any) =>
          mapIngredientUnitConversion(uc, uc.from_unit, uc.to_unit),
        ),
        attributes: (d.ingredient_attributes ?? []).map((ia: any) =>
          mapAttribute(ia.attributes),
        ),
      } as IngredientWithDetails)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async list(input: ListIngredientsInput = {}): Promise<Result<Ingredient[]>> {
    try {
      let query = this.db.from('ingredients').select('*')
      if (input.category_id) query = query.eq('category_id', input.category_id)
      if (input.subcategory_id) query = query.eq('subcategory_id', input.subcategory_id)
      if (input.status) query = query.eq('status', input.status)
      if (input.is_system !== undefined) query = query.eq('is_system', input.is_system)
      query = query
        .order('name')
        .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 50) - 1)

      const response = await query
      const rows = mapResponse(response)
      return ok(rows.map(mapIngredient))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async search(searchQuery: string, limit = 20): Promise<Result<Ingredient[]>> {
    try {
      const response = await this.db
        .from('ingredients')
        .select('*')
        .eq('status', 'ACTIVE')
        .ilike('name', `%${searchQuery}%`)
        .order('name')
        .limit(limit)
      const rows = mapResponse(response)
      return ok(rows.map(mapIngredient))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  // Búsqueda difusa (trigram + unaccent + alias) usada por el motor de
  // normalización de ingredientes. Ver match_ingredients() en
  // 20260629000009_knowledge_base_create_ingredient_aliases.sql.
  async matchCandidates(
    searchTerm: string,
    limit = 5,
    minSimilarity = 0.2,
  ): Promise<Result<IngredientMatchCandidate[]>> {
    try {
      const response = await this.db.rpc('match_ingredients', {
        search_term: searchTerm,
        match_limit: limit,
        min_similarity: minSimilarity,
      })
      const rows = mapResponse(response)
      return ok(rows.map(mapIngredientMatchCandidate))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async create(data: CreateIngredientInput): Promise<Result<Ingredient>> {
    try {
      const slug = `${toSlug(data.name)}-${Date.now()}`
      const response = await this.db
        .from('ingredients')
        .insert({
          slug,
          name: data.name,
          description: data.description ?? null,
          category_id: data.category_id ?? null,
          subcategory_id: data.subcategory_id ?? null,
          default_unit_id: data.default_unit_id ?? null,
          countries: data.countries ?? [],
          seasonality_months: data.seasonality_months ?? [],
          calories_kcal: data.nutrition?.calories_kcal ?? null,
          protein_g: data.nutrition?.protein_g ?? null,
          carbs_g: data.nutrition?.carbs_g ?? null,
          sugar_g: data.nutrition?.sugar_g ?? null,
          fiber_g: data.nutrition?.fiber_g ?? null,
          fat_g: data.nutrition?.fat_g ?? null,
          saturated_fat_g: data.nutrition?.saturated_fat_g ?? null,
          sodium_mg: data.nutrition?.sodium_mg ?? null,
          is_system: false,
          status: 'PENDING_REVIEW' as const,
        })
        .select('*')
        .single()
      const row = mapResponse(response)
      return ok(mapIngredient(row))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async update(id: string, input: UpdateIngredientInput): Promise<Result<Ingredient>> {
    try {
      const response = await this.db
        .from('ingredients')
        .update({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.category_id !== undefined && { category_id: input.category_id }),
          ...(input.subcategory_id !== undefined && { subcategory_id: input.subcategory_id }),
          ...(input.default_unit_id !== undefined && { default_unit_id: input.default_unit_id }),
          ...(input.countries !== undefined && { countries: input.countries }),
          ...(input.seasonality_months !== undefined && {
            seasonality_months: input.seasonality_months,
          }),
          ...(input.nutrition?.calories_kcal !== undefined && {
            calories_kcal: input.nutrition.calories_kcal,
          }),
          ...(input.nutrition?.protein_g !== undefined && {
            protein_g: input.nutrition.protein_g,
          }),
          ...(input.nutrition?.carbs_g !== undefined && { carbs_g: input.nutrition.carbs_g }),
          ...(input.nutrition?.sugar_g !== undefined && { sugar_g: input.nutrition.sugar_g }),
          ...(input.nutrition?.fiber_g !== undefined && { fiber_g: input.nutrition.fiber_g }),
          ...(input.nutrition?.fat_g !== undefined && { fat_g: input.nutrition.fat_g }),
          ...(input.nutrition?.saturated_fat_g !== undefined && {
            saturated_fat_g: input.nutrition.saturated_fat_g,
          }),
          ...(input.nutrition?.sodium_mg !== undefined && {
            sodium_mg: input.nutrition.sodium_mg,
          }),
        })
        .eq('id', id)
        .select('*')
        .single()
      const row = mapResponse(response)
      return ok(mapIngredient(row))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async deprecate(id: string): Promise<Result<void>> {
    try {
      const response = await this.db
        .from('ingredients')
        .update({ status: 'DEPRECATED' as const, deprecated_at: new Date().toISOString() })
        .eq('id', id)
      if (response.error) throw response.error
      return ok(undefined)
    } catch (e) {
      return err(wrapError(e))
    }
  }
}
