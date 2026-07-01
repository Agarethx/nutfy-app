import {
  NutritionCalculator,
  EMPTY_NUTRITION,
} from '../domain/services/nutrition-calculator'
import type { NutritionItem } from '../domain/recipe.types'
import {
  ALL_UNITS,
  GLOBAL_CONVERSIONS,
  UNIT_G,
  UNIT_KG,
  UNIT_PIECE,
  INGREDIENT_CHICKEN,
  INGREDIENT_RICE,
  INGREDIENT_OIL,
  INGREDIENT_NO_NUTRITION,
  INGREDIENT_EGG,
  RECIPE_CHICKEN_RICE,
  RI_CHICKEN_200G,
  RI_RICE_150G,
  RI_OIL_10G,
  makeVariation,
  makeOverrideRemove,
  makeOverrideAdd,
  makeOverrideReplace,
  makeOverrideAdjustQuantity,
} from './fixtures'

// Helpers de comparación redondeada
function expectNutrition(
  actual: ReturnType<typeof NutritionCalculator.calculateForIngredientList>,
  expected: Partial<typeof EMPTY_NUTRITION>,
) {
  for (const key of Object.keys(expected) as (keyof typeof EMPTY_NUTRITION)[]) {
    const exp = expected[key]
    const act = actual[key]
    if (exp === null) {
      expect(act).toBeNull()
    } else {
      expect(act).not.toBeNull()
      expect(act as number).toBeCloseTo(exp as number, 2)
    }
  }
}

// ─── calculateForIngredientList ───────────────────────────────────────────────

