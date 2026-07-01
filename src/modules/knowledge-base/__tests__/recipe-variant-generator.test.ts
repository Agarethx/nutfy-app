import {
  RecipeVariantGenerator,
  DIET_VARIANT_METADATA,
  type DietVariantType,
  type VariantIngredientContext,
} from '../domain/services/recipe-variant-generator'
import type { Allergen, Attribute, Unit } from '../domain/shared.types'
import type {
  Ingredient,
  IngredientWithDetails,
} from '../domain/ingredient.types'
import type { RecipeIngredient } from '../domain/recipe.types'
import {
  UNIT_G,
  INGREDIENT_CHICKEN,
  INGREDIENT_RICE,
  INGREDIENT_OIL,
  makeIngredient,
} from './fixtures'

// ─── Helpers locales ────────────────────────────────────────────────────────
// Los fixtures compartidos usan nombres en inglés (Chicken Breast, White
// Rice...) — útiles para probar los umbrales numéricos, pero no para las
// heurísticas de palabras clave en español, que necesitan nombres reales.

function makeAttribute(slug: string): Attribute {
  return {
    id: `attr-${slug}`,
    slug,
    name: slug,
    scope: 'BOTH',
    category: 'DIETARY',
    description: null,
    status: 'ACTIVE',
  }
}

function makeAllergen(slug: string, name = slug): Allergen {
  return {
    id: `all-${slug}`,
    slug,
    name,
    is_eu_mandatory: true,
    status: 'ACTIVE',
  }
}

function makeDetails(
  ingredient: Ingredient,
  opts: {
    attributes?: string[]
    allergens?: { slug: string; name?: string; isTrace?: boolean }[]
  } = {},
): IngredientWithDetails {
  return {
    ...ingredient,
    category: null,
    subcategory: null,
    translations: [],
    allergens: (opts.allergens ?? []).map((a) => ({
      ingredient_id: ingredient.id,
      allergen_id: `all-${a.slug}`,
      allergen: makeAllergen(a.slug, a.name),
      is_trace: a.isTrace ?? false,
    })),
    micronutrients: [],
    storage_rules: [],
    unit_conversions: [],
    attributes: (opts.attributes ?? []).map(makeAttribute),
  }
}

function makeRecipeIngredient(
  ingredient: Ingredient,
  quantity: number,
  unit: Unit = UNIT_G,
): RecipeIngredient {
  return {
    id: `ri-${ingredient.id}`,
    recipe_id: 'recipe-1',
    ingredient_id: ingredient.id,
    ingredient,
    unit_id: unit.id,
    unit,
    quantity,
    is_optional: false,
    notes: null,
  }
}

function makeContext(
  ingredient: Ingredient,
  quantity: number,
  opts: Parameters<typeof makeDetails>[1] = {},
  unit: Unit = UNIT_G,
): VariantIngredientContext {
  return {
    recipeIngredient: makeRecipeIngredient(ingredient, quantity, unit),
    details: makeDetails(ingredient, opts),
  }
}

// Ingredientes con nombres en español, para probar las heurísticas de keyword.
const HARINA_TRIGO = makeIngredient({
  id: 'ing-harina',
  name: 'Harina de trigo',
  slug: 'harina-trigo',
})
const TOMATE = makeIngredient({
  id: 'ing-tomate',
  name: 'Tomate',
  slug: 'tomate',
})
const POLLO = makeIngredient({
  id: 'ing-pollo',
  name: 'Pechuga de pollo',
  slug: 'pechuga-pollo',
  nutrition: {
    calories_kcal: 165,
    protein_g: 31,
    carbs_g: 0,
    sugar_g: 0,
    fiber_g: 0,
    fat_g: 3.6,
    saturated_fat_g: 1,
    sodium_mg: 74,
  },
})
const HUEVO = makeIngredient({ id: 'ing-huevo', name: 'Huevo', slug: 'huevo' })
const LECHE = makeIngredient({
  id: 'ing-leche',
  name: 'Leche entera',
  slug: 'leche-entera',
})
const LECHE_ALMENDRA = makeIngredient({
  id: 'ing-leche-almendra',
  name: 'Leche de almendra',
  slug: 'leche-almendra',
})
const MIEL = makeIngredient({ id: 'ing-miel', name: 'Miel', slug: 'miel' })
const MANTEQUILLA = makeIngredient({
  id: 'ing-mantequilla',
  name: 'Mantequilla',
  slug: 'mantequilla',
})
const SALSA_MISTERIOSA = makeIngredient({
  id: 'ing-salsa',
  name: 'Salsa teriyaki',
  slug: 'salsa-teriyaki',
})

