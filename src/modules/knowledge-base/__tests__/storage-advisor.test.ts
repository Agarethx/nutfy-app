import { StorageAdvisor } from '../domain/services/storage-advisor'
import {
  STORAGE_RULE_FRIDGE_3DAYS,
  STORAGE_RULE_FREEZER_3MONTHS,
  STORAGE_RULE_PANTRY_2WEEKS,
  STORAGE_RULE_NO_FREEZE,
  INGREDIENT_SEASONAL,
  INGREDIENT_ALLSEASON,
  INGREDIENT_CHICKEN,
} from './fixtures'
import type { IngredientStorageRule } from '../domain/ingredient.types'
import type { RecipeStorageRule } from '../domain/recipe.types'
import { STORAGE_FRIDGE, STORAGE_FREEZER } from './fixtures'

// ─── getStorageRulesForIngredient ─────────────────────────────────────────────

describe('StorageAdvisor.getStorageRulesForIngredient', () => {
  it('lista vacía devuelve array vacío', () => {
    expect(StorageAdvisor.getStorageRulesForIngredient([])).toEqual([])
  })

  it('ordena reglas de mayor a menor duración', () => {
    const rules = [STORAGE_RULE_FRIDGE_3DAYS, STORAGE_RULE_FREEZER_3MONTHS, STORAGE_RULE_PANTRY_2WEEKS]
    const sorted = StorageAdvisor.getStorageRulesForIngredient(rules)
    // Freezer 3 meses (90 días) > Pantry 2 semanas (14 días) > Fridge 3 días
    expect(sorted[0].id).toBe(STORAGE_RULE_FREEZER_3MONTHS.id)
    expect(sorted[1].id).toBe(STORAGE_RULE_PANTRY_2WEEKS.id)
    expect(sorted[2].id).toBe(STORAGE_RULE_FRIDGE_3DAYS.id)
  })

  it('no muta el array original', () => {
    const rules = [STORAGE_RULE_FRIDGE_3DAYS, STORAGE_RULE_FREEZER_3MONTHS]
    const original = [...rules]
    StorageAdvisor.getStorageRulesForIngredient(rules)
    expect(rules).toEqual(original)
  })

  it('ordena correctamente distintas unidades de duración', () => {
    const days5: IngredientStorageRule = { ...STORAGE_RULE_FRIDGE_3DAYS, id: 'd5', max_duration: 5, duration_unit: 'DAYS' }
    const weeks1: IngredientStorageRule = { ...STORAGE_RULE_PANTRY_2WEEKS, id: 'w1', max_duration: 1, duration_unit: 'WEEKS' }
    const months1: IngredientStorageRule = { ...STORAGE_RULE_FREEZER_3MONTHS, id: 'm1', max_duration: 1, duration_unit: 'MONTHS' }

    const sorted = StorageAdvisor.getStorageRulesForIngredient([days5, weeks1, months1])
    // MONTHS (30d) > WEEKS (7d) > DAYS (5d)
    expect(sorted[0].id).toBe('m1')
    expect(sorted[1].id).toBe('w1')
    expect(sorted[2].id).toBe('d5')
  })

  it('regla única devuelve array de un elemento', () => {
    const sorted = StorageAdvisor.getStorageRulesForIngredient([STORAGE_RULE_FRIDGE_3DAYS])
    expect(sorted).toHaveLength(1)
    expect(sorted[0].id).toBe(STORAGE_RULE_FRIDGE_3DAYS.id)
  })
})

// ─── getBestStorageMethod ─────────────────────────────────────────────────────

describe('StorageAdvisor.getBestStorageMethod', () => {
  it('retorna null para lista vacía', () => {
    expect(StorageAdvisor.getBestStorageMethod([])).toBeNull()
  })

  it('retorna la regla con mayor duración', () => {
    const rules = [STORAGE_RULE_FRIDGE_3DAYS, STORAGE_RULE_FREEZER_3MONTHS, STORAGE_RULE_PANTRY_2WEEKS]
    const best = StorageAdvisor.getBestStorageMethod(rules)
    expect(best?.id).toBe(STORAGE_RULE_FREEZER_3MONTHS.id)
  })

  it('retorna la única regla si solo hay una', () => {
    const best = StorageAdvisor.getBestStorageMethod([STORAGE_RULE_FRIDGE_3DAYS])
    expect(best?.id).toBe(STORAGE_RULE_FRIDGE_3DAYS.id)
  })
})

// ─── getStorageRuleForMethod ──────────────────────────────────────────────────

