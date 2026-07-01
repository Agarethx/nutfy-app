import { IngredientTextParser } from '../domain/services/ingredient-text-parser'

// ─── Cantidad ───────────────────────────────────────────────────────────────

describe('IngredientTextParser.parse — cantidad', () => {
  it('entero simple', () => {
    expect(IngredientTextParser.parse('2 tomates').quantity).toBe(2)
  })

  it('decimal con punto', () => {
    expect(IngredientTextParser.parse('1.5 kg de pollo').quantity).toBe(1.5)
  })

  it('decimal con coma (convención española)', () => {
    expect(IngredientTextParser.parse('1,5 kg de pollo').quantity).toBe(1.5)
  })

  it('fracción simple', () => {
    expect(IngredientTextParser.parse('1/2 taza de leche').quantity).toBe(0.5)
  })

  it('número mixto (entero + fracción)', () => {
    expect(IngredientTextParser.parse('1 1/2 tazas de harina').quantity).toBe(
      1.5,
    )
  })

  it('fracción vulgar unicode sola', () => {
    expect(IngredientTextParser.parse('½ cebolla').quantity).toBe(0.5)
  })

  it('dígito pegado a fracción vulgar unicode', () => {
    expect(IngredientTextParser.parse('1½ tazas de arroz').quantity).toBe(1.5)
  })

  it('rango simple usa el promedio', () => {
    expect(IngredientTextParser.parse('2-3 tomates').quantity).toBe(2.5)
  })

  it('artículo indefinido "un" cuenta como 1', () => {
    expect(IngredientTextParser.parse('un diente de ajo').quantity).toBe(1)
  })

  it('artículo indefinido "una" cuenta como 1', () => {
    expect(IngredientTextParser.parse('una cebolla picada').quantity).toBe(1)
  })

  it('sin cantidad explícita devuelve null', () => {
    expect(IngredientTextParser.parse('sal al gusto').quantity).toBeNull()
  })
})

// ─── Unidad ─────────────────────────────────────────────────────────────────

describe('IngredientTextParser.parse — unidad', () => {
  it.each([
    ['2 g de sal', 'g'],
    ['2 gr de sal', 'g'],
    ['2 gramos de sal', 'g'],
    ['1 kg de carne', 'kg'],
    ['1 kilo de carne', 'kg'],
    ['5 mg de levadura', 'mg'],
    ['200 ml de agua', 'ml'],
    ['1 l de leche', 'l'],
    ['1 litro de leche', 'l'],
    ['2 cda de aceite', 'cda'],
    ['2 cucharadas de aceite', 'cda'],
    ['1 cdta de sal', 'cdta'],
    ['1 cucharadita de sal', 'cdta'],
    ['2 tazas de arroz', 'taza'],
    ['3 dientes de ajo', 'diente'],
    ['2 hojas de laurel', 'hoja'],
    ['1 pizca de sal', 'pizca'],
    ['2 rebanadas de pan', 'reb'],
    ['3 unidades de huevo', 'ud'],
    ['2 lb de papas', 'lb'],
    ['2 libras de papas', 'lb'],
    ['4 oz de queso', 'oz'],
  ])('detecta "%s" → unidad "%s"', (input, expected) => {
    expect(IngredientTextParser.parse(input).unit).toBe(expected)
  })

  it('sin unidad reconocida devuelve null', () => {
    expect(IngredientTextParser.parse('2 tomates').unit).toBeNull()
  })

  it('quita el conector "de" tras la unidad', () => {
    expect(IngredientTextParser.parse('2 tazas de arroz').cleanedName).toBe(
      'arroz',
    )
  })
})

// ─── Preparación ──────────────────────────────────────────────────────────────

describe('IngredientTextParser.parse — preparación', () => {
  it.each([
    ['2 tomates picados', 'picado'],
    ['1 zanahoria rallada', 'rallado'],
    ['2 huevos cocidos', 'cocido'],
    ['2 papas hervidas', 'hervido'],
    ['1 cebolla en cubos', 'en cubos'],
    ['2 zanahorias troceadas', 'troceado'],
    ['1 pepino en rodajas', 'en rodajas'],
    ['1 pimiento en juliana', 'en juliana'],
    ['2 dientes de ajo machacados', 'machacado'],
    ['1 taza de tomate triturado', 'triturado'],
    ['1 cdta de pimienta molida', 'molido'],
    ['200 g de pollo asado', 'asado'],
    ['2 huevos fritos', 'frito'],
    ['1 plátano pelado', 'pelado'],
    ['1 pechuga sin piel', 'sin piel'],
    ['1 pimiento sin semillas', 'sin semillas'],
    ['200 g de espinaca congelada', 'congelado'],
    ['sal al gusto', 'al gusto'],
    ['1 cebolla finamente picada', 'picado'],
  ])('detecta "%s" → preparación "%s"', (input, expected) => {
    expect(IngredientTextParser.parse(input).preparation).toBe(expected)
  })

  it('sin preparación devuelve null', () => {
    expect(IngredientTextParser.parse('2 tomates').preparation).toBeNull()
  })

  it('elimina la frase de preparación del nombre limpio', () => {
    const result = IngredientTextParser.parse('2 tomates picados')
    expect(result.cleanedName).toBe('tomate')
  })

  it('prioriza la frase más específica ("finamente picado" sobre "picado")', () => {
    const result = IngredientTextParser.parse('1 cebolla finamente picada')
    expect(result.preparation).toBe('picado')
    expect(result.cleanedName).toBe('cebolla')
  })
})

