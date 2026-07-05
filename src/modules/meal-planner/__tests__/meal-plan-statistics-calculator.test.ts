import { MealPlanStatisticsCalculator } from '../domain/services/meal-plan-statistics-calculator'
import {
  ALL_UNITS,
  GLOBAL_CONVERSIONS,
  RECIPE_CHICKEN_RICE,
  UNIT_G,
  makeDayWithSlots,
  makeIngredient,
  makeMealAssignment,
  makeMealPlanWithDetails,
  makeRecipeWithDetails,
  makeSlotWithAssignments,
} from './fixtures'

const RECIPES = new Map([[RECIPE_CHICKEN_RICE.id, RECIPE_CHICKEN_RICE]])

describe('MealPlanStatisticsCalculator.calculate', () => {
  it('suma el cook_time_min de las recetas asignadas en slots COOK_AT_HOME', () => {
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [makeMealAssignment({ recipe_id: RECIPE_CHICKEN_RICE.id, servings: 2 })],
            }),
          ],
        }),
      ],
    })

    const stats = MealPlanStatisticsCalculator.calculate(plan, RECIPES, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(stats.total_cook_time_min).toBe(RECIPE_CHICKEN_RICE.cook_time_min)
    expect(stats.by_day[0].cook_time_min).toBe(RECIPE_CHICKEN_RICE.cook_time_min)
  })

  it('calcula la nutrición del día escalando por servings de la asignación', () => {
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [
                makeMealAssignment({ recipe_id: RECIPE_CHICKEN_RICE.id, servings: RECIPE_CHICKEN_RICE.servings_min }),
              ],
            }),
          ],
        }),
      ],
    })

    const stats = MealPlanStatisticsCalculator.calculate(plan, RECIPES, ALL_UNITS, GLOBAL_CONVERSIONS)
    // chicken 200g + rice 150g (ver fixtures) = total de la receta completa
    expect(stats.weekly_nutrition.calories_kcal).toBeCloseTo(525)
    expect(stats.weekly_nutrition.protein_g).toBeCloseTo(66.05)
  })

  it('EAT_OUT no aporta tiempo de cocina ni nutrición, pero cuenta en meals_planned', () => {
    const plan = makeMealPlanWithDetails({
      days: [makeDayWithSlots({ slots: [makeSlotWithAssignments({ slot_kind: 'EAT_OUT', assignments: [] })] })],
    })

    const stats = MealPlanStatisticsCalculator.calculate(plan, RECIPES, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(stats.total_cook_time_min).toBe(0)
    expect(stats.meals_eat_out).toBe(1)
    expect(stats.meals_cook_at_home).toBe(0)
    expect(stats.meals_planned).toBe(1)
    expect(stats.weekly_nutrition.calories_kcal).toBeNull()
  })

  it('SKIP no cuenta en meals_planned', () => {
    const plan = makeMealPlanWithDetails({
      days: [makeDayWithSlots({ slots: [makeSlotWithAssignments({ slot_kind: 'SKIP', assignments: [] })] })],
    })

    const stats = MealPlanStatisticsCalculator.calculate(plan, RECIPES, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(stats.meals_planned).toBe(0)
  })

  it('LEFTOVERS cuenta en meals_planned pero no aporta cook_time ni nutrición', () => {
    const plan = makeMealPlanWithDetails({
      days: [makeDayWithSlots({ slots: [makeSlotWithAssignments({ slot_kind: 'LEFTOVERS', assignments: [] })] })],
    })

    const stats = MealPlanStatisticsCalculator.calculate(plan, RECIPES, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(stats.meals_planned).toBe(1)
    expect(stats.total_cook_time_min).toBe(0)
  })

  it('produce un by_day con una entrada por cada día del plan', () => {
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({ date: '2026-06-29', position: 0, slots: [] }),
        makeDayWithSlots({ date: '2026-06-30', position: 1, slots: [] }),
      ],
    })

    const stats = MealPlanStatisticsCalculator.calculate(plan, RECIPES, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(stats.by_day.map((d) => d.date)).toEqual(['2026-06-29', '2026-06-30'])
  })

  it('un plan sin días produce estadísticas vacías', () => {
    const plan = makeMealPlanWithDetails({ days: [] })
    const stats = MealPlanStatisticsCalculator.calculate(plan, RECIPES, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(stats.total_cook_time_min).toBe(0)
    expect(stats.meals_planned).toBe(0)
    expect(stats.by_day).toEqual([])
  })

  it('trata cook_time_min null como 0', () => {
    const recipeNoCookTime = makeRecipeWithDetails({
      id: 'rec-no-cook-time',
      name: 'No Cook Time',
      slug: 'no-cook-time',
      cook_time_min: null,
    })
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [makeMealAssignment({ recipe_id: recipeNoCookTime.id })],
            }),
          ],
        }),
      ],
    })

    const stats = MealPlanStatisticsCalculator.calculate(
      plan,
      new Map([[recipeNoCookTime.id, recipeNoCookTime]]),
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(stats.total_cook_time_min).toBe(0)
  })

  it('conserva null cuando todos los ingredientes de la receta carecen de datos nutricionales', () => {
    const ingredientNoNutrition = makeIngredient({
      id: 'ing-no-nutrition',
      name: 'Mystery Herb',
      slug: 'mystery-herb',
    })
    const recipeNoNutrition = makeRecipeWithDetails({
      id: 'rec-no-nutrition',
      name: 'No Nutrition',
      slug: 'no-nutrition',
      servings_min: 1,
      ingredients: [
        {
          id: 'ri-no-nutrition',
          recipe_id: 'rec-no-nutrition',
          ingredient_id: ingredientNoNutrition.id,
          ingredient: ingredientNoNutrition,
          unit_id: UNIT_G.id,
          unit: UNIT_G,
          quantity: 5,
          is_optional: false,
          notes: null,
        },
      ],
    })
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [makeMealAssignment({ recipe_id: recipeNoNutrition.id, servings: 1 })],
            }),
          ],
        }),
      ],
    })

    const stats = MealPlanStatisticsCalculator.calculate(
      plan,
      new Map([[recipeNoNutrition.id, recipeNoNutrition]]),
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(stats.weekly_nutrition.calories_kcal).toBeNull()
    expect(stats.weekly_nutrition.protein_g).toBeNull()
  })

  it('suma un día con nutrición conocida y otro sin datos sin perder el total acumulado', () => {
    const ingredientNoNutrition = makeIngredient({
      id: 'ing-no-nutrition-2',
      name: 'Mystery Herb 2',
      slug: 'mystery-herb-2',
    })
    const recipeNoNutrition = makeRecipeWithDetails({
      id: 'rec-no-nutrition-2',
      name: 'No Nutrition 2',
      slug: 'no-nutrition-2',
      servings_min: 1,
      ingredients: [
        {
          id: 'ri-no-nutrition-2',
          recipe_id: 'rec-no-nutrition-2',
          ingredient_id: ingredientNoNutrition.id,
          ingredient: ingredientNoNutrition,
          unit_id: UNIT_G.id,
          unit: UNIT_G,
          quantity: 5,
          is_optional: false,
          notes: null,
        },
      ],
    })
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          date: '2026-06-29',
          position: 0,
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [
                makeMealAssignment({
                  recipe_id: RECIPE_CHICKEN_RICE.id,
                  servings: RECIPE_CHICKEN_RICE.servings_min,
                }),
              ],
            }),
          ],
        }),
        makeDayWithSlots({
          date: '2026-06-30',
          position: 1,
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [makeMealAssignment({ recipe_id: recipeNoNutrition.id, servings: 1 })],
            }),
          ],
        }),
      ],
    })

    const stats = MealPlanStatisticsCalculator.calculate(
      plan,
      new Map([
        [RECIPE_CHICKEN_RICE.id, RECIPE_CHICKEN_RICE],
        [recipeNoNutrition.id, recipeNoNutrition],
      ]),
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(stats.weekly_nutrition.calories_kcal).toBeCloseTo(525)
  })

  it('ignora una asignación cuya receta no está en el mapa `recipes`', () => {
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [makeMealAssignment({ recipe_id: 'rec-not-loaded' })],
            }),
          ],
        }),
      ],
    })

    const stats = MealPlanStatisticsCalculator.calculate(plan, new Map(), ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(stats.total_cook_time_min).toBe(0)
    expect(stats.meals_cook_at_home).toBe(1)
  })
})
