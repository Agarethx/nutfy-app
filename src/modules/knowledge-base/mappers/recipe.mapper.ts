import type { Tables } from '@/shared/types/database.types'
import type { Ingredient } from '../domain/ingredient.types'
import type {
  Recipe,
  RecipeIngredient,
  RecipeStep,
  RecipeStorageRule,
  RecipeVariation,
  VariationIngredientOverride,
} from '../domain/recipe.types'
import { mapAttribute, mapStorageMethod, mapUnit } from './ingredient.mapper'

type RecipeRow = Tables<'recipes'>
type RecipeIngredientRow = Tables<'recipe_ingredients'>
type RecipeStepRow = Tables<'recipe_steps'>
type RecipeVariationRow = Tables<'recipe_variations'>
type VariationOverrideRow = Tables<'variation_ingredient_overrides'>
type RecipeStorageRuleRow = Tables<'recipe_storage_rules'>
type UnitRow = Tables<'units'>
type StorageMethodRow = Tables<'storage_methods'>

export function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    user_id: row.user_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image_url: row.image_url,
    servings_min: row.servings_min,
    servings_max: row.servings_max,
    prep_time_min: row.prep_time_min,
    cook_time_min: row.cook_time_min,
    rest_time_min: row.rest_time_min,
    difficulty: row.difficulty,
    cooking_methods: row.cooking_methods as Recipe['cooking_methods'],
    source_url: row.source_url,
    notes: row.notes,
    is_public: row.is_public,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deprecated_at: row.deprecated_at,
  }
}

export function mapRecipeIngredient(
  row: RecipeIngredientRow,
  ingredient: Ingredient,
  unit: UnitRow,
): RecipeIngredient {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    ingredient_id: row.ingredient_id,
    ingredient,
    unit_id: row.unit_id,
    unit: mapUnit(unit),
    quantity: row.quantity,
    is_optional: row.is_optional,
    notes: row.notes,
  }
}

export function mapRecipeStep(row: RecipeStepRow): RecipeStep {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    step_number: row.step_number,
    instruction: row.instruction,
    duration_min: row.duration_min,
    image_url: row.image_url,
  }
}

export function mapVariationOverride(row: VariationOverrideRow): VariationIngredientOverride {
  return {
    id: row.id,
    variation_id: row.variation_id,
    override_type: row.override_type,
    original_ingredient_id: row.original_ingredient_id,
    new_ingredient_id: row.new_ingredient_id,
    new_quantity: row.new_quantity,
    new_unit_id: row.new_unit_id,
    notes: row.notes,
  }
}

export function mapRecipeVariation(
  row: RecipeVariationRow,
  overrides: VariationOverrideRow[],
): RecipeVariation {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    servings_min: row.servings_min,
    servings_max: row.servings_max,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    overrides: overrides.map(mapVariationOverride),
  }
}

export function mapRecipeStorageRule(
  row: RecipeStorageRuleRow,
  storageMethod: StorageMethodRow,
): RecipeStorageRule {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    storage_method_id: row.storage_method_id,
    storage_method: mapStorageMethod(storageMethod),
    max_duration: row.max_duration,
    duration_unit: row.duration_unit,
    is_recommended: row.is_recommended,
    can_freeze: row.can_freeze,
    notes: row.notes,
  }
}
