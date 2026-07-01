// Enumeraciones y Value Objects compartidos dentro del módulo Knowledge Base.
// Este archivo no importa nada externo — puro TypeScript.

// ─── Enumeraciones ────────────────────────────────────────────────────────────

export type LifecycleStatus = 'ACTIVE' | 'PENDING_REVIEW' | 'DEPRECATED'

export type UnitType = 'WEIGHT' | 'VOLUME' | 'PIECE' | 'CUSTOM'

export type MeasurementSystem = 'METRIC' | 'IMPERIAL' | 'UNIVERSAL'

export type StorageMethodType =
  'FRIDGE' | 'FREEZER' | 'PANTRY' | 'COUNTER' | 'COOL_DARK' | 'CELLAR'

export type DurationUnit = 'DAYS' | 'WEEKS' | 'MONTHS'

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'

export type CookingMethod =
  | 'RAW'
  | 'BAKE'
  | 'GRILL'
  | 'ROAST'
  | 'STEAM'
  | 'BOIL'
  | 'SAUTE'
  | 'FRY'
  | 'AIR_FRY'
  | 'SLOW_COOK'
  | 'PRESSURE_COOK'
  | 'MICROWAVE'
  | 'FERMENT'
  | 'CURE'
  | 'SOUS_VIDE'

// ADJUST_QUANTITY: mismo ingrediente, otra cantidad (ej. duplicar la proteína,
// reducir el aceite a la mitad). REPLACE exige original <> new, así que no
// puede modelar este caso — ver migración
// 20260629000010_knowledge_base_add_adjust_quantity_override.sql.
export type OverrideType = 'ADD' | 'REMOVE' | 'REPLACE' | 'ADJUST_QUANTITY'

export type AttributeScope = 'INGREDIENT' | 'RECIPE' | 'BOTH'

export type AttributeCategory =
  'DIETARY' | 'LIFESTYLE' | 'COOKING' | 'TEXTURE' | 'ALLERGEN_FREE' | 'OTHER'

export type MicronutrientCategory = 'VITAMIN' | 'MINERAL' | 'OTHER'

// ─── Value Objects ────────────────────────────────────────────────────────────

// Macronutrientes por 100g. Todos los campos son nullable (datos parciales válidos).
// Invariantes: sugar_g ≤ carbs_g, saturated_fat_g ≤ fat_g, todos no-null ≥ 0.
export type NutritionalInfo = {
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  sugar_g: number | null
  fiber_g: number | null
  fat_g: number | null
  saturated_fat_g: number | null
  sodium_mg: number | null
}

// Meses de temporada (1=enero … 12=diciembre). Vacío = disponible todo el año.
export type Seasonality = {
  months: number[]
}

// ─── Entidades de referencia global ──────────────────────────────────────────

export type Unit = {
  id: string
  name: string
  abbreviation: string
  unit_type: UnitType
  system: MeasurementSystem
  base_unit_id: string | null
  to_base_factor: number | null
  status: LifecycleStatus
}

export type UnitConversion = {
  id: string
  from_unit: string
  to_unit: string
  factor: number
}

export type StorageMethod = {
  id: string
  slug: string
  storage_type: StorageMethodType
  name: string
  description: string | null
  typical_temp_min_c: number | null
  typical_temp_max_c: number | null
  status: LifecycleStatus
}

export type Allergen = {
  id: string
  slug: string
  name: string
  is_eu_mandatory: boolean
  status: LifecycleStatus
}

export type Micronutrient = {
  id: string
  slug: string
  name: string
  category: MicronutrientCategory
  unit_id: string | null
  status: LifecycleStatus
}

export type Attribute = {
  id: string
  slug: string
  name: string
  scope: AttributeScope
  category: AttributeCategory
  description: string | null
  status: LifecycleStatus
}