describe('NutritionCalculator.calculateForIngredientList', () => {
  it('lista vacía devuelve EMPTY_NUTRITION', () => {
    const result = NutritionCalculator.calculateForIngredientList(
      [],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(result).toEqual(EMPTY_NUTRITION)
  })

  it('calcula macros para un único ingrediente en gramos', () => {
    const items: NutritionItem[] = [
      { ingredient: INGREDIENT_CHICKEN, quantity: 100, unit: UNIT_G },
    ]
    const result = NutritionCalculator.calculateForIngredientList(
      items,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // 100g de pollo = exactamente los valores por 100g
    expectNutrition(result, {
      calories_kcal: 165,
      protein_g: 31,
      carbs_g: 0,
      fat_g: 3.6,
    })
  })

  it('escala correctamente: 200g de pollo = doble de valores base', () => {
    const items: NutritionItem[] = [
      { ingredient: INGREDIENT_CHICKEN, quantity: 200, unit: UNIT_G },
    ]
    const result = NutritionCalculator.calculateForIngredientList(
      items,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expectNutrition(result, {
      calories_kcal: 330,
      protein_g: 62,
      fat_g: 7.2,
    })
  })

  it('acumula macros de múltiples ingredientes', () => {
    const items: NutritionItem[] = [
      { ingredient: INGREDIENT_CHICKEN, quantity: 200, unit: UNIT_G }, // 330 kcal
      { ingredient: INGREDIENT_RICE, quantity: 150, unit: UNIT_G }, // 195 kcal
      { ingredient: INGREDIENT_OIL, quantity: 10, unit: UNIT_G }, // 88.4 kcal
    ]
    const result = NutritionCalculator.calculateForIngredientList(
      items,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expectNutrition(result, {
      calories_kcal: 330 + 195 + 88.4,
      protein_g: 62 + 4.05 + 0,
    })
  })

  it('convierte unidades antes de calcular (1 kg pollo = 1000g)', () => {
    const items: NutritionItem[] = [
      { ingredient: INGREDIENT_CHICKEN, quantity: 1, unit: UNIT_KG },
    ]
    const result = NutritionCalculator.calculateForIngredientList(
      items,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // 1000g × 165kcal/100g = 1650 kcal
    expectNutrition(result, { calories_kcal: 1650 })
  })

  it('ignora ingredientes cuya conversión de unidad falla (PIECE sin datos)', () => {
    const items: NutritionItem[] = [
      { ingredient: INGREDIENT_CHICKEN, quantity: 100, unit: UNIT_G },
      // UNIT_PIECE (id: 'unit-piece') no tiene conversión a gramos sin datos del ingrediente
      { ingredient: INGREDIENT_EGG, quantity: 2, unit: UNIT_PIECE },
    ]
    // El huevo en unidades PIECE sin conversión falla silenciosamente
    const result = NutritionCalculator.calculateForIngredientList(
      items,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // Solo cuenta el pollo
    expectNutrition(result, { calories_kcal: 165 })
  })

  describe('null-safety', () => {
    it('ingrediente sin datos nutricionales contribuye null por campo', () => {
      const items: NutritionItem[] = [
        { ingredient: INGREDIENT_NO_NUTRITION, quantity: 100, unit: UNIT_G },
      ]
      const result = NutritionCalculator.calculateForIngredientList(
        items,
        ALL_UNITS,
        GLOBAL_CONVERSIONS,
      )
      expect(result).toEqual(EMPTY_NUTRITION)
    })

    it('null + valor = valor (null-safety en addNutrition)', () => {
      const items: NutritionItem[] = [
        { ingredient: INGREDIENT_NO_NUTRITION, quantity: 100, unit: UNIT_G }, // todo null
        { ingredient: INGREDIENT_CHICKEN, quantity: 100, unit: UNIT_G }, // datos completos
      ]
      const result = NutritionCalculator.calculateForIngredientList(
        items,
        ALL_UNITS,
        GLOBAL_CONVERSIONS,
      )
      // null + 165 = 165 (no null)
      expectNutrition(result, { calories_kcal: 165 })
      expect(result.calories_kcal).not.toBeNull()
    })

    it('null + null = null', () => {
      const items: NutritionItem[] = [
        { ingredient: INGREDIENT_NO_NUTRITION, quantity: 100, unit: UNIT_G },
        { ingredient: INGREDIENT_NO_NUTRITION, quantity: 50, unit: UNIT_G },
      ]
      const result = NutritionCalculator.calculateForIngredientList(
        items,
        ALL_UNITS,
        GLOBAL_CONVERSIONS,
      )
      expect(result.calories_kcal).toBeNull()
      expect(result.protein_g).toBeNull()
    })
  })
})

// ─── calculateForRecipe ───────────────────────────────────────────────────────

describe('NutritionCalculator.calculateForRecipe', () => {
  const baseIngredients = [RI_CHICKEN_200G, RI_RICE_150G, RI_OIL_10G]

  it('divide por servings_min de la receta por defecto', () => {
    // servings_min = 2
    const total = NutritionCalculator.calculateForIngredientList(
      baseIngredients.map((ri) => ({
        ingredient: ri.ingredient,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const result = NutritionCalculator.calculateForRecipe(
      RECIPE_CHICKEN_RICE,
      baseIngredients,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expectNutrition(result, {
      calories_kcal: (total.calories_kcal as number) / 2,
      protein_g: (total.protein_g as number) / 2,
    })
  })

  it('divide por servings explícito', () => {
    const total = NutritionCalculator.calculateForIngredientList(
      baseIngredients.map((ri) => ({
        ingredient: ri.ingredient,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const result4 = NutritionCalculator.calculateForRecipe(
      RECIPE_CHICKEN_RICE,
      baseIngredients,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
      4,
    )
    expectNutrition(result4, {
      calories_kcal: (total.calories_kcal as number) / 4,
    })
  })

  it('retorna EMPTY_NUTRITION si servings ≤ 0', () => {
    const result = NutritionCalculator.calculateForRecipe(
      { ...RECIPE_CHICKEN_RICE, servings_min: 0 },
      baseIngredients,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(result).toEqual(EMPTY_NUTRITION)
  })

  it('receta sin ingredientes devuelve EMPTY_NUTRITION', () => {
    const result = NutritionCalculator.calculateForRecipe(
      RECIPE_CHICKEN_RICE,
      [],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(result).toEqual(EMPTY_NUTRITION)
  })
})

// ─── calculateForVariation ────────────────────────────────────────────────────

describe('NutritionCalculator.calculateForVariation', () => {
  const baseIngredients = [RI_CHICKEN_200G, RI_RICE_150G]

  it('override REMOVE elimina el ingrediente del cálculo', () => {
    const variation = makeVariation([makeOverrideRemove(INGREDIENT_CHICKEN.id)])
    const result = NutritionCalculator.calculateForVariation(
      RECIPE_CHICKEN_RICE,
      variation,
      baseIngredients,
      [INGREDIENT_CHICKEN, INGREDIENT_RICE],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // Solo arroz 150g / 2 raciones = 75g
    expectNutrition(result, { calories_kcal: (130 * 1.5) / 2 }) // 150g arroz = 195kcal / 2 = 97.5
  })

  it('override ADD agrega el ingrediente al cálculo', () => {
    const variation = makeVariation([
      makeOverrideAdd(INGREDIENT_OIL, UNIT_G, 20),
    ])
    const baseTotal = NutritionCalculator.calculateForIngredientList(
      baseIngredients.map((ri) => ({
        ingredient: ri.ingredient,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const result = NutritionCalculator.calculateForVariation(
      RECIPE_CHICKEN_RICE,
      variation,
      baseIngredients,
      [INGREDIENT_CHICKEN, INGREDIENT_RICE, INGREDIENT_OIL],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // (base + 20g aceite) / 2 raciones
    const oilContrib = (884 * 20) / 100 // 176.8 kcal
    expectNutrition(result, {
      calories_kcal: ((baseTotal.calories_kcal as number) + oilContrib) / 2,
    })
  })

  it('override REPLACE sustituye el ingrediente en el cálculo', () => {
    // Reemplaza pollo por arroz (150g extra)
    const variation = makeVariation([
      makeOverrideReplace(INGREDIENT_CHICKEN.id, INGREDIENT_RICE, UNIT_G, 100),
    ])
    const result = NutritionCalculator.calculateForVariation(
      RECIPE_CHICKEN_RICE,
      variation,
      baseIngredients,
      [INGREDIENT_CHICKEN, INGREDIENT_RICE],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // Pollo (200g) → Arroz (100g adicional) + Arroz (150g base) = 250g arroz total / 2
    expectNutrition(result, {
      calories_kcal: (130 * 2.5) / 2, // 250g arroz = 325 kcal / 2 = 162.5
    })
  })

  it('override ADJUST_QUANTITY cambia la cantidad del mismo ingrediente', () => {
    // Pollo 200g → 300g (+50% proteína), arroz sin cambios
    const variation = makeVariation([
      makeOverrideAdjustQuantity(INGREDIENT_CHICKEN.id, UNIT_G, 300),
    ])
    const result = NutritionCalculator.calculateForVariation(
      RECIPE_CHICKEN_RICE,
      variation,
      baseIngredients,
      [INGREDIENT_CHICKEN, INGREDIENT_RICE],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // Pollo 300g (495 kcal) + arroz 150g (195 kcal) = 690 / 2 raciones = 345
    expectNutrition(result, { calories_kcal: 345 })
  })

  it('override ADJUST_QUANTITY con unidad inexistente es ignorado graciosamente', () => {
    const variation = makeVariation([
      {
        ...makeOverrideAdjustQuantity(INGREDIENT_CHICKEN.id, UNIT_G, 300),
        new_unit_id: 'unit-inexistente',
      },
    ])
    const result = NutritionCalculator.calculateForVariation(
      RECIPE_CHICKEN_RICE,
      variation,
      baseIngredients,
      [INGREDIENT_CHICKEN, INGREDIENT_RICE],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    // Sin cambios: pollo 200g (330kcal) + arroz 150g (195kcal) = 525 / 2 = 262.5
    expectNutrition(result, { calories_kcal: 262.5 })
  })

  it('variación usa servings_min propio si está definido', () => {
    const variation = makeVariation([])
    const varWith3 = { ...variation, servings_min: 3 }
    const total = NutritionCalculator.calculateForIngredientList(
      baseIngredients.map((ri) => ({
        ingredient: ri.ingredient,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const result = NutritionCalculator.calculateForVariation(
      RECIPE_CHICKEN_RICE,
      varWith3,
      baseIngredients,
      [INGREDIENT_CHICKEN, INGREDIENT_RICE],
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expectNutrition(result, {
      calories_kcal: (total.calories_kcal as number) / 3,
    })
  })

  it('variación con overrides sobre ingrediente no existente es ignorada graciosamente', () => {
    const variation = makeVariation([makeOverrideRemove('ing-inexistente')])
    expect(() =>
      NutritionCalculator.calculateForVariation(
        RECIPE_CHICKEN_RICE,
        variation,
        baseIngredients,
        [INGREDIENT_CHICKEN, INGREDIENT_RICE],
        ALL_UNITS,
        GLOBAL_CONVERSIONS,
      ),
    ).not.toThrow()
  })

  it('override ADD con ingrediente no en allIngredients es ignorado', () => {
    const variation = makeVariation([
      makeOverrideAdd(INGREDIENT_OIL, UNIT_G, 20),
    ])
    // allIngredients no incluye INGREDIENT_OIL
    const result = NutritionCalculator.calculateForVariation(
      RECIPE_CHICKEN_RICE,
      variation,
      baseIngredients,
      [INGREDIENT_CHICKEN, INGREDIENT_RICE], // OIL no está aquí
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    const baseResult = NutritionCalculator.calculateForRecipe(
      RECIPE_CHICKEN_RICE,
      baseIngredients,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expectNutrition(result, {
      calories_kcal: baseResult.calories_kcal as number,
    })
  })
})

// ─── Invariantes nutricionales ────────────────────────────────────────────────

describe('NutritionCalculator - invariantes de datos', () => {
  it('EMPTY_NUTRITION tiene todos los campos null', () => {
    expect(EMPTY_NUTRITION.calories_kcal).toBeNull()
    expect(EMPTY_NUTRITION.protein_g).toBeNull()
    expect(EMPTY_NUTRITION.carbs_g).toBeNull()
    expect(EMPTY_NUTRITION.sugar_g).toBeNull()
    expect(EMPTY_NUTRITION.fiber_g).toBeNull()
    expect(EMPTY_NUTRITION.fat_g).toBeNull()
    expect(EMPTY_NUTRITION.saturated_fat_g).toBeNull()
    expect(EMPTY_NUTRITION.sodium_mg).toBeNull()
  })

  it('resultado nutricional tiene todos los campos definidos', () => {
    const items: NutritionItem[] = [
      { ingredient: INGREDIENT_CHICKEN, quantity: 100, unit: UNIT_G },
    ]
    const result = NutritionCalculator.calculateForIngredientList(
      items,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    expect(result).toHaveProperty('calories_kcal')
    expect(result).toHaveProperty('protein_g')
    expect(result).toHaveProperty('carbs_g')
    expect(result).toHaveProperty('sugar_g')
    expect(result).toHaveProperty('fiber_g')
    expect(result).toHaveProperty('fat_g')
    expect(result).toHaveProperty('saturated_fat_g')
    expect(result).toHaveProperty('sodium_mg')
  })

  it('valores calculados son siempre no negativos para datos válidos', () => {
    const items: NutritionItem[] = [
      { ingredient: INGREDIENT_CHICKEN, quantity: 100, unit: UNIT_G },
      { ingredient: INGREDIENT_RICE, quantity: 150, unit: UNIT_G },
    ]
    const result = NutritionCalculator.calculateForIngredientList(
      items,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
    )
    for (const key of Object.keys(result) as (keyof typeof result)[]) {
      const val = result[key]
      if (val !== null) expect(val).toBeGreaterThanOrEqual(0)
    }
  })
})
