// ─── Public API del módulo Knowledge Base ────────────────────────────────────
// Única entrada pública. Otros módulos solo importan desde aquí.
// ADR-015: Domain Services exportados son consumibles por otros módulos.

// ─── Domain types ─────────────────────────────────────────────────────────────

export type {
  LifecycleStatus,
  UnitType,
  MeasurementSystem,
  StorageMethodType,
  DurationUnit,
  DifficultyLevel,
  CookingMethod,
  OverrideType,
  AttributeScope,
  AttributeCategory,
  MicronutrientCategory,
  NutritionalInfo,
  Seasonality,
  Unit,
  UnitConversion,
  StorageMethod,
  Allergen,
  Micronutrient,
  Attribute,
} from './domain/shared.types'

export type {
  IngredientCategory,
  IngredientSubcategory,
  IngredientTranslation,
  IngredientAlias,
  IngredientAllergen,
  IngredientMicronutrient,
  IngredientStorageRule,
  IngredientUnitConversion,
  Ingredient,
  IngredientWithDetails,
  IngredientMatchCandidate,
  SearchIngredientsInput,
  ListIngredientsInput,
  CreateIngredientInput,
  UpdateIngredientInput,
} from './domain/ingredient.types'

export type {
  RecipeIngredient,
  RecipeStep,
  VariationIngredientOverride,
  RecipeVariation,
  RecipeStorageRule,
  Recipe,
  RecipeWithDetails,
  CreateRecipeInput,
  UpdateRecipeInput,
  ListRecipesInput,
  NutritionItem,
  CreateRecipeVariationInput,
  CreateRecipeVariationOverrideInput,
} from './domain/recipe.types'

// ─── Domain Services (ADR-015) ────────────────────────────────────────────────

export { NutritionCalculator, EMPTY_NUTRITION } from './domain/services/nutrition-calculator'
export { UnitConverter } from './domain/services/unit-converter'
export { StorageAdvisor } from './domain/services/storage-advisor'
export { IngredientTextParser } from './domain/services/ingredient-text-parser'
export type { ParsedIngredientLine } from './domain/services/ingredient-text-parser'

// ─── Motor de normalización de ingredientes ───────────────────────────────────
// Convierte texto libre en un Ingredient interno (match difuso o creación
// PENDING_REVIEW). Usado por AI al procesar una receta importada antes de
// guardarla (bounded-contexts.md: AI → Knowledge Base ✓).

export { IngredientRepository } from './infrastructure/repositories/ingredient.repository'
export {
  matchIngredientLine,
  matchIngredientLines,
} from './application/use-cases/match-ingredient.use-case'
export type {
  IngredientMatchConfidence,
  IngredientMatchResult,
} from './application/use-cases/match-ingredient.use-case'

// ─── Generación automática de variantes dietéticas ────────────────────────────
// Alta proteína, baja calórica, vegetariana, vegana, keto, sin gluten, sin
// lactosa. Reutiliza el motor de matching de arriba (sin IA) y
// NutritionCalculator (sin IA) para recalcular la nutrición de cada variante.

export { RecipeRepository } from './infrastructure/repositories/recipe.repository'
export { StorageRepository } from './infrastructure/repositories/storage.repository'
export {
  RecipeVariantGenerator,
  DIET_VARIANT_METADATA,
} from './domain/services/recipe-variant-generator'
export type {
  DietVariantType,
  ChangePlan,
  VariantIngredientContext,
} from './domain/services/recipe-variant-generator'
export {
  generateRecipeVariants,
  ALL_DIET_VARIANT_TYPES,
} from './application/use-cases/generate-recipe-variants.use-case'
export type {
  GenerateRecipeVariantsDeps,
  GeneratedVariantResult,
  VariantChangeSummary,
} from './application/use-cases/generate-recipe-variants.use-case'

// ─── Validation schemas (Zod + React Hook Form) ───────────────────────────────

export {
  createIngredientSchema,
  updateIngredientSchema,
} from './validation/ingredient.schema'
export type {
  CreateIngredientFormValues,
  UpdateIngredientFormValues,
} from './validation/ingredient.schema'

export {
  createRecipeSchema,
  updateRecipeSchema,
  recipeIngredientSchema,
  recipeStepSchema,
} from './validation/recipe.schema'
export type {
  CreateRecipeFormValues,
  UpdateRecipeFormValues,
  RecipeIngredientFormValues,
  RecipeStepFormValues,
} from './validation/recipe.schema'

// ─── Hooks ────────────────────────────────────────────────────────────────────

export { useIngredient } from './hooks/use-ingredient'
export { useIngredients } from './hooks/use-ingredients'
export { useSearchIngredients } from './hooks/use-search-ingredients'
export { useCategories, useSubcategories } from './hooks/use-categories'
export { useCreateIngredient } from './hooks/use-create-ingredient'
export { useUpdateIngredient } from './hooks/use-update-ingredient'

export { useRecipe } from './hooks/use-recipe'
export { useRecipes } from './hooks/use-recipes'
export { useCreateRecipe } from './hooks/use-create-recipe'
export { useUpdateRecipe } from './hooks/use-update-recipe'
export { useRecipeNutrition } from './hooks/use-recipe-nutrition'

export { useUnits } from './hooks/use-units'
export { useStorageMethods } from './hooks/use-storage-methods'

// ─── Query keys ───────────────────────────────────────────────────────────────

export { queryKeys as knowledgeBaseQueryKeys } from './hooks/query-keys'