// ─── Sin gluten ─────────────────────────────────────────────────────────────

describe('RecipeVariantGenerator.plan — gluten_free', () => {
  it('sustituye un ingrediente con keyword de gluten', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(HARINA_TRIGO, 200)],
      'gluten_free',
    )
    expect(plans).toEqual([
      {
        kind: 'replace',
        recipeIngredientId: 'ri-ing-harina',
        ingredientName: 'Harina de trigo',
        substituteQuery: 'harina sin gluten',
        reason: expect.stringContaining('no es compatible'),
      },
    ])
  })

  it('confía en el atributo "sin-gluten" aunque el nombre contenga "harina"', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(HARINA_TRIGO, 200, { attributes: ['sin-gluten'] })],
      'gluten_free',
    )
    expect(plans).toEqual([])
  })

  it('alérgeno "gluten" directo sin keyword conocida → elimina sin sustituto', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(SALSA_MISTERIOSA, 15, { allergens: [{ slug: 'gluten' }] })],
      'gluten_free',
    )
    expect(plans).toEqual([
      {
        kind: 'remove',
        recipeIngredientId: 'ri-ing-salsa',
        ingredientName: 'Salsa teriyaki',
        reason: expect.stringContaining(
          'No se encontró un sustituto automático',
        ),
      },
    ])
  })

  it('alérgeno "gluten" solo en traza NO cuenta como violación', () => {
    const plans = RecipeVariantGenerator.plan(
      [
        makeContext(SALSA_MISTERIOSA, 15, {
          allergens: [{ slug: 'gluten', isTrace: true }],
        }),
      ],
      'gluten_free',
    )
    expect(plans).toEqual([])
  })

  it('ingrediente compatible no genera cambios', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(TOMATE, 100)],
      'gluten_free',
    )
    expect(plans).toEqual([])
  })

  it('receta ya compatible con todos los ingredientes devuelve array vacío', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(TOMATE, 100), makeContext(POLLO, 200)],
      'gluten_free',
    )
    expect(plans).toEqual([])
  })
})

// ─── Sin lactosa ────────────────────────────────────────────────────────────

describe('RecipeVariantGenerator.plan — dairy_free', () => {
  it('sustituye leche por leche de almendra', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(LECHE, 250, {}, UNIT_G)],
      'dairy_free',
    )
    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'leche de almendra',
    })
  })

  it('leche de almendra ya no viola (atributo vegano implica sin lactosa)', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(LECHE_ALMENDRA, 250, { attributes: ['vegano'] })],
      'dairy_free',
    )
    expect(plans).toEqual([])
  })

  it('sustituye mantequilla por aceite de coco', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(MANTEQUILLA, 30)],
      'dairy_free',
    )
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'aceite de coco',
    })
  })

  it('alérgeno lácteos directo sin keyword → elimina sin sustituto', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(SALSA_MISTERIOSA, 15, { allergens: [{ slug: 'lacteos' }] })],
      'dairy_free',
    )
    expect(plans[0].kind).toBe('remove')
  })
})

// ─── Vegetariana ────────────────────────────────────────────────────────────

