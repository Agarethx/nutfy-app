import { createRecipe } from '../application/use-cases/create-recipe.use-case'
import { updateRecipe } from '../application/use-cases/update-recipe.use-case'
import { ValidationError, NotFoundError } from '@/shared/types'
import { ok, err } from '@/shared/networking'
import type { RecipeRepository } from '../infrastructure/repositories/recipe.repository'
import {
  RECIPE_CHICKEN_RICE,
  RECIPE_DEPRECATED,
  USER_ID,
  makeCreateRecipeInput,
} from './fixtures'

// ─── Mock repository ──────────────────────────────────────────────────────────

function mockRepo(overrides?: Partial<RecipeRepository>): RecipeRepository {
  return {
    findById: jest.fn().mockResolvedValue(ok(RECIPE_CHICKEN_RICE)),
    findWithDetails: jest.fn().mockResolvedValue(ok(null)),
    list: jest.fn().mockResolvedValue(ok([])),
    create: jest.fn().mockResolvedValue(ok(RECIPE_CHICKEN_RICE)),
    update: jest.fn().mockResolvedValue(ok(RECIPE_CHICKEN_RICE)),
    deprecate: jest.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  } as unknown as RecipeRepository
}

// ─── createRecipe use-case (INV-07) ──────────────────────────────────────────

describe('createRecipe use-case', () => {
  describe('INV-07: nombre válido', () => {
    it('falla si el nombre está vacío', async () => {
      const result = await createRecipe(makeCreateRecipeInput({ name: '' }), USER_ID, mockRepo())
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect((result.error as ValidationError).fields.name).toBeDefined()
      }
    })

    it('falla si el nombre tiene menos de 2 caracteres', async () => {
      const result = await createRecipe(makeCreateRecipeInput({ name: 'A' }), USER_ID, mockRepo())
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError)
    })

    it('acepta nombre con exactamente 2 caracteres', async () => {
      const result = await createRecipe(makeCreateRecipeInput({ name: 'Ab' }), USER_ID, mockRepo())
      expect(result.ok).toBe(true)
    })
  })

  describe('INV-07: debe tener al menos 1 ingrediente', () => {
    it('falla con lista de ingredientes vacía', async () => {
      const result = await createRecipe(
        makeCreateRecipeInput({ ingredients: [] }),
        USER_ID,
        mockRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect((result.error as ValidationError).fields.ingredients).toBeDefined()
      }
    })

    it('acepta con al menos 1 ingrediente', async () => {
      const result = await createRecipe(makeCreateRecipeInput(), USER_ID, mockRepo())
      expect(result.ok).toBe(true)
    })
  })

  describe('INV-07: debe tener al menos 1 paso', () => {
    it('falla con lista de pasos vacía', async () => {
      const result = await createRecipe(
        makeCreateRecipeInput({ steps: [] }),
        USER_ID,
        mockRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect((result.error as ValidationError).fields.steps).toBeDefined()
      }
    })

    it('acepta con al menos 1 paso', async () => {
      const result = await createRecipe(makeCreateRecipeInput(), USER_ID, mockRepo())
      expect(result.ok).toBe(true)
    })
  })

  describe('INV: servings_min ≤ servings_max', () => {
    it('falla si servings_min > servings_max', async () => {
      const result = await createRecipe(
        makeCreateRecipeInput({ servings_min: 5, servings_max: 2 }),
        USER_ID,
        mockRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect((result.error as ValidationError).fields.servings).toBeDefined()
      }
    })

    it('acepta cuando servings_min === servings_max', async () => {
      const result = await createRecipe(
        makeCreateRecipeInput({ servings_min: 2, servings_max: 2 }),
        USER_ID,
        mockRepo(),
      )
      expect(result.ok).toBe(true)
    })
  })

  describe('múltiples errores en una sola llamada', () => {
    it('reporta todos los campos inválidos a la vez', async () => {
      const result = await createRecipe(
        { name: '', servings_min: 5, servings_max: 2, ingredients: [], steps: [] },
        USER_ID,
        mockRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        const fields = (result.error as ValidationError).fields
        expect(fields.name).toBeDefined()
        expect(fields.ingredients).toBeDefined()
        expect(fields.steps).toBeDefined()
        expect(fields.servings).toBeDefined()
      }
    })
  })

  it('delega al repositorio cuando los datos son válidos', async () => {
    const repo = mockRepo()
    await createRecipe(makeCreateRecipeInput(), USER_ID, repo)
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Recipe' }), USER_ID)
  })

  it('propaga el error del repositorio', async () => {
    const dbErr = new Error('DB connection failed')
    const repo = mockRepo({ create: jest.fn().mockResolvedValue(err(dbErr)) })
    const result = await createRecipe(makeCreateRecipeInput(), USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.message).toBe('DB connection failed')
  })
})

