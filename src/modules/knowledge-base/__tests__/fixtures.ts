import type {
  Unit,
  UnitConversion,
  StorageMethod,
} from '../domain/shared.types'
import type {
  Ingredient,
  IngredientStorageRule,
  IngredientUnitConversion,
} from '../domain/ingredient.types'
import type {
  Recipe,
  RecipeIngredient,
  RecipeStep,
  RecipeVariation,
  VariationIngredientOverride,
} from '../domain/recipe.types'

// ─── Units ────────────────────────────────────────────────────────────────────

export const UNIT_G: Unit = {
  id: 'unit-g',
  name: 'Gram',
  abbreviation: 'g',
  unit_type: 'WEIGHT',
  system: 'METRIC',
  base_unit_id: null,
  to_base_factor: null,
  status: 'ACTIVE',
}

export const UNIT_KG: Unit = {
  id: 'unit-kg',
  name: 'Kilogram',
  abbreviation: 'kg',
  unit_type: 'WEIGHT',
  system: 'METRIC',
  base_unit_id: 'unit-g',
  to_base_factor: 1000,
  status: 'ACTIVE',
}

export const UNIT_ML: Unit = {
  id: 'unit-ml',
  name: 'Milliliter',
  abbreviation: 'ml',
  unit_type: 'VOLUME',
  system: 'METRIC',
  base_unit_id: null,
  to_base_factor: null,
  status: 'ACTIVE',
}

export const UNIT_L: Unit = {
  id: 'unit-l',
  name: 'Liter',
  abbreviation: 'l',
  unit_type: 'VOLUME',
  system: 'METRIC',
  base_unit_id: 'unit-ml',
  to_base_factor: 1000,
  status: 'ACTIVE',
}

export const UNIT_PIECE: Unit = {
  id: 'unit-piece',
  name: 'Piece',
  abbreviation: 'pcs',
  unit_type: 'PIECE',
  system: 'UNIVERSAL',
  base_unit_id: null,
  to_base_factor: null,
  status: 'ACTIVE',
}

export const ALL_UNITS: Unit[] = [UNIT_G, UNIT_KG, UNIT_ML, UNIT_L, UNIT_PIECE]

// ─── Global conversions ───────────────────────────────────────────────────────

export const GLOBAL_CONVERSIONS: UnitConversion[] = [
  { id: 'conv-kg-g', from_unit: 'unit-kg', to_unit: 'unit-g', factor: 1000 },
  { id: 'conv-l-ml', from_unit: 'unit-l', to_unit: 'unit-ml', factor: 1000 },
]

// ─── Storage methods ──────────────────────────────────────────────────────────

export const STORAGE_FRIDGE: StorageMethod = {
  id: 'sm-fridge',
  slug: 'fridge',
  name: 'Fridge',
  description: null,
  storage_type: 'FRIDGE',
  typical_temp_min_c: 2,
  typical_temp_max_c: 8,
  status: 'ACTIVE',
}

export const STORAGE_FREEZER: StorageMethod = {
  id: 'sm-freezer',
  slug: 'freezer',
  name: 'Freezer',
  description: null,
  storage_type: 'FREEZER',
  typical_temp_min_c: -18,
  typical_temp_max_c: -15,
  status: 'ACTIVE',
}

export const STORAGE_PANTRY: StorageMethod = {
  id: 'sm-pantry',
  slug: 'pantry',
  name: 'Pantry',
  description: null,
  storage_type: 'PANTRY',
  typical_temp_min_c: null,
  typical_temp_max_c: null,
  status: 'ACTIVE',
}

// ─── Ingredients ──────────────────────────────────────────────────────────────

export function makeIngredient(
  overrides: Partial<Ingredient> & { id: string; name: string; slug: string },
): Ingredient {
  return {
    description: null,
    category_id: null,
    subcategory_id: null,
    default_unit_id: UNIT_G.id,
    image_url: null,
    countries: [],
    seasonality: { months: [] },
    nutrition: {
      calories_kcal: null,
      protein_g: null,
      carbs_g: null,
      sugar_g: null,
      fiber_g: null,
      fat_g: null,
      saturated_fat_g: null,
      sodium_mg: null,
    },
    is_system: true,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deprecated_at: null,
    ...overrides,
  }
}

// Pollo: 100g = 165kcal, 31g proteína, 0g carbs, 3.6g grasa
export const INGREDIENT_CHICKEN = makeIngredient({
  id: 'ing-chicken',
  name: 'Chicken Breast',
  slug: 'chicken-breast',
  nutrition: {
    calories_kcal: 165,
    protein_g: 31,
    carbs_g: 0,
    sugar_g: 0,
    fiber_g: 0,
    fat_g: 3.6,
    saturated_fat_g: 1,
    sodium_mg: 74,
  },
})