describe('RecipeVariantGenerator.plan — vegetarian', () => {
  it('sustituye pollo por tofu firme', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(POLLO, 200)],
      'vegetarian',
    )
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'tofu firme',
    })
  })

  it('huevo y lácteos NO violan (vegetariana admite huevo y lácteos)', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(HUEVO, 60), makeContext(LECHE, 200)],
      'vegetarian',
    )
    expect(plans).toEqual([])
  })

  it('alérgeno pescado directo sin keyword → elimina sin sustituto', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(SALSA_MISTERIOSA, 15, { allergens: [{ slug: 'pescado' }] })],
      'vegetarian',
    )
    expect(plans[0].kind).toBe('remove')
  })

  it('atributo "vegetariano" evita el reemplazo aunque el nombre diga pollo', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(POLLO, 200, { attributes: ['vegetariano'] })],
      'vegetarian',
    )
    expect(plans).toEqual([])
  })
})

// ─── Vegana ─────────────────────────────────────────────────────────────────

describe('RecipeVariantGenerator.plan — vegan', () => {
  it('sustituye huevo por linaza molida', () => {
    const plans = RecipeVariantGenerator.plan([makeContext(HUEVO, 60)], 'vegan')
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'linaza molida',
    })
  })

  it('sustituye miel por sirope de agave', () => {
    const plans = RecipeVariantGenerator.plan([makeContext(MIEL, 30)], 'vegan')
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'sirope de agave',
    })
  })

  it('sustituye leche por leche de almendra (también aplica a vegana)', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(LECHE, 250)],
      'vegan',
    )
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'leche de almendra',
    })
  })

  it('atributo "vegano" evita cualquier reemplazo', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(HUEVO, 60, { attributes: ['vegano'] })],
      'vegan',
    )
    expect(plans).toEqual([])
  })

  it('pollo también viola vegana (hereda las reglas de vegetariana)', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(POLLO, 200)],
      'vegan',
    )
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'tofu firme',
    })
  })
})

// ─── Keto ───────────────────────────────────────────────────────────────────

describe('RecipeVariantGenerator.plan — keto', () => {
  it('sustituye por keyword ("arroz") aunque los carbos no superen el umbral', () => {
    const lowCarbArroz = makeIngredient({
      id: 'ing-arroz-bajo',
      name: 'Arroz blanco',
      slug: 'arroz-bajo',
      nutrition: {
        calories_kcal: 100,
        protein_g: 2,
        carbs_g: 5,
        sugar_g: 0,
        fiber_g: 0,
        fat_g: 0,
        saturated_fat_g: 0,
        sodium_mg: 0,
      },
    })
    const plans = RecipeVariantGenerator.plan(
      [makeContext(lowCarbArroz, 150)],
      'keto',
    )
    expect(plans[0]).toMatchObject({
      kind: 'replace',
      substituteQuery: 'coliflor arroz',
    })
  })

  it('elimina por umbral de carbohidratos aunque el nombre no coincida con ninguna keyword', () => {
    // "White Rice" (fixture en inglés) no coincide con ninguna keyword en español,
    // pero sus carbos (28g/100g) superan el umbral keto (20g/100g).
    const plans = RecipeVariantGenerator.plan(
      [makeContext(INGREDIENT_RICE, 150)],
      'keto',
    )
    expect(plans).toEqual([
      {
        kind: 'remove',
        recipeIngredientId: 'ri-ing-rice',
        ingredientName: 'White Rice',
        reason: expect.stringContaining('Alto en carbohidratos'),
      },
    ])
  })

  it('ingrediente bajo en carbos y sin keyword no genera cambios', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(INGREDIENT_CHICKEN, 200)],
      'keto',
    )
    expect(plans).toEqual([])
  })

  it('atributo "keto" evita el cambio aunque los carbos superen el umbral', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(INGREDIENT_RICE, 150, { attributes: ['keto'] })],
      'keto',
    )
    expect(plans).toEqual([])
  })
})

// ─── Alta proteína ──────────────────────────────────────────────────────────

