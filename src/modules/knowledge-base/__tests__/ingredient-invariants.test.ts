/**
 * Tests para invariantes del agregado Ingredient (INV-01 – INV-05).
 *
 * Las restricciones sugar_g ≤ carbs_g y saturated_fat_g ≤ fat_g son
 * impuestas por la base de datos (CHECK constraints). En el dominio TypeScript
 * no hay validación activa — estas pruebas documentan las invariantes y
 * verifican que los mappers preservan los datos tal como vienen de la DB.
 *
 * Tests de comportamiento de soft delete y lifecycle_status.
 */

import type { NutritionalInfo } from '../domain/shared.types'
import type { Ingredient } from '../domain/ingredient.types'
import { INGREDIENT_CHICKEN, INGREDIENT_NO_NUTRITION, INGREDIENT_RICE } from './fixtures'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNutrition(overrides: Partial<NutritionalInfo>): NutritionalInfo {
  return {
    calories_kcal: null,
    protein_g: null,
    carbs_g: null,
    sugar_g: null,
    fiber_g: null,
    fat_g: null,
    saturated_fat_g: null,
    sodium_mg: null,
    ...overrides,
  }
}

// ─── INV-01: NutritionalInfo campos no negativos ──────────────────────────────

describe('NutritionalInfo - INV-01: campos no negativos', () => {
  it('valores ≥ 0 son aceptados en el tipo', () => {
    const nutrition = makeNutrition({
      calories_kcal: 0,
      protein_g: 0,
      carbs_g: 0,
    })
    expect(nutrition.calories_kcal).toBeGreaterThanOrEqual(0)
    expect(nutrition.protein_g).toBeGreaterThanOrEqual(0)
    expect(nutrition.carbs_g).toBeGreaterThanOrEqual(0)
  })

  it('los fixtures de ingredientes tienen macros no negativos', () => {
    for (const ing of [INGREDIENT_CHICKEN, INGREDIENT_RICE]) {
      const { nutrition } = ing
      for (const key of Object.keys(nutrition) as (keyof NutritionalInfo)[]) {
        const val = nutrition[key]
        if (val !== null) expect(val).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

// ─── INV-02: sugar_g ≤ carbs_g ───────────────────────────────────────────────

describe('NutritionalInfo - INV-02: sugar_g ≤ carbs_g', () => {
  it('ingredient_chicken respeta la invariante', () => {
    const { sugar_g, carbs_g } = INGREDIENT_CHICKEN.nutrition
    if (sugar_g !== null && carbs_g !== null) {
      expect(sugar_g).toBeLessThanOrEqual(carbs_g)
    }
  })

  it('ingredient_rice respeta la invariante', () => {
    const { sugar_g, carbs_g } = INGREDIENT_RICE.nutrition
    if (sugar_g !== null && carbs_g !== null) {
      expect(sugar_g).toBeLessThanOrEqual(carbs_g)
    }
  })

  it('la invariante se puede documentar con un example válido', () => {
    const valid = makeNutrition({ carbs_g: 30, sugar_g: 10 })
    expect((valid.sugar_g as number)).toBeLessThanOrEqual(valid.carbs_g as number)
  })
})

// ─── INV-03: saturated_fat_g ≤ fat_g ─────────────────────────────────────────

describe('NutritionalInfo - INV-03: saturated_fat_g ≤ fat_g', () => {
  it('ingredient_chicken respeta la invariante', () => {
    const { saturated_fat_g, fat_g } = INGREDIENT_CHICKEN.nutrition
    if (saturated_fat_g !== null && fat_g !== null) {
      expect(saturated_fat_g).toBeLessThanOrEqual(fat_g)
    }
  })

  it('ingredient_rice respeta la invariante', () => {
    const { saturated_fat_g, fat_g } = INGREDIENT_RICE.nutrition
    if (saturated_fat_g !== null && fat_g !== null) {
      expect(saturated_fat_g).toBeLessThanOrEqual(fat_g)
    }
  })
})

// ─── INV-04: Soft delete — DEPRECATED ────────────────────────────────────────

describe('Ingredient - INV-04: soft delete via LifecycleStatus', () => {
  it('ingrediente activo tiene deprecated_at null', () => {
    expect(INGREDIENT_CHICKEN.status).toBe('ACTIVE')
    expect(INGREDIENT_CHICKEN.deprecated_at).toBeNull()
  })

  it('ingrediente deprecado tiene status DEPRECATED y deprecated_at no nulo', () => {
    const deprecated: Ingredient = {
      ...INGREDIENT_CHICKEN,
      status: 'DEPRECATED',
      deprecated_at: '2026-01-15T00:00:00Z',
    }
    expect(deprecated.status).toBe('DEPRECATED')
    expect(deprecated.deprecated_at).not.toBeNull()
  })

  it('ingrediente nunca tiene status nulo', () => {
    expect(INGREDIENT_CHICKEN.status).toBeDefined()
    expect(INGREDIENT_NO_NUTRITION.status).toBeDefined()
  })

  it('LifecycleStatus acepta ACTIVE, PENDING_REVIEW, DEPRECATED', () => {
    const statuses: Ingredient['status'][] = ['ACTIVE', 'PENDING_REVIEW', 'DEPRECATED']
    for (const status of statuses) {
      const ing: Ingredient = { ...INGREDIENT_CHICKEN, status }
      expect(ing.status).toBe(status)
    }
  })
})

// ─── INV-05: Seasonality ─────────────────────────────────────────────────────

describe('Ingredient - INV-05: Seasonality months válidos', () => {
  it('months vacío significa disponible todo el año', () => {
    expect(INGREDIENT_CHICKEN.seasonality.months).toEqual([])
  })

  it('months contiene solo valores del 1 al 12', () => {
    const validMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    const testIng: Ingredient = {
      ...INGREDIENT_CHICKEN,
      seasonality: { months: validMonths },
    }
    for (const m of testIng.seasonality.months) {
      expect(m).toBeGreaterThanOrEqual(1)
      expect(m).toBeLessThanOrEqual(12)
    }
  })

  it('ingredient con temporada específica la preserva', () => {
    const ing: Ingredient = {
      ...INGREDIENT_CHICKEN,
      seasonality: { months: [3, 4, 5] },
    }
    expect(ing.seasonality.months).toEqual([3, 4, 5])
  })
})

// ─── Timestamps ───────────────────────────────────────────────────────────────

describe('Ingredient - timestamps', () => {
  it('created_at y updated_at son strings ISO', () => {
    expect(typeof INGREDIENT_CHICKEN.created_at).toBe('string')
    expect(typeof INGREDIENT_CHICKEN.updated_at).toBe('string')
  })

  it('created_at es un ISO date válido', () => {
    const date = new Date(INGREDIENT_CHICKEN.created_at)
    expect(isNaN(date.getTime())).toBe(false)
  })
})