// ─── updateRecipe use-case ────────────────────────────────────────────────────

describe('updateRecipe use-case', () => {
  describe('ownership (INV-08)', () => {
    it('falla si la receta no existe', async () => {
      const repo = mockRepo({ findById: jest.fn().mockResolvedValue(ok(null)) })
      const result = await updateRecipe('rec-999', { name: 'New' }, USER_ID, repo)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
    })

    it('falla si la receta pertenece a otro usuario', async () => {
      const repo = mockRepo({
        findById: jest.fn().mockResolvedValue(ok({ ...RECIPE_CHICKEN_RICE, user_id: 'user-other' })),
      })
      const result = await updateRecipe(RECIPE_CHICKEN_RICE.id, { name: 'New' }, USER_ID, repo)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(NotFoundError)
        expect((result.error as NotFoundError).code).toBe('RECIPE_NOT_FOUND')
      }
    })

    it('acepta si el usuario es el dueño', async () => {
      const result = await updateRecipe(RECIPE_CHICKEN_RICE.id, { name: 'New Name' }, USER_ID, mockRepo())
      expect(result.ok).toBe(true)
    })
  })

  describe('soft delete (INV-09): receta DEPRECATED no es editable', () => {
    it('falla al intentar editar una receta deprecada', async () => {
      const repo = mockRepo({ findById: jest.fn().mockResolvedValue(ok(RECIPE_DEPRECATED)) })
      const result = await updateRecipe(RECIPE_DEPRECATED.id, { name: 'New' }, USER_ID, repo)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect((result.error as ValidationError).fields.status).toBeDefined()
      }
    })

    it('permite editar receta ACTIVE', async () => {
      const repo = mockRepo({
        findById: jest.fn().mockResolvedValue(ok({ ...RECIPE_CHICKEN_RICE, status: 'ACTIVE' })),
      })
      const result = await updateRecipe(RECIPE_CHICKEN_RICE.id, { name: 'New Name' }, USER_ID, repo)
      expect(result.ok).toBe(true)
    })

    it('permite editar receta PENDING_REVIEW', async () => {
      const repo = mockRepo({
        findById: jest.fn().mockResolvedValue(ok({ ...RECIPE_CHICKEN_RICE, status: 'PENDING_REVIEW' })),
      })
      const result = await updateRecipe(RECIPE_CHICKEN_RICE.id, { name: 'Revisable' }, USER_ID, repo)
      expect(result.ok).toBe(true)
    })
  })

  describe('validaciones de campo', () => {
    it('falla si name actualizado tiene menos de 2 caracteres', async () => {
      const result = await updateRecipe(RECIPE_CHICKEN_RICE.id, { name: 'X' }, USER_ID, mockRepo())
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect((result.error as ValidationError).fields.name).toBeDefined()
      }
    })

    it('omitir name no produce error de nombre', async () => {
      const result = await updateRecipe(RECIPE_CHICKEN_RICE.id, {}, USER_ID, mockRepo())
      expect(result.ok).toBe(true)
    })

    it('falla si servings_min > servings_max en el update', async () => {
      const result = await updateRecipe(
        RECIPE_CHICKEN_RICE.id,
        { servings_min: 10, servings_max: 2 },
        USER_ID,
        mockRepo(),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect((result.error as ValidationError).fields.servings).toBeDefined()
      }
    })

    it('acepta servings_min sin servings_max (no se valida parcialmente)', async () => {
      const result = await updateRecipe(
        RECIPE_CHICKEN_RICE.id,
        { servings_min: 1 },
        USER_ID,
        mockRepo(),
      )
      expect(result.ok).toBe(true)
    })
  })

  it('delega al repositorio cuando los datos son válidos', async () => {
    const repo = mockRepo()
    await updateRecipe(RECIPE_CHICKEN_RICE.id, { name: 'Updated' }, USER_ID, repo)
    expect(repo.update).toHaveBeenCalledWith(RECIPE_CHICKEN_RICE.id, { name: 'Updated' })
  })

  it('el repositorio falla si findById retorna error', async () => {
    const dbErr = new Error('DB failed')
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(err(dbErr)) })
    const result = await updateRecipe('rec-001', { name: 'X' }, USER_ID, repo)
    expect(result.ok).toBe(false)
  })
})