describe('RecipeVariantGenerator.plan — high_protein', () => {
  it('prioriza la sustitución curada sobre el fallback de escalado', () => {
    const pasta = makeIngredient({
      id: 'ing-pasta',
      name: 'Pasta',
      slug: 'pasta',
    })
    const plans = RecipeVariantGenerator.plan(
      [makeContext(pasta, 200), makeContext(POLLO, 200)],
      'high_protein',
    )
    // Solo la pasta tiene sustitución curada — el pollo no se toca porque ya
    // hay un cambio disponible sin necesidad de escalar cantidades.
    expect(plans).toEqual([
      {
        kind: 'replace',
        recipeIngredientId: 'ri-ing-pasta',
        ingredientName: 'Pasta',
        substituteQuery: 'pasta de lentejas',
        reason: expect.any(String),
      },
    ])
  })

  it('sin sustitución curada, escala el ingrediente más proteico', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(INGREDIENT_CHICKEN, 200), makeContext(INGREDIENT_RICE, 150)],
      'high_protein',
    )
    expect(plans).toEqual([
      {
        kind: 'adjust_quantity',
        recipeIngredientId: 'ri-ing-chicken',
        ingredientName: 'Chicken Breast',
        newQuantity: 300,
        reason: expect.stringContaining('300'),
      },
    ])
  })

  it('sin ningún ingrediente con proteína no hay nada que proponer', () => {
    const noProtein = makeIngredient({
      id: 'ing-lechuga',
      name: 'Lechuga',
      slug: 'lechuga',
      nutrition: {
        calories_kcal: 15,
        protein_g: 0,
        carbs_g: 3,
        sugar_g: 1,
        fiber_g: 1,
        fat_g: 0,
        saturated_fat_g: 0,
        sodium_mg: 5,
      },
    })
    const plans = RecipeVariantGenerator.plan(
      [makeContext(noProtein, 100)],
      'high_protein',
    )
    expect(plans).toEqual([])
  })
})

// ─── Baja calórica ──────────────────────────────────────────────────────────

describe('RecipeVariantGenerator.plan — low_calorie', () => {
  it('prioriza la sustitución curada sobre el fallback de reducción', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(MANTEQUILLA, 30), makeContext(INGREDIENT_OIL, 20)],
      'low_calorie',
    )
    expect(plans).toEqual([
      {
        kind: 'replace',
        recipeIngredientId: 'ri-ing-mantequilla',
        ingredientName: 'Mantequilla',
        substituteQuery: 'margarina light',
        reason: expect.any(String),
      },
    ])
  })

  it('sin sustitución curada, reduce la cantidad del ingrediente más calórico', () => {
    const plans = RecipeVariantGenerator.plan(
      [makeContext(INGREDIENT_OIL, 20), makeContext(INGREDIENT_CHICKEN, 200)],
      'low_calorie',
    )
    expect(plans).toEqual([
      {
        kind: 'adjust_quantity',
        recipeIngredientId: 'ri-ing-oil',
        ingredientName: 'Olive Oil',
        newQuantity: 14,
        reason: expect.stringContaining('14'),
      },
    ])
  })

  it('receta ya baja en calorías no genera cambios', () => {
    const light = makeIngredient({
      id: 'ing-pepino',
      name: 'Pepino',
      slug: 'pepino',
      nutrition: {
        calories_kcal: 16,
        protein_g: 0.7,
        carbs_g: 3.6,
        sugar_g: 1.7,
        fiber_g: 0.5,
        fat_g: 0.1,
        saturated_fat_g: 0,
        sodium_mg: 2,
      },
    })
    const plans = RecipeVariantGenerator.plan(
      [makeContext(light, 100)],
      'low_calorie',
    )
    expect(plans).toEqual([])
  })
})

// ─── Metadata ───────────────────────────────────────────────────────────────

describe('DIET_VARIANT_METADATA', () => {
  it('tiene nombre y slug para los 7 tipos requeridos', () => {
    const types: DietVariantType[] = [
      'high_protein',
      'low_calorie',
      'vegetarian',
      'vegan',
      'keto',
      'gluten_free',
      'dairy_free',
    ]
    for (const type of types) {
      expect(DIET_VARIANT_METADATA[type].name).toEqual(expect.any(String))
      expect(DIET_VARIANT_METADATA[type].slug).toEqual(expect.any(String))
    }
  })
})
