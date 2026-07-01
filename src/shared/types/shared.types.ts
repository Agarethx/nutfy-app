export type ID = string

export type Nullable<T> = T | null

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type NutritionalGoal = 'lose_weight' | 'maintain' | 'gain_muscle'

export type Timestamps = {
  created_at: string
  updated_at: string
}

// Tipos eliminados — vivían en shared.types.ts pero colisionaban con el dominio:
// - Unit         → entidad de Knowledge Base (UUID, unit_type, to_base_factor, etc.)
// - DietaryRestriction → entidad AllergenAlert del módulo Profile
// - CookingLevel → campo del agregado CookingPreference en Profile
// - NutritionalInfo → Value Object de Knowledge Base (8 campos: calories_kcal, protein_g, etc.)
// Usar los tipos de cada módulo a través de su index.ts.
