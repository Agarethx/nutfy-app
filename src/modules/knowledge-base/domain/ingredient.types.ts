import type {
  Allergen,
  Attribute,
  DurationUnit,
  LifecycleStatus,
  Micronutrient,
  NutritionalInfo,
  Seasonality,
  StorageMethod,
  Unit,
} from './shared.types'

// ─── Categorías ───────────────────────────────────────────────────────────────

export type IngredientCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  status: LifecycleStatus
  created_at: string
  updated_at: string
}

export type IngredientSubcategory = {
  id: string
  category_id: string
  slug: string
  name: string
  description: string | null
  status: LifecycleStatus
  created_at: string
  updated_at: string
}

// ─── Miembros del agregado Ingredient ────────────────────────────────────────

export type IngredientTranslation = {
  id: string
  ingredient_id: string
  locale: string
  name: string
  description: string | null
}

// Sinónimo/regionalismo curado (ej. "jitomate" → Tomate). Distinto de
// IngredientTranslation: mismo idioma, no es una traducción a otro locale.
export type IngredientAlias = {
  id: string
  ingredient_id: string
  alias: string
  locale: string | null
}

export type IngredientAllergen = {
  ingredient_id: string
  allergen_id: string
  allergen: Allergen
  is_trace: boolean
}

export type IngredientMicronutrient = {
  ingredient_id: string
  micronutrient_id: string
  micronutrient: Micronutrient
  amount_per_100g: number
}

export type IngredientStorageRule = {
  id: string
  ingredient_id: string
  storage_method_id: string
  storage_method: StorageMethod
  max_duration: number
  duration_unit: DurationUnit
  is_recommended: boolean
  can_freeze: boolean
  notes: string | null
}

export type IngredientUnitConversion = {
  id: string
  ingredient_id: string
  from_unit_id: string
  from_unit: Unit
  to_unit_id: string
  to_unit: Unit
  factor: number
  is_default: boolean
  notes: string | null
}

// ─── Ingredient (agregado raíz) ───────────────────────────────────────────────

export type Ingredient = {
  id: string
  slug: string
  name: string
  description: string | null
  category_id: string | null
  subcategory_id: string | null
  default_unit_id: string | null
  image_url: string | null
  countries: string[]
  seasonality: Seasonality
  nutrition: NutritionalInfo
  is_system: boolean
  status: LifecycleStatus
  created_at: string
  updated_at: string
  deprecated_at: string | null
}

// Ingredient con todos sus miembros del agregado cargados
export type IngredientWithDetails = Ingredient & {
  category: IngredientCategory | null
  subcategory: IngredientSubcategory | null
  translations: IngredientTranslation[]
  allergens: IngredientAllergen[]
  micronutrients: IngredientMicronutrient[]
  storage_rules: IngredientStorageRule[]
  unit_conversions: IngredientUnitConversion[]
  attributes: Attribute[]
}

// ─── Inputs de casos de uso ───────────────────────────────────────────────────

export type SearchIngredientsInput = {
  query: string
  locale?: string
  category_id?: string
  status?: LifecycleStatus
  limit?: number
  offset?: number
}

export type ListIngredientsInput = {
  category_id?: string
  subcategory_id?: string
  status?: LifecycleStatus
  is_system?: boolean
  limit?: number
  offset?: number
}

export type CreateIngredientInput = {
  name: string
  description?: string
  category_id?: string
  subcategory_id?: string
  default_unit_id?: string
  countries?: string[]
  seasonality_months?: number[]
  nutrition?: Partial<NutritionalInfo>
}

export type UpdateIngredientInput = {
  name?: string
  description?: string
  category_id?: string | null
  subcategory_id?: string | null
  default_unit_id?: string | null
  countries?: string[]
  seasonality_months?: number[]
  nutrition?: Partial<NutritionalInfo>
}

// ─── Motor de búsqueda difusa (match_ingredients en DB) ───────────────────────

// Una fila candidata devuelta por la función SQL match_ingredients(). El mejor
// score por ingrediente (no uno por fuente); ver migración
// 20260629000009_knowledge_base_create_ingredient_aliases.sql.
export type IngredientMatchCandidate = {
  ingredient_id: string
  name: string
  slug: string
  status: LifecycleStatus
  score: number
  matched_via: 'name' | 'translation' | 'alias'
  matched_text: string
}