// Arroz: 100g = 130kcal, 2.7g proteína, 28g carbs, 2g azúcar, 0.3g grasa
export const INGREDIENT_RICE = makeIngredient({
  id: 'ing-rice',
  name: 'White Rice',
  slug: 'white-rice',
  nutrition: {
    calories_kcal: 130,
    protein_g: 2.7,
    carbs_g: 28,
    sugar_g: 2,
    fiber_g: 0.4,
    fat_g: 0.3,
    saturated_fat_g: 0.1,
    sodium_mg: 1,
  },
})

// Aceite: 100g = 884kcal, 0g proteína, 0g carbs, 100g grasa
export const INGREDIENT_OIL = makeIngredient({
  id: 'ing-oil',
  name: 'Olive Oil',
  slug: 'olive-oil',
  nutrition: {
    calories_kcal: 884,
    protein_g: 0,
    carbs_g: 0,
    sugar_g: 0,
    fiber_g: 0,
    fat_g: 100,
    saturated_fat_g: 14,
    sodium_mg: 2,
  },
})

// Ingrediente sin datos nutricionales
export const INGREDIENT_NO_NUTRITION = makeIngredient({
  id: 'ing-unknown',
  name: 'Unknown Herb',
  slug: 'unknown-herb',
})

// Ingrediente de temporada (enero y febrero)
export const INGREDIENT_SEASONAL = makeIngredient({
  id: 'ing-seasonal',
  name: 'Seasonal Berry',
  slug: 'seasonal-berry',
  seasonality: { months: [1, 2] },
})

// Ingrediente disponible todo el año
export const INGREDIENT_ALLSEASON = makeIngredient({
  id: 'ing-allseason',
  name: 'All Year Tomato',
  slug: 'all-year-tomato',
  seasonality: { months: [] },
})

// Huevo: tiene conversión PIECE→WEIGHT (1 pcs = 60g)
export const EGG_UNIT_CONVERSION: IngredientUnitConversion = {
  id: 'iuc-egg-piece-g',
  ingredient_id: 'ing-egg',
  from_unit_id: UNIT_PIECE.id,
  to_unit_id: UNIT_G.id,
  factor: 60,
  is_default: true,
  notes: null,
  from_unit: UNIT_PIECE,
  to_unit: UNIT_G,
}

export const INGREDIENT_EGG = makeIngredient({
  id: 'ing-egg',
  name: 'Egg',
  slug: 'egg',
  nutrition: {
    calories_kcal: 155,
    protein_g: 13,
    carbs_g: 1.1,
    sugar_g: 1.1,
    fiber_g: 0,
    fat_g: 11,
    saturated_fat_g: 3.3,
    sodium_mg: 124,
  },
})

// INGREDIENT_EGG con conversiones para tests de UnitConverter
export const INGREDIENT_EGG_WITH_CONVERSIONS = {
  ...INGREDIENT_EGG,
  unit_conversions: [EGG_UNIT_CONVERSION],
}

// ─── Storage rules ────────────────────────────────────────────────────────────

export const STORAGE_RULE_FRIDGE_3DAYS: IngredientStorageRule = {
  id: 'sr-fridge',
  ingredient_id: 'ing-chicken',
  storage_method_id: STORAGE_FRIDGE.id,
  max_duration: 3,
  duration_unit: 'DAYS',
  is_recommended: false,
  can_freeze: false,
  notes: null,
  storage_method: STORAGE_FRIDGE,
}

export const STORAGE_RULE_FREEZER_3MONTHS: IngredientStorageRule = {
  id: 'sr-freezer',
  ingredient_id: 'ing-chicken',
  storage_method_id: STORAGE_FREEZER.id,
  max_duration: 3,
  duration_unit: 'MONTHS',
  is_recommended: true,
  can_freeze: true,
  notes: null,
  storage_method: STORAGE_FREEZER,
}

export const STORAGE_RULE_PANTRY_2WEEKS: IngredientStorageRule = {
  id: 'sr-pantry',
  ingredient_id: 'ing-rice',
  storage_method_id: STORAGE_PANTRY.id,
  max_duration: 2,
  duration_unit: 'WEEKS',
  is_recommended: true,
  can_freeze: false,
  notes: null,
  storage_method: STORAGE_PANTRY,
}

