import type { Unit, UnitConversion, RecipeWithDetails } from '@/modules/knowledge-base'
// Import directo al archivo fuente, no al barrel — ver nota en
// meal-plan-ingredient-aggregator.ts (el barrel arrastra hooks con
// side-effects de React Native que rompen Jest/Node).
import { NutritionCalculator, EMPTY_NUTRITION } from '@/modules/knowledge-base/domain/services/nutrition-calculator'
import type { NutritionalInfo, MealPlanStatistics, DayStatistics } from '../shared.types'
import type { MealPlanWithDetails } from '../meal-plan.types'

// ─── MealPlanStatisticsCalculator ─────────────────────────────────────────────
// Calcula macros y tiempo de cocina del plan, por día y por semana. Puro —
// recibe el plan con detalles y las recetas ya cargadas; nunca se persiste el
// resultado (ADR-005: la nutrición siempre se computa on-demand).
//
// Lo que NO hace:
//   - No decide qué comer ni sugiere cambios — solo reporta lo ya planificado.
//   - No valida MealPlanConstraint (eso es tarea del futuro motor de Fase 2,
//     que comparará esta salida contra las restricciones HARD/SOFT del plan).
//   - No incluye slots EAT_OUT/LEFTOVERS/SKIP en el cómputo nutricional (no
//     hay receta de la que calcular macros); sí los cuenta en meals_planned
//     salvo SKIP.
//   - No llama a IA.

function addNutrition(a: NutritionalInfo, b: NutritionalInfo): NutritionalInfo {
  const add = (x: number | null, y: number | null) =>
    x === null && y === null ? null : (x ?? 0) + (y ?? 0)
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

function scaleNutrition(n: NutritionalInfo, factor: number): NutritionalInfo {
  const scale = (v: number | null) => (v === null ? null : v * factor)
  return {
    calories_kcal: scale(n.calories_kcal),
    protein_g: scale(n.protein_g),
    carbs_g: scale(n.carbs_g),
    sugar_g: scale(n.sugar_g),
    fiber_g: scale(n.fiber_g),
    fat_g: scale(n.fat_g),
    saturated_fat_g: scale(n.saturated_fat_g),
    sodium_mg: scale(n.sodium_mg),
  }
}

export const MealPlanStatisticsCalculator = {
  // `recipes` debe contener toda receta referenciada por un MealAssignment en
  // un slot COOK_AT_HOME del plan (el use-case es responsable de cargarlas).
  calculate(
    plan: MealPlanWithDetails,
    recipes: Map<string, RecipeWithDetails>,
    units: Unit[],
    conversions: UnitConversion[],
  ): MealPlanStatistics {
    let mealsCookAtHome = 0
    let mealsEatOut = 0
    let weeklyNutrition: NutritionalInfo = { ...EMPTY_NUTRITION }

    const byDay: DayStatistics[] = plan.days.map((day) => {
      let cookTimeMin = 0
      let mealsPlanned = 0
      let dayNutrition: NutritionalInfo = { ...EMPTY_NUTRITION }

      for (const slot of day.slots) {
        if (slot.slot_kind === 'SKIP') continue
        mealsPlanned += 1

        if (slot.slot_kind === 'EAT_OUT') {
          mealsEatOut += 1
          continue
        }
        if (slot.slot_kind === 'LEFTOVERS') continue

        // COOK_AT_HOME
        mealsCookAtHome += 1
        for (const assignment of slot.assignments) {
          const recipe = recipes.get(assignment.recipe_id)
          if (!recipe) continue

          cookTimeMin += recipe.cook_time_min ?? 0

          const perServing = NutritionCalculator.calculateForRecipe(
            recipe,
            recipe.ingredients,
            units,
            conversions,
          )
          dayNutrition = addNutrition(dayNutrition, scaleNutrition(perServing, assignment.servings))
        }
      }

      weeklyNutrition = addNutrition(weeklyNutrition, dayNutrition)

      return {
        date: day.date,
        cook_time_min: cookTimeMin,
        meals_planned: mealsPlanned,
        nutrition: dayNutrition,
      }
    })

    return {
      total_cook_time_min: byDay.reduce((sum, d) => sum + d.cook_time_min, 0),
      meals_planned: byDay.reduce((sum, d) => sum + d.meals_planned, 0),
      meals_cook_at_home: mealsCookAtHome,
      meals_eat_out: mealsEatOut,
      weekly_nutrition: weeklyNutrition,
      by_day: byDay,
    }
  },
}
