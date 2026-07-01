import { UnitConverter } from '../domain/services/unit-converter'
import { BusinessRuleError } from '@/shared/types'
import {
  ALL_UNITS,
  GLOBAL_CONVERSIONS,
  UNIT_G,
  UNIT_KG,
  UNIT_ML,
  UNIT_L,
  UNIT_PIECE,
  INGREDIENT_CHICKEN,
  INGREDIENT_EGG_WITH_CONVERSIONS,
} from './fixtures'

// ─── convert() ────────────────────────────────────────────────────────────────

describe('UnitConverter.convert', () => {
  describe('misma unidad', () => {
    it('devuelve la misma cantidad sin conversión', () => {
      const result = UnitConverter.convert(100, UNIT_G, UNIT_G, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result).toEqual({ ok: true, data: 100 })
    })
  })

  describe('WEIGHT → WEIGHT', () => {
    it('convierte kg a g usando conversión global directa', () => {
      const result = UnitConverter.convert(1, UNIT_KG, UNIT_G, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result).toEqual({ ok: true, data: 1000 })
    })

    it('convierte g a kg usando conversión inversa', () => {
      const result = UnitConverter.convert(500, UNIT_G, UNIT_KG, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result).toEqual({ ok: true, data: 0.5 })
    })

    it('convierte usando unidad base cuando no hay conversión directa', () => {
      // 2 kg → g via to_base_factor (2 * 1000 = 2000g), luego g es la base → 2000g
      const result = UnitConverter.convert(2, UNIT_KG, UNIT_G, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBeCloseTo(2000, 5)
    })
  })

  describe('VOLUME → VOLUME', () => {
    it('convierte l a ml usando conversión global directa', () => {
      const result = UnitConverter.convert(1.5, UNIT_L, UNIT_ML, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result).toEqual({ ok: true, data: 1500 })
    })

    it('convierte ml a l usando conversión inversa', () => {
      const result = UnitConverter.convert(250, UNIT_ML, UNIT_L, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBeCloseTo(0.25, 5)
    })
  })

  describe('cross-type: PIECE → WEIGHT via ingrediente', () => {
    it('convierte pcs a g usando IngredientUnitConversion', () => {
      const result = UnitConverter.convert(
        2,
        UNIT_PIECE,
        UNIT_G,
        ALL_UNITS,
        GLOBAL_CONVERSIONS,
        INGREDIENT_EGG_WITH_CONVERSIONS,
      )
      expect(result).toEqual({ ok: true, data: 120 }) // 2 pcs × 60g/pcs
    })

    it('falla sin datos del ingrediente', () => {
      const result = UnitConverter.convert(2, UNIT_PIECE, UNIT_G, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(BusinessRuleError)
        expect((result.error as BusinessRuleError).code).toBe('UNIT_CONVERSION_UNAVAILABLE')
      }
    })

    it('falla cuando el ingrediente no tiene conversiones', () => {
      const result = UnitConverter.convert(
        2,
        UNIT_PIECE,
        UNIT_G,
        ALL_UNITS,
        GLOBAL_CONVERSIONS,
        INGREDIENT_CHICKEN,
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect((result.error as BusinessRuleError).code).toBe('UNIT_CONVERSION_UNAVAILABLE')
      }
    })

    it('convierte en dirección inversa (g → pcs)', () => {
      const result = UnitConverter.convert(
        120,
        UNIT_G,
        UNIT_PIECE,
        ALL_UNITS,
        GLOBAL_CONVERSIONS,
        INGREDIENT_EGG_WITH_CONVERSIONS,
      )
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data).toBeCloseTo(2, 5) // 120g / 60g/pcs = 2
    })
  })

  describe('cross-type sin datos de ingrediente', () => {
    it('falla al convertir VOLUME → WEIGHT sin ingrediente', () => {
      const result = UnitConverter.convert(100, UNIT_ML, UNIT_G, ALL_UNITS, GLOBAL_CONVERSIONS)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect((result.error as BusinessRuleError).code).toBe('UNIT_CONVERSION_UNAVAILABLE')
      }
    })
  })
})

// ─── canConvert() ─────────────────────────────────────────────────────────────

describe('UnitConverter.canConvert', () => {
  it('retorna true para la misma unidad', () => {
    expect(UnitConverter.canConvert(UNIT_G, UNIT_G, GLOBAL_CONVERSIONS)).toBe(true)
  })

  it('retorna true para WEIGHT → WEIGHT (siempre convertible)', () => {
    expect(UnitConverter.canConvert(UNIT_G, UNIT_KG, GLOBAL_CONVERSIONS)).toBe(true)
    expect(UnitConverter.canConvert(UNIT_KG, UNIT_G, GLOBAL_CONVERSIONS)).toBe(true)
  })

  it('retorna true para VOLUME → VOLUME (siempre convertible)', () => {
    expect(UnitConverter.canConvert(UNIT_ML, UNIT_L, GLOBAL_CONVERSIONS)).toBe(true)
  })

  it('retorna false para PIECE → WEIGHT sin ingrediente', () => {
    expect(UnitConverter.canConvert(UNIT_PIECE, UNIT_G, GLOBAL_CONVERSIONS)).toBe(false)
  })

  it('retorna true para PIECE → WEIGHT con ingrediente con conversión', () => {
    expect(
      UnitConverter.canConvert(UNIT_PIECE, UNIT_G, GLOBAL_CONVERSIONS, INGREDIENT_EGG_WITH_CONVERSIONS),
    ).toBe(true)
  })

  it('retorna false para PIECE → WEIGHT con ingrediente sin conversión relevante', () => {
    expect(
      UnitConverter.canConvert(UNIT_PIECE, UNIT_G, GLOBAL_CONVERSIONS, INGREDIENT_CHICKEN),
    ).toBe(false)
  })

  it('retorna false para VOLUME → WEIGHT sin ingrediente', () => {
    expect(UnitConverter.canConvert(UNIT_ML, UNIT_G, GLOBAL_CONVERSIONS)).toBe(false)
  })
})

// ─── toGrams() ────────────────────────────────────────────────────────────────

describe('UnitConverter.toGrams', () => {
  it('retorna cantidad directa para gramos', () => {
    const result = UnitConverter.toGrams(250, UNIT_G, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(result).toEqual({ ok: true, data: 250 })
  })

  it('convierte kg a gramos', () => {
    const result = UnitConverter.toGrams(0.5, UNIT_KG, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toBeCloseTo(500, 5)
  })

  it('falla si la unidad de gramos no existe en el catálogo', () => {
    const result = UnitConverter.toGrams(100, UNIT_G, [], GLOBAL_CONVERSIONS)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect((result.error as BusinessRuleError).code).toBe('INVALID_UNIT_CONVERSION')
    }
  })

  it('convierte PIECE a gramos con datos del ingrediente', () => {
    const result = UnitConverter.toGrams(
      3,
      UNIT_PIECE,
      ALL_UNITS,
      GLOBAL_CONVERSIONS,
      INGREDIENT_EGG_WITH_CONVERSIONS,
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toBeCloseTo(180, 5) // 3 × 60g
  })

  it('falla para PIECE sin datos del ingrediente', () => {
    const result = UnitConverter.toGrams(3, UNIT_PIECE, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(result.ok).toBe(false)
  })

  it('falla para VOLUME sin ingrediente (sin densidad)', () => {
    const result = UnitConverter.toGrams(100, UNIT_ML, ALL_UNITS, GLOBAL_CONVERSIONS)
    expect(result.ok).toBe(false)
  })
})
