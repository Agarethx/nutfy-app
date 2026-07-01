import { ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import { DatabaseError, NotFoundError } from '@/shared/types'
import {
  generateRecipeVariants,
  ALL_DIET_VARIANT_TYPES,
} from '../application/use-cases/generate-recipe-variants.use-case'
import type { RecipeRepository } from '../infrastructure/repositories/recipe.repository'
import type { IngredientRepository } from '../infrastructure/repositories/ingredient.repository'
import type { StorageRepository } from '../infrastructure/repositories/storage.repository'
import type { Attribute, Unit } from '../domain/shared.types'
import type {
  CreateIngredientInput,
  Ingredient,
  IngredientMatchCandidate,
  IngredientWithDetails,
} from '../domain/ingredient.types'
import type {
  CreateRecipeVariationInput,
  RecipeIngredient,
  RecipeVariation,
  RecipeWithDetails,
} from '../domain/recipe.types'
import {
  ALL_UNITS,
  GLOBAL_CONVERSIONS,
  UNIT_G,
  RECIPE_CHICKEN_RICE,
  makeIngredient,
} from './fixtures'

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function makeDetails(
  ingredient: Ingredient,
  opts: { attributes?: string[] } = {},
): IngredientWithDetails {
  return {
    ...ingredient,
    category: null,
    subcategory: null,
    translations: [],
    allergens: [],
    micronutrients: [],
    storage_rules: [],
    unit_conversions: [],
    attributes: (opts.attributes ?? []).map(makeAttribute),
  }
}

function makeRecipeIngredient(
  id: string,
  ingredient: Ingredient,
  quantity: number,
  unit: Unit = UNIT_G,
): RecipeIngredient {
  return {
    id,
    recipe_id: RECIPE_CHICKEN_RICE.id,
    ingredient_id: ingredient.id,
    ingredient,
    unit_id: unit.id,
    unit,
    quantity,
    is_optional: false,
    notes: null,
  }
}

function makeRecipeWithDetails(
  ingredients: RecipeIngredient[],
): RecipeWithDetails {
  return {
    ...RECIPE_CHICKEN_RICE,
    ingredients,
    steps: [],
    variations: [],
    storage_rules: [],
    attributes: [],
  }
}

// Catálogo de ingredientes en memoria: soporta findWithDetails/findById
// (para RecipeVariantGenerator y para el pool de NutritionCalculator) y
// matchCandidates/create (para que matchIngredientLine resuelva sustitutos
// sin llamar a IA, igual que en producción).
function makeFakeIngredientCatalog(seed: IngredientWithDetails[]) {
  const byId = new Map(seed.map((i) => [i.id, i]))
  let counter = 0

  // IngredientWithDetails ya contiene todos los campos de Ingredient — se
  // acepta estructuralmente donde se espera Ingredient, sin necesidad de
  // destructurar los campos extra (category, allergens, attributes...).
  const stripDetails = (details: IngredientWithDetails): Ingredient => details

  const repo = {
    findWithDetails: jest.fn(async (id: string) => ok(byId.get(id) ?? null)),
    findById: jest.fn(async (id: string) => {
      const details = byId.get(id)
      return ok(details ? stripDetails(details) : null)
    }),
    matchCandidates: jest.fn(
      async (term: string): Promise<Result<IngredientMatchCandidate[]>> => {
        const match = [...byId.values()].find(
          (i) => i.name.toLowerCase() === term.toLowerCase(),
        )
        if (!match) return ok([])
        return ok([
          {
            ingredient_id: match.id,
            name: match.name,
            slug: match.slug,
            status: match.status,
            score: 1,
            matched_via: 'name',
            matched_text: match.name,
          },
        ])
      },
    ),
    create: jest.fn(async (input: CreateIngredientInput) => {
      counter++
      const id = `new-ing-${counter}`
      const details = makeDetails(
        makeIngredient({
          id,
          name: input.name,
          slug: input.name.toLowerCase(),
        }),
      )
      byId.set(id, details)
      return ok(stripDetails(details))
    }),
  }

  return { repo: repo as unknown as IngredientRepository, byId }
}

function makeFakeRecipeRepo(opts: {
  recipe: RecipeWithDetails | null
  createVariationResult?: Result<RecipeVariation>
}) {
  let counter = 0
  const createVariation = jest.fn(
    async (
      recipeId: string,
      input: CreateRecipeVariationInput,
    ): Promise<Result<RecipeVariation>> => {
      if (opts.createVariationResult) return opts.createVariationResult
      counter++
      const variationId = `var-${counter}`
      return ok({
        id: variationId,
        recipe_id: recipeId,
        slug: `${input.name.toLowerCase()}-${counter}`,
        name: input.name,
        description: input.description ?? null,
        servings_min: input.servings_min ?? null,
        servings_max: input.servings_max ?? null,
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        overrides: input.overrides.map((o, i) => ({
          id: `ov-${variationId}-${i}`,
          variation_id: variationId,
          override_type: o.override_type,
          original_ingredient_id: o.original_ingredient_id ?? null,
          new_ingredient_id: o.new_ingredient_id ?? null,
          new_quantity: o.new_quantity ?? null,
          new_unit_id: o.new_unit_id ?? null,
          notes: o.notes ?? null,
        })),
      })
    },
  )

  const repo = {
    findWithDetails: jest.fn(async () => ok(opts.recipe)),
    createVariation,
  }

  return { repo: repo as unknown as RecipeRepository, createVariation }
}

function makeFakeStorageRepo(): StorageRepository {
  return {
    listUnits: jest.fn(async () => ok(ALL_UNITS)),
    listUnitConversions: jest.fn(async () => ok(GLOBAL_CONVERSIONS)),
  } as unknown as StorageRepository
}

// Ingredientes de prueba (nombres en español para activar las keywords).
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
const ARROZ = makeIngredient({
  id: 'ing-arroz',
  name: 'Arroz blanco',
  slug: 'arroz-blanco',
  nutrition: {
    calories_kcal: 130,
    protein_g: 2.7,
    carbs_g: 28,
    sugar_g: 2,
    fiber_g: 0.4,
    fat_g: 0.3,
    saturated_fat_g: 0.1,
    sodium_mg: 1,
  },
})
const TOMATE = makeIngredient({
  id: 'ing-tomate',
  name: 'Tomate',
  slug: 'tomate',
})
const TOFU_FIRME = makeIngredient({
  id: 'ing-tofu',
  name: 'Tofu firme',
  slug: 'tofu-firme',
  nutrition: {
    calories_kcal: 144,
    protein_g: 15,
    carbs_g: 3,
    sugar_g: 0,
    fiber_g: 1,
    fat_g: 9,
    saturated_fat_g: 1,
    sodium_mg: 10,
  },
})
const LECHE = makeIngredient({
  id: 'ing-leche',
  name: 'Leche entera',
  slug: 'leche-entera',
})
const LECHE2 = makeIngredient({
  id: 'ing-leche2',
  name: 'Leche',
  slug: 'leche',
})

// ─── Casos de error ─────────────────────────────────────────────────────────

describe('generateRecipeVariants — errores', () => {
  it('receta inexistente devuelve NotFoundError', async () => {
    const { repo: recipeRepo } = makeFakeRecipeRepo({ recipe: null })
    const { repo: ingredientRepo } = makeFakeIngredientCatalog([])

    const result = await generateRecipeVariants('recipe-x', {
      recipeRepo,
      ingredientRepo,
      storageRepo: makeFakeStorageRepo(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('receta sin ingredientes devuelve insufficient_data para todos los tipos', async () => {
    const { repo: recipeRepo } = makeFakeRecipeRepo({
      recipe: makeRecipeWithDetails([]),
    })
    const { repo: ingredientRepo } = makeFakeIngredientCatalog([])

    const result = await generateRecipeVariants('recipe-1', {
      recipeRepo,
      ingredientRepo,
      storageRepo: makeFakeStorageRepo(),
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toHaveLength(ALL_DIET_VARIANT_TYPES.length)
      expect(
        result.data.every(
          (r) => !r.created && r.reason === 'insufficient_data',
        ),
      ).toBe(true)
    }
  })

  it('propaga el error si createVariation falla', async () => {
    const recipe = makeRecipeWithDetails([
      makeRecipeIngredient('ri-1', POLLO, 200),
    ])
    const { repo: recipeRepo } = makeFakeRecipeRepo({
      recipe,
      createVariationResult: err(new DatabaseError('insert falló')),
    })
    const { repo: ingredientRepo } = makeFakeIngredientCatalog([
      makeDetails(POLLO),
      makeDetails(TOFU_FIRME),
    ])

    const result = await generateRecipeVariants(
      'recipe-1',
      {
        recipeRepo,
        ingredientRepo,
        storageRepo: makeFakeStorageRepo(),
      },
      ['vegetarian'],
    )

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(DatabaseError)
  })
})

// ─── Receta ya compatible ───────────────────────────────────────────────────

describe('generateRecipeVariants — receta ya compatible', () => {
  it('no crea variante y marca already_compliant cuando no hay violaciones', async () => {
    const recipe = makeRecipeWithDetails([
      makeRecipeIngredient('ri-1', TOMATE, 100),
    ])
    const { repo: recipeRepo, createVariation } = makeFakeRecipeRepo({ recipe })
    const { repo: ingredientRepo } = makeFakeIngredientCatalog([
      makeDetails(TOMATE),
    ])

    const result = await generateRecipeVariants(
      'recipe-1',
      {
        recipeRepo,
        ingredientRepo,
        storageRepo: makeFakeStorageRepo(),
      },
      ['vegan'],
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual([
        { variantType: 'vegan', created: false, reason: 'already_compliant' },
      ])
    }
    expect(createVariation).not.toHaveBeenCalled()
  })
})

// ─── Variante con reemplazo ─────────────────────────────────────────────────

describe('generateRecipeVariants — variante vegetariana con reemplazo', () => {
  it('crea la variante, persiste el override REPLACE y recalcula la nutrición', async () => {
    const recipe = makeRecipeWithDetails([
      makeRecipeIngredient('ri-pollo', POLLO, 200),
      makeRecipeIngredient('ri-arroz', ARROZ, 150),
    ])
    const { repo: recipeRepo, createVariation } = makeFakeRecipeRepo({ recipe })
    const { repo: ingredientRepo } = makeFakeIngredientCatalog([
      makeDetails(POLLO),
      makeDetails(ARROZ),
      makeDetails(TOFU_FIRME),
    ])

    const result = await generateRecipeVariants(
      'recipe-1',
      {
        recipeRepo,
        ingredientRepo,
        storageRepo: makeFakeStorageRepo(),
      },
      ['vegetarian'],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const [variant] = result.data
    expect(variant.created).toBe(true)
    if (!variant.created) return

    expect(variant.variation.name).toBe('Vegetariana')
    expect(variant.changes).toEqual([
      {
        type: 'replace',
        originalIngredientName: 'Pechuga de pollo',
        newIngredientName: 'Tofu firme',
        reason: expect.any(String),
      },
    ])

    expect(createVariation).toHaveBeenCalledWith(
      'recipe-1',
      expect.objectContaining({
        name: 'Vegetariana',
        overrides: [
          expect.objectContaining({
            override_type: 'REPLACE',
            original_ingredient_id: 'ing-pollo',
            new_ingredient_id: 'ing-tofu',
            new_quantity: 200,
            new_unit_id: UNIT_G.id,
          }),
        ],
      }),
    )

    // Nutrición recalculada con tofu (144kcal/100g) en vez de pollo (165kcal/100g)
    // + arroz sin cambios, dividido por servings_min de la receta (2).
    const expectedCalories = (144 * 2 + 130 * 1.5) / 2
    expect(variant.nutrition.calories_kcal).toBeCloseTo(expectedCalories, 4)
  })

  it('nunca duplica el sustituto cuando dos ingredientes de la misma variante lo necesitan', async () => {
    const recipe = makeRecipeWithDetails([
      makeRecipeIngredient('ri-leche1', LECHE, 200),
      makeRecipeIngredient('ri-leche2', LECHE2, 100),
    ])
    const { repo: recipeRepo } = makeFakeRecipeRepo({ recipe })
    const { repo: ingredientRepo, byId } = makeFakeIngredientCatalog([
      makeDetails(LECHE),
      makeDetails(LECHE2),
    ])

    const result = await generateRecipeVariants(
      'recipe-1',
      {
        recipeRepo,
        ingredientRepo,
        storageRepo: makeFakeStorageRepo(),
      },
      ['dairy_free'],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const [variant] = result.data
    expect(variant.created).toBe(true)
    if (!variant.created) return

    // Ambos overrides deben apuntar al MISMO ingredient_id nuevo (creado una sola vez).
    const newIds = variant.variation.overrides.map((o) => o.new_ingredient_id)
    expect(new Set(newIds).size).toBe(1)
    expect(ingredientRepo.create).toHaveBeenCalledTimes(1)

    const createdName = [...byId.values()].find(
      (i) => i.name.toLowerCase() === 'leche de almendra',
    )
    expect(createdName).toBeDefined()
  })
})

// ─── Alta proteína (ajuste de cantidad) ────────────────────────────────────

describe('generateRecipeVariants — alta proteína sin sustitución curada', () => {
  it('genera un override ADJUST_QUANTITY sobre el ingrediente más proteico', async () => {
    // Tomate no tiene sustitución curada de alta proteína (a diferencia de
    // arroz/pasta/harina), así que fuerza el fallback de escalado.
    const recipe = makeRecipeWithDetails([
      makeRecipeIngredient('ri-pollo', POLLO, 200),
      makeRecipeIngredient('ri-tomate', TOMATE, 100),
    ])
    const { repo: recipeRepo, createVariation } = makeFakeRecipeRepo({ recipe })
    const { repo: ingredientRepo } = makeFakeIngredientCatalog([
      makeDetails(POLLO),
      makeDetails(TOMATE),
    ])

    const result = await generateRecipeVariants(
      'recipe-1',
      {
        recipeRepo,
        ingredientRepo,
        storageRepo: makeFakeStorageRepo(),
      },
      ['high_protein'],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const [variant] = result.data
    expect(variant.created).toBe(true)
    if (!variant.created) return

    expect(variant.changes).toEqual([
      {
        type: 'adjust_quantity',
        originalIngredientName: 'Pechuga de pollo',
        newQuantity: 300,
        reason: expect.any(String),
      },
    ])
    expect(createVariation).toHaveBeenCalledWith(
      'recipe-1',
      expect.objectContaining({
        overrides: [
          expect.objectContaining({
            override_type: 'ADJUST_QUANTITY',
            new_quantity: 300,
          }),
        ],
      }),
    )
  })
})

// ─── Generación de las 7 variantes a la vez ────────────────────────────────

describe('generateRecipeVariants — genera las 7 variantes por defecto', () => {
  it('devuelve un resultado por cada uno de los 7 tipos', async () => {
    const recipe = makeRecipeWithDetails([
      makeRecipeIngredient('ri-pollo', POLLO, 200),
    ])
    const { repo: recipeRepo } = makeFakeRecipeRepo({ recipe })
    const { repo: ingredientRepo } = makeFakeIngredientCatalog([
      makeDetails(POLLO),
      makeDetails(TOFU_FIRME),
    ])

    const result = await generateRecipeVariants('recipe-1', {
      recipeRepo,
      ingredientRepo,
      storageRepo: makeFakeStorageRepo(),
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.map((r) => r.variantType).sort()).toEqual(
        [...ALL_DIET_VARIANT_TYPES].sort(),
      )
    }
  })
})