export const STORAGE_RULE_NO_FREEZE: IngredientStorageRule = {
  id: 'sr-nf',
  ingredient_id: 'ing-seasonal',
  storage_method_id: STORAGE_PANTRY.id,
  max_duration: 5,
  duration_unit: 'DAYS',
  is_recommended: false,
  can_freeze: false,
  notes: null,
  storage_method: STORAGE_PANTRY,
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

function makeRecipe(
  overrides: Partial<Recipe> & {
    id: string
    name: string
    slug: string
    user_id: string
  },
): Recipe {
  return {
    description: null,
    image_url: null,
    servings_min: 2,
    servings_max: 4,
    prep_time_min: null,
    cook_time_min: null,
    rest_time_min: null,
    difficulty: 'MEDIUM',
    cooking_methods: [],
    source_url: null,
    notes: null,
    is_public: false,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deprecated_at: null,
    ...overrides,
  }
}

export const USER_ID = 'user-001'

export const RECIPE_CHICKEN_RICE = makeRecipe({
  id: 'rec-001',
  name: 'Chicken and Rice',
  slug: 'chicken-and-rice',
  user_id: USER_ID,
  servings_min: 2,
  servings_max: 4,
})

export const RECIPE_DEPRECATED = makeRecipe({
  id: 'rec-dep',
  name: 'Old Recipe',
  slug: 'old-recipe',
  user_id: USER_ID,
  status: 'DEPRECATED',
  deprecated_at: '2026-01-15T00:00:00Z',
})

// ─── RecipeIngredients ────────────────────────────────────────────────────────

export const RI_CHICKEN_200G: RecipeIngredient = {
  id: 'ri-001',
  recipe_id: RECIPE_CHICKEN_RICE.id,
  ingredient_id: INGREDIENT_CHICKEN.id,
  unit_id: UNIT_G.id,
  quantity: 200,
  is_optional: false,
  notes: null,
  ingredient: INGREDIENT_CHICKEN,
  unit: UNIT_G,
}

export const RI_RICE_150G: RecipeIngredient = {
  id: 'ri-002',
  recipe_id: RECIPE_CHICKEN_RICE.id,
  ingredient_id: INGREDIENT_RICE.id,
  unit_id: UNIT_G.id,
  quantity: 150,
  is_optional: false,
  notes: null,
  ingredient: INGREDIENT_RICE,
  unit: UNIT_G,
}

export const RI_OIL_10G: RecipeIngredient = {
  id: 'ri-003',
  recipe_id: RECIPE_CHICKEN_RICE.id,
  ingredient_id: INGREDIENT_OIL.id,
  unit_id: UNIT_G.id,
  quantity: 10,
  is_optional: false,
  notes: null,
  ingredient: INGREDIENT_OIL,
  unit: UNIT_G,
}

// ─── CreateRecipeInput helpers ────────────────────────────────────────────────

export function makeCreateRecipeInput(overrides?: object) {
  return {
    name: 'Test Recipe',
    servings_min: 2,
    servings_max: 4,
    ingredients: [
      {
        ingredient_id: INGREDIENT_CHICKEN.id,
        unit_id: UNIT_G.id,
        quantity: 200,
      },
    ],
    steps: [{ instruction: 'Cook it' }],
    ...overrides,
  }
}

// ─── Variation overrides ──────────────────────────────────────────────────────

export function makeOverrideRemove(
  originalIngredientId: string,
): VariationIngredientOverride {
  return {
    id: 'ov-remove',
    variation_id: 'var-001',
    override_type: 'REMOVE',
    original_ingredient_id: originalIngredientId,
    new_ingredient_id: null,
    new_unit_id: null,
    new_quantity: null,
    notes: null,
  }
}

export function makeOverrideAdd(
  ingredient: Ingredient,
  unit: Unit,
  quantity: number,
): VariationIngredientOverride {
  return {
    id: 'ov-add',
    variation_id: 'var-001',
    override_type: 'ADD',
    original_ingredient_id: null,
    new_ingredient_id: ingredient.id,
    new_unit_id: unit.id,
    new_quantity: quantity,
    notes: null,
  }
}

export function makeOverrideReplace(
  originalIngredientId: string,
  newIngredient: Ingredient,
  unit: Unit,
  quantity: number,
): VariationIngredientOverride {
  return {
    id: 'ov-replace',
    variation_id: 'var-001',
    override_type: 'REPLACE',
    original_ingredient_id: originalIngredientId,
    new_ingredient_id: newIngredient.id,
    new_unit_id: unit.id,
    new_quantity: quantity,
    notes: null,
  }
}

export function makeOverrideAdjustQuantity(
  originalIngredientId: string,
  unit: Unit,
  quantity: number,
): VariationIngredientOverride {
  return {
    id: 'ov-adjust-quantity',
    variation_id: 'var-001',
    override_type: 'ADJUST_QUANTITY',
    original_ingredient_id: originalIngredientId,
    new_ingredient_id: null,
    new_unit_id: unit.id,
    new_quantity: quantity,
    notes: null,
  }
}

export function makeVariation(
  overrides: VariationIngredientOverride[],
): RecipeVariation {
  return {
    id: 'var-001',
    recipe_id: RECIPE_CHICKEN_RICE.id,
    slug: 'vegetarian',
    name: 'Vegetarian',
    description: null,
    servings_min: null,
    servings_max: null,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    overrides,
  }
}
