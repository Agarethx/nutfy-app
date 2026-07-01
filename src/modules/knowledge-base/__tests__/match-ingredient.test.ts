import { ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import { ValidationError, DatabaseError } from '@/shared/types'
import {
  matchIngredientLine,
  matchIngredientLines,
} from '../application/use-cases/match-ingredient.use-case'
import type { IngredientRepository } from '../infrastructure/repositories/ingredient.repository'
import type {
  CreateIngredientInput,
  Ingredient,
  IngredientMatchCandidate,
} from '../domain/ingredient.types'

// ─── Mock de IngredientRepository ──────────────────────────────────────────────
// Solo implementa lo que usa matchIngredientLine/matchIngredientLines:
// matchCandidates() y create(). El resto de métodos no se necesita.

type RepoMock = Pick<IngredientRepository, 'matchCandidates' | 'create'>

function makeIngredient(id: string, name: string): Ingredient {
  return {
    id,
    slug: name.toLowerCase(),
    name,
    description: null,
    category_id: null,
    subcategory_id: null,
    default_unit_id: null,
    image_url: null,
    countries: [],
    seasonality: { months: [] },
    nutrition: {
      calories_kcal: null,
      protein_g: null,
      carbs_g: null,
      sugar_g: null,
      fiber_g: null,
      fat_g: null,
      saturated_fat_g: null,
      sodium_mg: null,
    },
    is_system: false,
    status: 'PENDING_REVIEW',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deprecated_at: null,
  }
}

function makeCandidate(
  overrides: Partial<IngredientMatchCandidate> = {},
): IngredientMatchCandidate {
  return {
    ingredient_id: 'ing-1',
    name: 'Tomate',
    slug: 'tomate',
    status: 'ACTIVE',
    score: 1,
    matched_via: 'name',
    matched_text: 'Tomate',
    ...overrides,
  }
}

// Stub simple: matchCandidates y create devuelven lo que se les configure.
function fakeRepo(opts: {
  candidates?: IngredientMatchCandidate[]
  matchResult?: Result<IngredientMatchCandidate[]>
  createResult?: Result<Ingredient>
  onMatch?: (term: string) => void
  onCreate?: (input: CreateIngredientInput) => void
}): RepoMock {
  return {
    matchCandidates: jest.fn(async (term: string) => {
      opts.onMatch?.(term)
      return opts.matchResult ?? ok(opts.candidates ?? [])
    }),
    create: jest.fn(async (input: CreateIngredientInput) => {
      opts.onCreate?.(input)
      return opts.createResult ?? ok(makeIngredient('new-id', input.name))
    }),
  }
}

// ─── matchIngredientLine — confidence por score ────────────────────────────────

describe('matchIngredientLine — niveles de confianza', () => {
  it('score alto (≥0.6) devuelve confidence "high" y matched true', async () => {
    const repo = fakeRepo({ candidates: [makeCandidate({ score: 0.9 })] })

    const result = await matchIngredientLine(
      '2 tomates grandes',
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual({
      ingredient_id: 'ing-1',
      quantity: 2,
      unit: null,
      preparation: null,
      confidence: 'high',
      matched: true,
    })
  })

  it('score medio (0.35–0.6) devuelve confidence "medium"', async () => {
    const repo = fakeRepo({ candidates: [makeCandidate({ score: 0.5 })] })

    const result = await matchIngredientLine(
      'tomates',
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.confidence).toBe('medium')
  })

  it('score bajo (0.2–0.35) reutiliza el candidato existente con confidence "low" (no crea duplicado)', async () => {
    const create = jest.fn()
    const repo = fakeRepo({
      candidates: [makeCandidate({ score: 0.25 })],
      onCreate: create,
    })

    const result = await matchIngredientLine(
      'tomates',
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.confidence).toBe('low')
      expect(result.data.matched).toBe(true)
      expect(result.data.ingredient_id).toBe('ing-1')
    }
    expect(create).not.toHaveBeenCalled()
  })

  it('umbral exacto 0.6 cuenta como "high"', async () => {
    const repo = fakeRepo({ candidates: [makeCandidate({ score: 0.6 })] })
    const result = await matchIngredientLine(
      'tomates',
      repo as IngredientRepository,
    )
    if (result.ok) expect(result.data.confidence).toBe('high')
  })

  it('umbral exacto 0.35 cuenta como "medium"', async () => {
    const repo = fakeRepo({ candidates: [makeCandidate({ score: 0.35 })] })
    const result = await matchIngredientLine(
      'tomates',
      repo as IngredientRepository,
    )
    if (result.ok) expect(result.data.confidence).toBe('medium')
  })
})

// ─── matchIngredientLine — sin coincidencia: crear pendiente ───────────────────

describe('matchIngredientLine — sin coincidencia crea ingrediente pendiente', () => {
  it('sin candidatos crea un ingrediente PENDING_REVIEW con confidence "low"', async () => {
    const create = jest.fn()
    const repo = fakeRepo({ candidates: [], onCreate: create })

    const result = await matchIngredientLine(
      '2 kiwis grandes',
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.matched).toBe(false)
      expect(result.data.confidence).toBe('low')
      expect(result.data.ingredient_id).toBe('new-id')
      expect(result.data.quantity).toBe(2)
    }
    expect(create).toHaveBeenCalledWith({ name: 'Kiwi' })
  })

  it('capitaliza solo la primera letra del nombre creado', async () => {
    const create = jest.fn()
    const repo = fakeRepo({ candidates: [], onCreate: create })

    await matchIngredientLine(
      '200 g de pimiento amarillo',
      repo as IngredientRepository,
    )

    expect(create).toHaveBeenCalledWith({ name: 'Pimiento amarillo' })
  })
})