// ─── Limpieza: adjetivos y marcas ──────────────────────────────────────────────

describe('IngredientTextParser.parse — adjetivos y marcas', () => {
  it('elimina adjetivos de tamaño', () => {
    expect(IngredientTextParser.parse('2 tomates grandes').cleanedName).toBe(
      'tomate',
    )
  })

  it('elimina adjetivo "fresco"', () => {
    expect(
      IngredientTextParser.parse('200 g de albahaca fresca').cleanedName,
    ).toBe('albahaca')
  })

  it('mantiene colores (cambian la identidad del ingrediente)', () => {
    expect(IngredientTextParser.parse('1 pimiento rojo').cleanedName).toBe(
      'pimiento rojo',
    )
  })

  it('elimina una marca conocida', () => {
    expect(
      IngredientTextParser.parse('1 cda de mayonesa Hellmanns').cleanedName,
    ).toBe('mayonesa')
  })

  it('combina adjetivo + marca + preparación', () => {
    const result = IngredientTextParser.parse('2 tomates Knorr grandes picados')
    expect(result.cleanedName).toBe('tomate')
    expect(result.preparation).toBe('picado')
  })
})

// ─── Singularización ────────────────────────────────────────────────────────

describe('IngredientTextParser.parse — singular/plural', () => {
  it('plural terminado en vocal+s se singulariza', () => {
    expect(IngredientTextParser.parse('2 tomates').cleanedName).toBe('tomate')
    expect(IngredientTextParser.parse('3 papas').cleanedName).toBe('papa')
    expect(IngredientTextParser.parse('2 cebollas').cleanedName).toBe('cebolla')
    expect(IngredientTextParser.parse('4 huevos').cleanedName).toBe('huevo')
  })

  it('plural terminado en -ces se convierte a -z', () => {
    expect(IngredientTextParser.parse('200 g de nueces').cleanedName).toBe(
      'nuez',
    )
  })

  it('plural en "-es" con singular terminado en consonante n/l se singulariza', () => {
    expect(IngredientTextParser.parse('2 limones').cleanedName).toBe('limon')
    expect(IngredientTextParser.parse('200 g de frijoles').cleanedName).toBe(
      'frijol',
    )
    expect(IngredientTextParser.parse('2 panes').cleanedName).toBe('pan')
  })

  it('plural en "-es" cuyo singular ya termina en vocal solo pierde la "s"', () => {
    expect(IngredientTextParser.parse('2 tomates').cleanedName).toBe('tomate')
    expect(IngredientTextParser.parse('200 g de aceites').cleanedName).toBe(
      'aceite',
    )
  })

  it('palabras de 3 caracteres o menos no se tocan', () => {
    expect(IngredientTextParser.parse('1 diente de ajo').cleanedName).toBe(
      'ajo',
    )
  })

  it('singulariza cada palabra de un nombre compuesto', () => {
    expect(IngredientTextParser.parse('2 pimientos rojos').cleanedName).toBe(
      'pimiento rojo',
    )
  })
})

// ─── Integración: ejemplo del enunciado ────────────────────────────────────────

describe('IngredientTextParser.parse — caso integral', () => {
  it('"2 tomates grandes" → cantidad 2, sin unidad, sin preparación, nombre "tomate"', () => {
    const result = IngredientTextParser.parse('2 tomates grandes')
    expect(result).toEqual({
      originalText: '2 tomates grandes',
      quantity: 2,
      unit: null,
      preparation: null,
      cleanedName: 'tomate',
    })
  })

  it('caso completo: cantidad + unidad + marca + adjetivo + preparación', () => {
    const result = IngredientTextParser.parse(
      '1.5 kg de tomates Knorr grandes picados',
    )
    expect(result.quantity).toBe(1.5)
    expect(result.unit).toBe('kg')
    expect(result.preparation).toBe('picado')
    expect(result.cleanedName).toBe('tomate')
  })

  it('preserva el texto original sin modificar', () => {
    const result = IngredientTextParser.parse('  2  Tomates GRANDES  ')
    expect(result.originalText).toBe('  2  Tomates GRANDES  ')
  })

  it('es insensible a mayúsculas/minúsculas', () => {
    expect(IngredientTextParser.parse('2 TOMATES GRANDES').cleanedName).toBe(
      'tomate',
    )
  })
})
