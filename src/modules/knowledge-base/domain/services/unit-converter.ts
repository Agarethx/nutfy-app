import type { Unit, UnitConversion, UnitType } from '../shared.types'
import type { Ingredient, IngredientUnitConversion } from '../ingredient.types'
import type { Result } from '@/shared/networking'
import { ok, err } from '@/shared/networking'
import { BusinessRuleError } from '@/shared/types'

// ─── UnitConverter ────────────────────────────────────────────────────────────
// Resuelve conversiones entre unidades. Puro — no accede a la base de datos.
// ADR-015: Exportable para uso en otros módulos (ej. Inventory, MealPlanner).
//
// Árbol de decisión:
//   WEIGHT↔WEIGHT, VOLUME↔VOLUME → UnitConversion global
//   PIECE→WEIGHT                  → IngredientUnitConversion (grams_per_unit)
//   VOLUME→WEIGHT                 → IngredientUnitConversion directa, o ml × density
//   Otros                         → Error

type ConversionContext = {
  globalConversions: UnitConversion[]
  ingredient?: Ingredient & { unit_conversions?: IngredientUnitConversion[] }
}

function findGlobalConversion(
  conversions: UnitConversion[],
  fromId: string,
  toId: string,
): number | null {
  const direct = conversions.find((c) => c.from_unit === fromId && c.to_unit === toId)
  if (direct) return direct.factor

  // Conversión inversa
  const inverse = conversions.find((c) => c.from_unit === toId && c.to_unit === fromId)
  if (inverse) return 1 / inverse.factor

  return null
}

function findIngredientConversion(
  conversions: IngredientUnitConversion[],
  fromUnitId: string,
  toUnitId: string,
): number | null {
  const direct = conversions.find(
    (c) => c.from_unit_id === fromUnitId && c.to_unit_id === toUnitId,
  )
  if (direct) return direct.factor

  const inverse = conversions.find(
    (c) => c.from_unit_id === toUnitId && c.to_unit_id === fromUnitId,
  )
  if (inverse) return 1 / inverse.factor

  return null
}

// Convierte quantity de fromUnit a la unidad base del mismo tipo (g para WEIGHT, ml para VOLUME)
function toBaseUnit(quantity: number, unit: Unit, allUnits: Unit[]): number | null {
  if (unit.base_unit_id === null) return quantity // Ya es unidad base
  if (unit.to_base_factor === null) return null
  return quantity * unit.to_base_factor
}

export const UnitConverter = {
  // Convierte una cantidad entre dos unidades.
  // ingredient es necesario para conversiones PIECE↔WEIGHT y VOLUME↔WEIGHT.
  convert(
    quantity: number,
    fromUnit: Unit,
    toUnit: Unit,
    allUnits: Unit[],
    globalConversions: UnitConversion[],
    ingredient?: Ingredient & { unit_conversions?: IngredientUnitConversion[] },
  ): Result<number> {
    if (fromUnit.id === toUnit.id) return ok(quantity)

    const sameType = fromUnit.unit_type === toUnit.unit_type

    if (sameType && (fromUnit.unit_type === 'WEIGHT' || fromUnit.unit_type === 'VOLUME')) {
      // Buscar conversión global directa
      const factor = findGlobalConversion(globalConversions, fromUnit.id, toUnit.id)
      if (factor !== null) return ok(quantity * factor)

      // Convertir via unidades base
      const inBase = toBaseUnit(quantity, fromUnit, allUnits)
      if (inBase === null) {
        return err(new BusinessRuleError('INVALID_UNIT_CONVERSION', `Cannot convert ${fromUnit.abbreviation} to base unit`))
      }
      // Convertir desde base a toUnit
      if (toUnit.base_unit_id === null) return ok(inBase) // toUnit es la base
      if (toUnit.to_base_factor === null) {
        return err(new BusinessRuleError('INVALID_UNIT_CONVERSION', `Unit ${toUnit.abbreviation} has no conversion factor`))
      }
      return ok(inBase / toUnit.to_base_factor)
    }

    // Conversiones entre tipos distintos requieren datos del ingrediente
    if (!ingredient?.unit_conversions?.length) {
      return err(new BusinessRuleError('UNIT_CONVERSION_UNAVAILABLE', `Cross-type conversion requires ingredient data (${fromUnit.abbreviation}→${toUnit.abbreviation})`))
    }

    const factor = findIngredientConversion(
      ingredient.unit_conversions,
      fromUnit.id,
      toUnit.id,
    )
    if (factor !== null) return ok(quantity * factor)

    return err(new BusinessRuleError('UNIT_CONVERSION_UNAVAILABLE', `No conversion found: ${fromUnit.abbreviation}→${toUnit.abbreviation} for ingredient ${ingredient.slug}`))
  },

  // Devuelve true si la conversión es posible con los datos disponibles.
  canConvert(
    fromUnit: Unit,
    toUnit: Unit,
    globalConversions: UnitConversion[],
    ingredient?: Ingredient & { unit_conversions?: IngredientUnitConversion[] },
  ): boolean {
    if (fromUnit.id === toUnit.id) return true

    const sameType = fromUnit.unit_type === toUnit.unit_type
    if (sameType && (fromUnit.unit_type === 'WEIGHT' || fromUnit.unit_type === 'VOLUME')) {
      // Siempre podemos convertir dentro del mismo tipo usando las unidades base
      return true
    }

    if (!ingredient?.unit_conversions?.length) return false
    return findIngredientConversion(ingredient.unit_conversions, fromUnit.id, toUnit.id) !== null
  },

  // Convierte a gramos. Caso más frecuente para NutritionCalculator.
  toGrams(
    quantity: number,
    unit: Unit,
    allUnits: Unit[],
    globalConversions: UnitConversion[],
    ingredient?: Ingredient & { unit_conversions?: IngredientUnitConversion[] },
  ): Result<number> {
    const gramUnit = allUnits.find((u) => u.abbreviation === 'g')
    if (!gramUnit) {
      return err(new BusinessRuleError('INVALID_UNIT_CONVERSION', 'Gram unit not found in catalog'))
    }

    if (unit.unit_type === 'WEIGHT') {
      // Convertir al gramo vía unidad base
      if (unit.abbreviation === 'g') return ok(quantity)
      const inBase = toBaseUnit(quantity, unit, allUnits)
      if (inBase === null) {
        return err(new BusinessRuleError('INVALID_UNIT_CONVERSION', `Cannot convert ${unit.abbreviation} to grams`))
      }
      // Si la base es g ya tenemos el resultado; si la base es otra convertir
      const baseUnit = allUnits.find((u) => u.id === unit.base_unit_id)
      if (!baseUnit || baseUnit.abbreviation === 'g') return ok(inBase)
      return UnitConverter.convert(inBase, baseUnit, gramUnit, allUnits, globalConversions)
    }

    // VOLUME, PIECE o CUSTOM — necesitan datos del ingrediente
    return UnitConverter.convert(quantity, unit, gramUnit, allUnits, globalConversions, ingredient)
  },
}