// ─── matchIngredientLine — validación y propagación de errores ────────────────

describe('matchIngredientLine — errores', () => {
  it('texto sin nombre extraíble devuelve ValidationError sin llamar al repo', async () => {
    const match = jest.fn()
    const repo = fakeRepo({ candidates: [], onMatch: match })

    const result = await matchIngredientLine('2', repo as IngredientRepository)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError)
    expect(match).not.toHaveBeenCalled()
  })

  it('propaga el error si matchCandidates falla', async () => {
    const repo = fakeRepo({
      matchResult: err(new DatabaseError('conexión perdida')),
    })

    const result = await matchIngredientLine(
      'tomates',
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(DatabaseError)
  })

  it('propaga el error si create falla', async () => {
    const repo = fakeRepo({
      candidates: [],
      createResult: err(new DatabaseError('insert falló')),
    })

    const result = await matchIngredientLine(
      'kiwi',
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(DatabaseError)
  })
})

// ─── matchIngredientLines — procesamiento secuencial sin duplicados ───────────

describe('matchIngredientLines — nunca crea ingredientes duplicados', () => {
  it('procesa varias líneas y devuelve un resultado por línea', async () => {
    const repo = fakeRepo({ candidates: [makeCandidate({ score: 1 })] })

    const result = await matchIngredientLines(
      ['2 tomates', '1 cebolla'],
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toHaveLength(2)
  })

  it('si dos líneas normalizan al mismo nombre nuevo, solo crea una vez', async () => {
    // Repo con estado: simula la DB encontrando lo que se acaba de crear.
    const created: Ingredient[] = []
    const repo: RepoMock = {
      matchCandidates: jest.fn(async (term: string) => {
        const existing = created.find(
          (i) => i.name.toLowerCase() === term.toLowerCase(),
        )
        return ok(
          existing
            ? [
                makeCandidate({
                  ingredient_id: existing.id,
                  name: existing.name,
                  score: 1,
                }),
              ]
            : [],
        )
      }),
      create: jest.fn(async (input: CreateIngredientInput) => {
        const ingredient = makeIngredient(
          `id-${created.length + 1}`,
          input.name,
        )
        created.push(ingredient)
        return ok(ingredient)
      }),
    }

    const result = await matchIngredientLines(
      ['2 kiwis grandes', '3 kiwis pequeños'],
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data[0].matched).toBe(false) // primera línea: crea
      expect(result.data[1].matched).toBe(true) // segunda línea: encuentra la recién creada
      expect(result.data[0].ingredient_id).toBe(result.data[1].ingredient_id)
    }
    expect(repo.create).toHaveBeenCalledTimes(1)
  })

  it('se detiene en el primer error y no continúa procesando líneas', async () => {
    const matchCandidates = jest
      .fn()
      .mockResolvedValueOnce(err(new DatabaseError('falló')))
      .mockResolvedValueOnce(ok([]))
    const repo: RepoMock = { matchCandidates, create: jest.fn() }

    const result = await matchIngredientLines(
      ['2 tomates', '1 cebolla'],
      repo as IngredientRepository,
    )

    expect(result.ok).toBe(false)
    expect(matchCandidates).toHaveBeenCalledTimes(1)
  })
})
