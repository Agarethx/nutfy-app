import type {
  Attribute,
  CookingMethod,
  DifficultyLevel,
  DurationUnit,
  LifecycleStatus,
  OverrideType,
  StorageMethod,
  Unit,
} from './shared.types'
import type { Ingredient } from './ingredient.types'

// ─── Miembros del agregado Recipe ────────────────────────────────────────────

export type RecipeIngredient = {
  id: string
  recipe_id: string
  ingredient_id: string
  ingredient: Ingredient
  unit_id: string
  unit: Unit
  quantity: number
  is_optional: boolean
  notes: string | null
}

export type RecipeStep = {
  id: string
  recipe_id: string
  step_number: number
  instruction: string
  duration_min: number | null
  image_url: string | null
}

export type VariationIngredientOverride = {
  id: string
  variation_id: string
  override_type: OverrideType
  original_ingredient_id: string | null
  new_ingredient_id: string | null
  new_quantity: number | null
  new_unit_id: string | null
  notes: string | null
}

export type RecipeVariation = {
  id: string
  recipe_id: string
  slug: string
  name: string
  description: string | null
  servings_min: number | null
  servings_max: number | null
  status: LifecycleStatus
  created_at: string
  updated_at: string
  overrides: VariationIngredientOverride[]
}

export type RecipeStorageRule = {
  id: string
  recipe_id: string
  storage_method_id: string
  storage_method: StorageMethod
  max_duration: number
  duration_unit: DurationUnit
  is_recommended: boolean
  can_freeze: boolean
  notes: string | null
}

// ─── Recipe (agregado raíz) ───────────────────────────────────────────────────

export type Recipe = {
  id: string
  user_id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  servings_min: number
  servings_max: number
  prep_time_min: number | null
  cook_time_min: number | null
  rest_time_min: number | null
  difficulty: DifficultyLevel
  cooking_methods: CookingMethod[]
  source_url: string | null
  notes: string | null
  is_public: boolean
  status: LifecycleStatus
  created_at: string
  updated_at: string
  deprecated_at: string | null
}

// Recipe con todos sus miembros del agregado cargados
export type RecipeWithDetails = Recipe & {
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  variations: RecipeVariation[]
  storage_rules: RecipeStorageRule[]
  attributes: Attribute[]
}

// ─── Inputs de casos de uso ───────────────────────────────────────────────────

export type CreateRecipeInput = {
  name: string
  description?: string
  servings_min: number
  servings_max: number
  difficulty?: DifficultyLevel
  cooking_methods?: CookingMethod[]
  prep_time_min?: number
  cook_time_min?: number
  rest_time_min?: number
  source_url?: string
  notes?: string
  is_public?: boolean
  ingredients: {
    ingredient_id: string
    unit_id: string
    quantity: number
    is_optional?: boolean
    notes?: string
  }[]
  steps: {
    instruction: string
    duration_min?: number
  }[]
}

export type UpdateRecipeInput = {
  name?: string
  description?: string
  servings_min?: number
  servings_max?: number
  difficulty?: DifficultyLevel
  cooking_methods?: CookingMethod[]
  prep_time_min?: number
  cook_time_min?: number
  rest_time_min?: number
  source_url?: string
  notes?: string
  is_public?: boolean
}

export type ListRecipesInput = {
  user_id?: string
  difficulty?: DifficultyLevel
  cooking_methods?: CookingMethod[]
  is_public?: boolean
  status?: LifecycleStatus
  limit?: number
  offset?: number
}

export type CreateRecipeVariationOverrideInput = {
  override_type: OverrideType
  original_ingredient_id?: string
  new_ingredient_id?: string
  new_quantity?: number
  new_unit_id?: string
  notes?: string
}

export type CreateRecipeVariationInput = {
  name: string
  description?: string
  servings_min?: number
  servings_max?: number
  overrides: CreateRecipeVariationOverrideInput[]
}

// ─── Tipos auxiliares para Domain Services ────────────────────────────────────

// Ítem de entrada para NutritionCalculator
export type NutritionItem = {
  ingredient: Ingredient
  quantity: number
  unit: Unit
}
