import type { Database, Tables } from '@/shared/types/database.types'
import type {
  Allergen,
  Attribute,
  Micronutrient,
  StorageMethod,
  Unit,
} from '../domain/shared.types'
import type {
  Ingredient,
  IngredientAllergen,
  IngredientCategory,
  IngredientMatchCandidate,
  IngredientMicronutrient,
  IngredientStorageRule,
  IngredientSubcategory,
  IngredientTranslation,
  IngredientUnitConversion,
} from '../domain/ingredient.types'

type MatchIngredientsRow =
  Database['public']['Functions']['match_ingredients']['Returns'][number]

type IngredientRow = Tables<'ingredients'>
type IngredientTranslationRow = Tables<'ingredient_translations'>
type IngredientAllergenRow = Tables<'ingredient_allergens'>
type IngredientMicronutrientRow = Tables<'ingredient_micronutrients'>
type IngredientStorageRuleRow = Tables<'ingredient_storage_rules'>
type IngredientUnitConversionRow = Tables<'ingredient_unit_conversions'>
type IngredientCategoryRow = Tables<'ingredient_categories'>
type IngredientSubcategoryRow = Tables<'ingredient_subcategories'>
type AllergenRow = Tables<'allergens'>
type MicronutrientRow = Tables<'micronutrients'>
type StorageMethodRow = Tables<'storage_methods'>
type UnitRow = Tables<'units'>
type AttributeRow = Tables<'attributes'>

export function mapUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    unit_type: row.unit_type,
    system: row.system,
    base_unit_id: row.base_unit_id,
    to_base_factor: row.to_base_factor,
    status: row.status,
  }
}

export function mapAllergen(row: AllergenRow): Allergen {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    is_eu_mandatory: row.is_eu_mandatory,
    status: row.status,
  }
}

export function mapMicronutrient(row: MicronutrientRow): Micronutrient {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    unit_id: row.unit_id,
    status: row.status,
  }
}

export function mapStorageMethod(row: StorageMethodRow): StorageMethod {
  return {
    id: row.id,
    slug: row.slug,
    storage_type: row.storage_type,
    name: row.name,
    description: row.description,
    typical_temp_min_c: row.typical_temp_min_c,
    typical_temp_max_c: row.typical_temp_max_c,
    status: row.status,
  }
}

export function mapAttribute(row: AttributeRow): Attribute {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    scope: row.scope,
    category: row.category,
    description: row.description,
    status: row.status,
  }
}

export function mapIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category_id: row.category_id,
    subcategory_id: row.subcategory_id,
    default_unit_id: row.default_unit_id,
    image_url: row.image_url,
    countries: row.countries,
    seasonality: { months: row.seasonality_months },
    nutrition: {
      calories_kcal: row.calories_kcal,
      protein_g: row.protein_g,
      carbs_g: row.carbs_g,
      sugar_g: row.sugar_g,
      fiber_g: row.fiber_g,
      fat_g: row.fat_g,
      saturated_fat_g: row.saturated_fat_g,
      sodium_mg: row.sodium_mg,
    },
    is_system: row.is_system,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deprecated_at: row.deprecated_at,
  }
}

export function mapIngredientCategory(row: IngredientCategoryRow): IngredientCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function mapIngredientSubcategory(row: IngredientSubcategoryRow): IngredientSubcategory {
  return {
    id: row.id,
    category_id: row.category_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function mapIngredientTranslation(row: IngredientTranslationRow): IngredientTranslation {
  return {
    id: row.id,
    ingredient_id: row.ingredient_id,
    locale: row.locale,
    name: row.name,
    description: row.description,
  }
}

export function mapIngredientAllergen(
  row: IngredientAllergenRow,
  allergen: AllergenRow,
): IngredientAllergen {
  return {
    ingredient_id: row.ingredient_id,
    allergen_id: row.allergen_id,
    allergen: mapAllergen(allergen),
    is_trace: row.is_trace,
  }
}

export function mapIngredientMicronutrient(
  row: IngredientMicronutrientRow,
  micronutrient: MicronutrientRow,
): IngredientMicronutrient {
  return {
    ingredient_id: row.ingredient_id,
    micronutrient_id: row.micronutrient_id,
    micronutrient: mapMicronutrient(micronutrient),
    amount_per_100g: row.amount_per_100g,
  }
}

export function mapIngredientStorageRule(
  row: IngredientStorageRuleRow,
  storageMethod: StorageMethodRow,
): IngredientStorageRule {
  return {
    id: row.id,
    ingredient_id: row.ingredient_id,
    storage_method_id: row.storage_method_id,
    storage_method: mapStorageMethod(storageMethod),
    max_duration: row.max_duration,
    duration_unit: row.duration_unit,
    is_recommended: row.is_recommended,
    can_freeze: row.can_freeze,
    notes: row.notes,
  }
}

export function mapIngredientMatchCandidate(
  row: MatchIngredientsRow,
): IngredientMatchCandidate {
  return {
    ingredient_id: row.ingredient_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    score: row.score,
    matched_via: row.matched_via as IngredientMatchCandidate['matched_via'],
    matched_text: row.matched_text,
  }
}

export function mapIngredientUnitConversion(
  row: IngredientUnitConversionRow,
  fromUnit: UnitRow,
  toUnit: UnitRow,
): IngredientUnitConversion {
  return {
    id: row.id,
    ingredient_id: row.ingredient_id,
    from_unit_id: row.from_unit_id,
    from_unit: mapUnit(fromUnit),
    to_unit_id: row.to_unit_id,
    to_unit: mapUnit(toUnit),
    factor: row.factor,
    is_default: row.is_default,
    notes: row.notes,
  }
}
