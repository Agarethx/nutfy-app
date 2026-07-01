import { BaseRepository, mapResponse, mapNullableResponse, wrapError, ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import type { Tables } from '@/shared/types/database.types'
import {
  mapIngredient,
  mapIngredientTranslation,
  mapIngredientAllergen,
  mapIngredientMicronutrient,
  mapIngredientStorageRule,
  mapIngredientUnitConversion,
  mapAttribute,
} from '../mappers/ingredient.mapper'
import {
  mapRecipe,
  mapRecipeIngredient,
  mapRecipeStep,
  mapRecipeStorageRule,
  mapRecipeVariation,
} from '../mappers/recipe.mapper'
import type {
  Recipe,
  RecipeWithDetails,
  RecipeVariation,
  ListRecipesInput,
  CreateRecipeInput,
  UpdateRecipeInput,
  CreateRecipeVariationInput,
} from '../domain/recipe.types'
import { toSlug } from '@/shared/utils/slug'

export class RecipeRepository extends BaseRepository {
  async findById(id: string): Promise<Result<Recipe | null>> {
    try {
      const response = await this.db.from('recipes').select('*').eq('id', id).maybeSingle()
      const row = mapNullableResponse(response)
      return ok(row ? mapRecipe(row) : null)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async findWithDetails(id: string): Promise<Result<RecipeWithDetails | null>> {
    try {
      const response = await this.db
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            *,
            ingredients (
              *,
              ingredient_translations ( * ),
              ingredient_allergens ( *, allergens ( * ) ),
              ingredient_micronutrients ( *, micronutrients ( * ) ),
              ingredient_storage_rules ( *, storage_methods ( * ) ),
              ingredient_unit_conversions (
                *,
                from_unit:units!ingredient_unit_conversions_from_unit_id_fkey ( * ),
                to_unit:units!ingredient_unit_conversions_to_unit_id_fkey ( * )
              )
            ),
            units ( * )
          ),
          recipe_steps ( * ),
          recipe_variations (
            *,
            variation_ingredient_overrides ( * )
          ),
          recipe_storage_rules ( *, storage_methods ( * ) ),
          recipe_attributes ( *, attributes ( * ) )
        `)
        .eq('id', id)
        .maybeSingle()

      const data = mapNullableResponse(response)
      if (!data) return ok(null)

      const d = data as any
      const base = mapRecipe(data)

      const ingredients = (d.recipe_ingredients ?? []).map((ri: any) => {
        const ingRow = ri.ingredients
        const ing = {
          ...mapIngredient(ingRow),
          translations: (ingRow.ingredient_translations ?? []).map(mapIngredientTranslation),
          allergens: (ingRow.ingredient_allergens ?? []).map((ia: any) =>
            mapIngredientAllergen(ia, ia.allergens),
          ),
          micronutrients: (ingRow.ingredient_micronutrients ?? []).map((im: any) =>
            mapIngredientMicronutrient(im, im.micronutrients),
          ),
          storage_rules: (ingRow.ingredient_storage_rules ?? []).map((sr: any) =>
            mapIngredientStorageRule(sr, sr.storage_methods),
          ),
          unit_conversions: (ingRow.ingredient_unit_conversions ?? []).map((uc: any) =>
            mapIngredientUnitConversion(uc, uc.from_unit, uc.to_unit),
          ),
        }
        return mapRecipeIngredient(ri, ing, ri.units)
      })

      return ok({
        ...base,
        ingredients,
        steps: (d.recipe_steps ?? [])
          .map(mapRecipeStep)
          .sort((a: any, b: any) => a.step_number - b.step_number),
        variations: (d.recipe_variations ?? []).map((rv: any) =>
          mapRecipeVariation(rv, rv.variation_ingredient_overrides ?? []),
        ),
        storage_rules: (d.recipe_storage_rules ?? []).map((sr: any) =>
          mapRecipeStorageRule(sr, sr.storage_methods),
        ),
        attributes: (d.recipe_attributes ?? []).map((ra: any) => mapAttribute(ra.attributes)),
      } as RecipeWithDetails)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async list(input: ListRecipesInput, userId: string): Promise<Result<Recipe[]>> {
    try {
      let query = this.db
        .from('recipes')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`)

      if (input.difficulty) query = query.eq('difficulty', input.difficulty)
      if (input.is_public !== undefined) query = query.eq('is_public', input.is_public)
      query = query.eq('status', input.status ?? 'ACTIVE')
      query = query
        .order('created_at', { ascending: false })
        .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 20) - 1)

      const response = await query
      const rows = mapResponse(response)
      return ok(rows.map(mapRecipe))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async create(input: CreateRecipeInput, userId: string): Promise<Result<Recipe>> {
    try {
      const slug = `${toSlug(input.name)}-${Date.now()}`

      const recipeResponse = await this.db
        .from('recipes')
        .insert({
          user_id: userId,
          slug,
          name: input.name,
          description: input.description ?? null,
          servings_min: input.servings_min,
          servings_max: input.servings_max,
          difficulty: input.difficulty ?? 'MEDIUM',
          cooking_methods: input.cooking_methods ?? [],
          prep_time_min: input.prep_time_min ?? null,
          cook_time_min: input.cook_time_min ?? null,
          rest_time_min: input.rest_time_min ?? null,
          source_url: input.source_url ?? null,
          notes: input.notes ?? null,
          is_public: input.is_public ?? false,
          status: 'ACTIVE' as const,
        })
        .select('*')
        .single()

      const recipe = mapResponse(recipeResponse)

      if (input.ingredients.length > 0) {
        const ingInsert = await this.db.from('recipe_ingredients').insert(
          input.ingredients.map((ing) => ({
            recipe_id: recipe.id,
            ingredient_id: ing.ingredient_id,
            unit_id: ing.unit_id,
            quantity: ing.quantity,
            is_optional: ing.is_optional ?? false,
            notes: ing.notes ?? null,
          })),
        )
        if (ingInsert.error) throw ingInsert.error
      }

      if (input.steps.length > 0) {
        const stepsInsert = await this.db.from('recipe_steps').insert(
          input.steps.map((step, i) => ({
            recipe_id: recipe.id,
            step_number: i + 1,
            instruction: step.instruction,
            duration_min: step.duration_min ?? null,
          })),
        )
        if (stepsInsert.error) throw stepsInsert.error
      }

      return ok(mapRecipe(recipe))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  // Crea una RecipeVariation (delta model, ADR-009) relacionada con la receta
  // base. No duplica ingredientes ni pasos — solo guarda los overrides.
  async createVariation(
    recipeId: string,
    input: CreateRecipeVariationInput,
  ): Promise<Result<RecipeVariation>> {
    try {
      const slug = `${toSlug(input.name)}-${Date.now()}`

      const variationResponse = await this.db
        .from('recipe_variations')
        .insert({
          recipe_id: recipeId,
          slug,
          name: input.name,
          description: input.description ?? null,
          servings_min: input.servings_min ?? null,
          servings_max: input.servings_max ?? null,
          status: 'ACTIVE' as const,
        })
        .select('*')
        .single()

      const variation = mapResponse(variationResponse)

      let overrideRows: Tables<'variation_ingredient_overrides'>[] = []

      if (input.overrides.length > 0) {
        const overridesResponse = await this.db
          .from('variation_ingredient_overrides')
          .insert(
            input.overrides.map((o) => ({
              variation_id: variation.id,
              override_type: o.override_type,
              original_ingredient_id: o.original_ingredient_id ?? null,
              new_ingredient_id: o.new_ingredient_id ?? null,
              new_quantity: o.new_quantity ?? null,
              new_unit_id: o.new_unit_id ?? null,
              notes: o.notes ?? null,
            })),
          )
          .select('*')
        overrideRows = mapResponse(overridesResponse)
      }

      return ok(mapRecipeVariation(variation, overrideRows))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async update(id: string, input: UpdateRecipeInput): Promise<Result<Recipe>> {
    try {
      const response = await this.db
        .from('recipes')
        .update({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.servings_min !== undefined && { servings_min: input.servings_min }),
          ...(input.servings_max !== undefined && { servings_max: input.servings_max }),
          ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
          ...(input.cooking_methods !== undefined && { cooking_methods: input.cooking_methods }),
          ...(input.prep_time_min !== undefined && { prep_time_min: input.prep_time_min }),
          ...(input.cook_time_min !== undefined && { cook_time_min: input.cook_time_min }),
          ...(input.rest_time_min !== undefined && { rest_time_min: input.rest_time_min }),
          ...(input.source_url !== undefined && { source_url: input.source_url }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.is_public !== undefined && { is_public: input.is_public }),
        })
        .eq('id', id)
        .select('*')
        .single()
      const row = mapResponse(response)
      return ok(mapRecipe(row))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async deprecate(id: string): Promise<Result<void>> {
    try {
      const response = await this.db
        .from('recipes')
        .update({ status: 'DEPRECATED' as const, deprecated_at: new Date().toISOString() })
        .eq('id', id)
      if (response.error) throw response.error
      return ok(undefined)
    } catch (e) {
      return err(wrapError(e))
    }
  }
}
