import type { NutritionalInfo } from '../shared.types'
import type { NutritionItem } from '../recipe.types'
import type { Ingredient } from '../ingredient.types'
import type {
  RecipeIngredient,
  RecipeVariation,
  VariationIngredientOverride,
  Recipe,
} from '../recipe.types'
import { UnitConverter } from './unit-converter'
import type { Unit, UnitConversion } from '../shared.types'

// ─── NutritionCalculator ──────────────────────────────────────────────────────
// Calcula información nutricional de forma dinámica. No almacena resultados.
// No accede a la base de datos — recibe todos los datos ya cargados.
// ADR-005: La nutrición se calcula siempre desde los datos actuales de los ingredientes.
// ADR-015: Exportable como servicio puro para uso en otros módulos.

export const EMPTY_NUTRITION: NutritionalInfo = {
  calories_kcal: null,
  protein_g: null,
  carbs_g: null,
  sugar_g: null,
  fiber_g: null,
  fat_g: null,
  saturated_fat_g: null,
  sodium_mg: null,
}

// Calcula la contribución nutricional de un item (ingrediente + cantidad + unidad).
// quantity debe estar en gramos para el cálculo.
function calculateContribution(
  nutrition: NutritionalInfo,
  grams: number,
): NutritionalInfo {
  const scale = grams / 100
  const scale100 = (val: number | null) => (val === null ? null : val * scale)
  return {
    calories_kcal: scale100(nutrition.calories_kcal),
    protein_g: scale100(nutrition.protein_g),
    carbs_g: scale100(nutrition.carbs_g),
    sugar_g: scale100(nutrition.sugar_g),
    fiber_g: scale100(nutrition.fiber_g),
    fat_g: scale100(nutrition.fat_g),
    saturated_fat_g: scale100(nutrition.saturated_fat_g),
    sodium_mg: scale100(nutrition.sodium_mg),
  }
}

function addNutrition(a: NutritionalInfo, b: NutritionalInfo): NutritionalInfo {
  const add = (x: number | null, y: number | null) => {
    if (x === null && y === null) return null
    return (x ?? 0) + (y ?? 0)
  }
  return {
    calories_kcal: add(a.calories_kcal, b.calories_kcal),
    protein_g: add(a.protein_g, b.protein_g),
    carbs_g: add(a.carbs_g, b.carbs_g),
    sugar_g: add(a.sugar_g, b.sugar_g),
    fiber_g: add(a.fiber_g, b.fiber_g),
    fat_g: add(a.fat_g, b.fat_g),
    saturated_fat_g: add(a.saturated_fat_g, b.saturated_fat_g),
    sodium_mg: add(a.sodium_mg, b.sodium_mg),
  }
}

function divideNutrition(
  totals: NutritionalInfo,
  servings: number,
): NutritionalInfo {
  const div = (val: number | null) => (val === null ? null : val / servings)
  return {
    calories_kcal: div(totals.calories_kcal),
    protein_g: div(totals.protein_g),
    carbs_g: div(totals.carbs_g),
    sugar_g: div(totals.sugar_g),
    fiber_g: div(totals.fiber_g),
    fat_g: div(totals.fat_g),
    saturated_fat_g: div(totals.saturated_fat_g),
    sodium_mg: div(totals.sodium_mg),
  }
}

export const NutritionCalculator = {
  // Calcula macros para una lista arbitraria de {ingrediente, cantidad, unidad}.
  // Cada item se convierte a gramos antes de escalar los macros del ingrediente.
  calculateForIngredientList(
    items: NutritionItem[],
    units: Unit[],
    conversions: UnitConversion[],
  ): NutritionalInfo {
    let total: NutritionalInfo = { ...EMPTY_NUTRITION }

    for (const item of items) {
      const gramsResult = UnitConverter.toGrams(
        item.quantity,
        item.unit,
        units,
        conversions,
        item.ingredient,
      )
      if (!gramsResult.ok) continue
      const contribution = calculateContribution(
        item.ingredient.nutrition,
        gramsResult.data,
      )
      total = addNutrition(total, contribution)
    }

    return total
  },

  // Calcula macros totales de una receta divididos por número de raciones.
  calculateForRecipe(
    recipe: Recipe,
    recipeIngredients: RecipeIngredient[],
    units: Unit[],
    conversions: UnitConversion[],
    servings?: number,
  ): NutritionalInfo {
    const items: NutritionItem[] = recipeIngredients.map((ri) => ({
      ingredient: ri.ingredient,
      quantity: ri.quantity,
      unit: ri.unit,
    }))

    const totalServings = servings ?? recipe.servings_min
    if (totalServings <= 0) return { ...EMPTY_NUTRITION }

    const total = NutritionCalculator.calculateForIngredientList(
      items,
      units,
      conversions,
    )
    return divideNutrition(total, totalServings)
  },

  // Calcula macros para una variación aplicando los overrides sobre la receta base.
  calculateForVariation(
    recipe: Recipe,
    variation: RecipeVariation,
    baseIngredients: RecipeIngredient[],
    allIngredients: Ingredient[],
    units: Unit[],
    conversions: UnitConversion[],
    servings?: number,
  ): NutritionalInfo {
    const ingredientMap = new Map(allIngredients.map((i) => [i.id, i]))

    // Aplicar overrides al listado base
    let items: NutritionItem[] = baseIngredients.map((ri) => ({
      ingredient: ri.ingredient,
      quantity: ri.quantity,
      unit: ri.unit,
    }))

    for (const override of variation.overrides) {
      items = applyOverride(items, override, ingredientMap, units)
    }

    const totalServings =
      servings ?? variation.servings_min ?? recipe.servings_min
    if (totalServings <= 0) return { ...EMPTY_NUTRITION }

    const total = NutritionCalculator.calculateForIngredientList(
      items,
      units,
      conversions,
    )
    return divideNutrition(total, totalServings)
  },
}

function applyOverride(
  items: NutritionItem[],
  override: VariationIngredientOverride,
  ingredientMap: Map<string, Ingredient>,
  units: Unit[],
): NutritionItem[] {
  const unitMap = new Map(units.map((u) => [u.id, u]))

  switch (override.override_type) {
    case 'REMOVE':
      return items.filter(
        (item) => item.ingredient.id !== override.original_ingredient_id,
      )

    case 'ADD': {
      const ingredient = ingredientMap.get(override.new_ingredient_id ?? '')
      const unit = unitMap.get(override.new_unit_id ?? '')
      if (!ingredient || !unit || override.new_quantity === null) return items
      return [...items, { ingredient, quantity: override.new_quantity, unit }]
    }

    case 'REPLACE': {
      const newIngredient = ingredientMap.get(override.new_ingredient_id ?? '')
      const newUnit = unitMap.get(override.new_unit_id ?? '')
      if (!newIngredient || !newUnit || override.new_quantity === null)
        return items
      return items.map((item) =>
        item.ingredient.id === override.original_ingredient_id
          ? {
              ingredient: newIngredient,
              quantity: override.new_quantity!,
              unit: newUnit,
            }
          : item,
      )
    }

    // Mismo ingrediente, otra cantidad (ej. duplicar la proteína, reducir el aceite).
    case 'ADJUST_QUANTITY': {
      const unit = unitMap.get(override.new_unit_id ?? '')
      if (!unit || override.new_quantity === null) return items
      return items.map((item) =>
        item.ingredient.id === override.original_ingredient_id
          ? {
              ingredient: item.ingredient,
              quantity: override.new_quantity!,
              unit,
            }
          : item,
      )
    }

    default:
      return items
  }
}