describe('StorageAdvisor.getStorageRuleForMethod', () => {
  const rules = [STORAGE_RULE_FRIDGE_3DAYS, STORAGE_RULE_FREEZER_3MONTHS]

  it('devuelve la regla para el método solicitado', () => {
    const rule = StorageAdvisor.getStorageRuleForMethod(rules, 'FRIDGE')
    expect(rule?.id).toBe(STORAGE_RULE_FRIDGE_3DAYS.id)
  })

  it('retorna null si el método no existe en las reglas', () => {
    const rule = StorageAdvisor.getStorageRuleForMethod(rules, 'PANTRY')
    expect(rule).toBeNull()
  })

  it('retorna null para lista vacía', () => {
    expect(StorageAdvisor.getStorageRuleForMethod([], 'FRIDGE')).toBeNull()
  })
})

// ─── canFreeze ────────────────────────────────────────────────────────────────

describe('StorageAdvisor.canFreeze', () => {
  it('retorna false para lista vacía', () => {
    expect(StorageAdvisor.canFreeze([])).toBe(false)
  })

  it('retorna true si hay regla con storage_type FREEZER', () => {
    const rules = [STORAGE_RULE_FRIDGE_3DAYS, STORAGE_RULE_FREEZER_3MONTHS]
    expect(StorageAdvisor.canFreeze(rules)).toBe(true)
  })

  it('retorna true si can_freeze=true aunque no sea FREEZER', () => {
    const ruleWithFreeze: IngredientStorageRule = {
      ...STORAGE_RULE_FRIDGE_3DAYS,
      can_freeze: true,
      storage_method: STORAGE_FRIDGE,
    }
    expect(StorageAdvisor.canFreeze([ruleWithFreeze])).toBe(true)
  })

  it('retorna false si ninguna regla permite congelar', () => {
    expect(StorageAdvisor.canFreeze([STORAGE_RULE_NO_FREEZE])).toBe(false)
  })

  it('retorna false con solo reglas de nevera sin can_freeze', () => {
    expect(StorageAdvisor.canFreeze([STORAGE_RULE_FRIDGE_3DAYS])).toBe(false)
  })
})

// ─── isInSeason ───────────────────────────────────────────────────────────────

describe('StorageAdvisor.isInSeason', () => {
  it('ingrediente con months vacío está siempre en temporada', () => {
    expect(StorageAdvisor.isInSeason(INGREDIENT_ALLSEASON, 1)).toBe(true)
    expect(StorageAdvisor.isInSeason(INGREDIENT_ALLSEASON, 6)).toBe(true)
    expect(StorageAdvisor.isInSeason(INGREDIENT_ALLSEASON, 12)).toBe(true)
  })

  it('ingrediente de temporada [1,2] está en temporada en enero y febrero', () => {
    expect(StorageAdvisor.isInSeason(INGREDIENT_SEASONAL, 1)).toBe(true)
    expect(StorageAdvisor.isInSeason(INGREDIENT_SEASONAL, 2)).toBe(true)
  })

  it('ingrediente de temporada [1,2] NO está en temporada en otros meses', () => {
    expect(StorageAdvisor.isInSeason(INGREDIENT_SEASONAL, 3)).toBe(false)
    expect(StorageAdvisor.isInSeason(INGREDIENT_SEASONAL, 6)).toBe(false)
    expect(StorageAdvisor.isInSeason(INGREDIENT_SEASONAL, 12)).toBe(false)
  })

  it('usa el mes actual si no se pasa month', () => {
    const currentMonth = new Date().getMonth() + 1
    // Con months vacío siempre retorna true
    const result = StorageAdvisor.isInSeason(INGREDIENT_ALLSEASON)
    expect(result).toBe(true)

    // Con meses específicos verifica el mes actual
    const inCurrentMonth = INGREDIENT_SEASONAL.seasonality.months.includes(currentMonth)
    expect(StorageAdvisor.isInSeason(INGREDIENT_SEASONAL)).toBe(inCurrentMonth)
  })
})

// ─── getStorageRulesForRecipe ─────────────────────────────────────────────────

describe('StorageAdvisor.getStorageRulesForRecipe', () => {
  const makeRecipeRule = (id: string, max: number, unit: 'DAYS' | 'WEEKS' | 'MONTHS'): RecipeStorageRule => ({
    id,
    recipe_id: 'rec-001',
    storage_method_id: STORAGE_FRIDGE.id,
    storage_method: STORAGE_FRIDGE,
    max_duration: max,
    duration_unit: unit,
    is_recommended: false,
    can_freeze: false,
    notes: null,
  })

  it('lista vacía devuelve array vacío', () => {
    expect(StorageAdvisor.getStorageRulesForRecipe([])).toEqual([])
  })

  it('ordena reglas de mayor a menor duración', () => {
    const rules = [
      makeRecipeRule('r1', 3, 'DAYS'),
      makeRecipeRule('r2', 2, 'WEEKS'),
      makeRecipeRule('r3', 1, 'MONTHS'),
    ]
    const sorted = StorageAdvisor.getStorageRulesForRecipe(rules)
    expect(sorted[0].id).toBe('r3') // 30 días
    expect(sorted[1].id).toBe('r2') // 14 días
    expect(sorted[2].id).toBe('r1') // 3 días
  })
})
