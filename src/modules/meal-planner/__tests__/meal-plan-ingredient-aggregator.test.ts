import type { Unit } from '@/modules/knowledge-base'
import { MealPlanIngredientAggregator } from '../domain/services/meal-plan-ingredient-aggregator'
import {
  ALL_UNITS,
  GLOBAL_CONVERSIONS,
  INGREDIENT_CHICKEN,
  INGREDIENT_RICE,
  RECIPE_CHICKEN_RICE,
  UNIT_G,
  UNIT_KG,
  makeIngredient,
  makeRecipeWithDetails,
} from './fixtures'

const UNIT_PIECE: Unit = {
  id: 'unit-piece',
  name: 'Piece',
  abbreviation: 'pcs',
  unit_type: 'PIECE',
  system: 'UNIVERSAL',
  base_unit_id: null,
  to_base_factor: null,
  status: 'ACTIVE',
}

describe('MealPlanIngredientAggregator.aggregate', () => {
  it('agrega la cantidad de un ingrediente para una sola asignación', () => {
    const items = MealPlanIngredientAggregator.aggregate(
      [{ recipe: RECIPE_CHICKEN_RICE, servings: RECIPE_CHICKEN_RICE.servings_min }],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const chicken = items.find((i) => i.ingredient_id === INGREDIENT_CHICKEN.id)
    expect(chicken).toEqual({
      ingredient_id: INGREDIENT_CHICKEN.id,
      unit_id: UNIT_G.id,
      total_quantity: 200,
      recipe_count: 1,
    })
  })

  it('escala la cantidad según servings / recipe.servings_min', () => {
    const items = MealPlanIngredientAggregator.aggregate(
      [{ recipe: RECIPE_CHICKEN_RICE, servings: RECIPE_CHICKEN_RICE.servings_min * 2 }],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const chicken = items.find((i) => i.ingredient_id === INGREDIENT_CHICKEN.id)
    expect(chicken?.total_quantity).toBe(400)
  })

  it('suma dos asignaciones de la misma receta y cuenta recipe_count = 1', () => {
    const items = MealPlanIngredientAggregator.aggregate(
      [
        { recipe: RECIPE_CHICKEN_RICE, servings: RECIPE_CHICKEN_RICE.servings_min },
        { recipe: RECIPE_CHICKEN_RICE, servings: RECIPE_CHICKEN_RICE.servings_min },
      ],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const chicken = items.find((i) => i.ingredient_id === INGREDIENT_CHICKEN.id)
    expect(chicken?.total_quantity).toBe(400)
    expect(chicken?.recipe_count).toBe(1)
  })

  it('cuenta recipe_count = 2 cuando dos recetas distintas comparten un ingrediente', () => {
    const otherRecipe = makeRecipeWithDetails({
      id: 'rec-other',
      name: 'Other',
      slug: 'other',
      servings_min: 2,
      ingredients: [
        {
          id: 'ri-other-chicken',
          recipe_id: 'rec-other',
          ingredient_id: INGREDIENT_CHICKEN.id,
          ingredient: INGREDIENT_CHICKEN,
          unit_id: UNIT_G.id,
          unit: UNIT_G,
          quantity: 100,
          is_optional: false,
          notes: null,
        },
      ],
    })

    const items = MealPlanIngredientAggregator.aggregate(
      [
        { recipe: RECIPE_CHICKEN_RICE, servings: RECIPE_CHICKEN_RICE.servings_min },
        { recipe: otherRecipe, servings: otherRecipe.servings_min },
      ],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const chicken = items.find((i) => i.ingredient_id === INGREDIENT_CHICKEN.id)
    expect(chicken?.total_quantity).toBe(300)
    expect(chicken?.recipe_count).toBe(2)
  })

  it('excluye ingredientes marcados is_optional', () => {
    const recipeWithOptional = makeRecipeWithDetails({
      id: 'rec-opt',
      name: 'Optional',
      slug: 'optional',
      servings_min: 2,
      ingredients: [
        {
          id: 'ri-opt',
          recipe_id: 'rec-opt',
          ingredient_id: INGREDIENT_RICE.id,
          ingredient: INGREDIENT_RICE,
          unit_id: UNIT_G.id,
          unit: UNIT_G,
          quantity: 50,
          is_optional: true,
          notes: null,
        },
      ],
    })

    const items = MealPlanIngredientAggregator.aggregate(
      [{ recipe: recipeWithOptional, servings: recipeWithOptional.servings_min }],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(items).toHaveLength(0)
  })

  it('convierte a la unidad por defecto del ingrediente cuando difiere de la unidad de la receta', () => {
    const recipeWithKg = makeRecipeWithDetails({
      id: 'rec-kg',
      name: 'Kg Recipe',
      slug: 'kg-recipe',
      servings_min: 2,
      ingredients: [
        {
          id: 'ri-kg',
          recipe_id: 'rec-kg',
          ingredient_id: INGREDIENT_CHICKEN.id,
          ingredient: INGREDIENT_CHICKEN,
          unit_id: UNIT_KG.id,
          unit: UNIT_KG,
          quantity: 0.2, // 200g
          is_optional: false,
          notes: null,
        },
      ],
    })

    const items = MealPlanIngredientAggregator.aggregate(
      [{ recipe: recipeWithKg, servings: recipeWithKg.servings_min }],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const chicken = items.find((i) => i.ingredient_id === INGREDIENT_CHICKEN.id)
    expect(chicken).toEqual({
      ingredient_id: INGREDIENT_CHICKEN.id,
      unit_id: UNIT_G.id, // default_unit_id del ingrediente
      total_quantity: 200,
      recipe_count: 1,
    })
  })

  it('si la conversión no es posible, conserva la cantidad en la unidad original', () => {
    const ingredientNoDefault = makeIngredient({
      id: 'ing-mystery',
      name: 'Mystery',
      slug: 'mystery',
      default_unit_id: UNIT_PIECE.id,
    })
    const recipeCrossType = makeRecipeWithDetails({
      id: 'rec-cross',
      name: 'Cross Type',
      slug: 'cross-type',
      servings_min: 2,
      ingredients: [
        {
          id: 'ri-cross',
          recipe_id: 'rec-cross',
          ingredient_id: ingredientNoDefault.id,
          ingredient: ingredientNoDefault,
          unit_id: UNIT_G.id, // distinto tipo (WEIGHT) del default_unit_id (PIECE), sin unit_conversions
          unit: UNIT_G,
          quantity: 50,
          is_optional: false,
          notes: null,
        },
      ],
    })

    const items = MealPlanIngredientAggregator.aggregate(
      [{ recipe: recipeCrossType, servings: recipeCrossType.servings_min }],
      [...ALL_UNITS, UNIT_PIECE],
      GLOBAL_CONVERSIONS,
    )
    const mystery = items.find((i) => i.ingredient_id === ingredientNoDefault.id)
    expect(mystery).toEqual({
      ingredient_id: ingredientNoDefault.id,
      unit_id: UNIT_G.id, // se conserva la unidad original, no la canónica
      total_quantity: 50,
      recipe_count: 1,
    })
  })

  it('sin asignaciones devuelve una lista vacía', () => {
    const items = MealPlanIngredientAggregator.aggregate([], ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(items).toEqual([])
  })

  it('usa la unidad de la receta como canónica si el ingrediente no tiene default_unit_id', () => {
    const ingredientNoUnit = makeIngredient({
      id: 'ing-no-unit',
      name: 'No Unit',
      slug: 'no-unit',
      default_unit_id: null,
    })
    const recipe = makeRecipeWithDetails({
      id: 'rec-no-unit',
      name: 'No Unit Recipe',
      slug: 'no-unit-recipe',
      servings_min: 2,
      ingredients: [
        {
          id: 'ri-no-unit',
          recipe_id: 'rec-no-unit',
          ingredient_id: ingredientNoUnit.id,
          ingredient: ingredientNoUnit,
          unit_id: UNIT_G.id,
          unit: UNIT_G,
          quantity: 30,
          is_optional: false,
          notes: null,
        },
      ],
    })

    const items = MealPlanIngredientAggregator.aggregate(
      [{ recipe, servings: recipe.servings_min }],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(items[0]).toEqual({
      ingredient_id: ingredientNoUnit.id,
      unit_id: UNIT_G.id,
      total_quantity: 30,
      recipe_count: 1,
    })
  })

  it('si la unidad canónica no está en el catálogo provisto, conserva la unidad original', () => {
    const recipeWithKg = makeRecipeWithDetails({
      id: 'rec-missing-unit',
      name: 'Missing Unit',
      slug: 'missing-unit',
      servings_min: 2,
      ingredients: [
        {
          id: 'ri-missing-unit',
          recipe_id: 'rec-missing-unit',
          ingredient_id: INGREDIENT_CHICKEN.id, // default_unit_id = UNIT_G
          ingredient: INGREDIENT_CHICKEN,
          unit_id: UNIT_KG.id,
          unit: UNIT_KG,
          quantity: 0.2,
          is_optional: false,
          notes: null,
        },
      ],
    })

    // No se incluye UNIT_G en el catálogo: la conversión a la unidad canónica
    // es imposible aunque el ingrediente sí declare un default_unit_id.
    const items = MealPlanIngredientAggregator.aggregate(
      [{ recipe: recipeWithKg, servings: recipeWithKg.servings_min }],
      [UNIT_KG],
      GLOBAL_CONVERSIONS,
    )
    expect(items[0]).toEqual({
      ingredient_id: INGREDIENT_CHICKEN.id,
      unit_id: UNIT_KG.id,
      total_quantity: 0.2,
      recipe_count: 1,
    })
  })
})
