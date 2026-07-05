import { assignRecipeToMeal } from '../application/use-cases/assign-recipe-to-meal.use-case'
import { removeRecipeFromMeal } from '../application/use-cases/remove-recipe-from-meal.use-case'
import { changeServings } from '../application/use-cases/change-servings.use-case'
import { ValidationError, NotFoundError, BusinessRuleError } from '@/shared/types'
import { ok } from '@/shared/networking'
import {
  OTHER_USER_ID,
  RECIPE_CHICKEN_RICE,
  RECIPE_DEPRECATED,
  USER_ID,
  makeMealAssignment,
  makeMealSlot,
  mockMealPlanRepo,
  mockRecipeRepo,
} from './fixtures'

describe('assignRecipeToMeal use-case', () => {
  it('falla si servings <= 0', async () => {
    const result = await assignRecipeToMeal(
      { meal_slot_id: 'slot-001', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 0 },
      USER_ID,
      { mealPlanRepo: mockMealPlanRepo(), recipeRepo: mockRecipeRepo() as any },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError)
  })

  describe('ownership del slot', () => {
    it('falla si el slot no existe', async () => {
      const mealPlanRepo = mockMealPlanRepo({ findSlotWithOwner: jest.fn().mockResolvedValue(ok(null)) })
      const result = await assignRecipeToMeal(
        { meal_slot_id: 'slot-999', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 2 },
        USER_ID,
        { mealPlanRepo, recipeRepo: mockRecipeRepo() as any },
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(NotFoundError)
        expect((result.error as NotFoundError).code).toBe('MEAL_SLOT_NOT_FOUND')
      }
    })

    it('falla si el slot pertenece a otro usuario', async () => {
      const mealPlanRepo = mockMealPlanRepo({
        findSlotWithOwner: jest.fn().mockResolvedValue(
          ok({ slot: makeMealSlot(), mealPlanId: 'plan-001', ownerId: OTHER_USER_ID }),
        ),
      })
      const result = await assignRecipeToMeal(
        { meal_slot_id: 'slot-001', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 2 },
        USER_ID,
        { mealPlanRepo, recipeRepo: mockRecipeRepo() as any },
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect((result.error as NotFoundError).code).toBe('MEAL_SLOT_NOT_FOUND')
    })
  })

  describe('cross-validation con Knowledge Base (domain-rules.md §7)', () => {
    it('falla si la receta no existe', async () => {
      const recipeRepo = mockRecipeRepo({ findById: jest.fn().mockResolvedValue(ok(null)) })
      const result = await assignRecipeToMeal(
        { meal_slot_id: 'slot-001', recipe_id: 'rec-999', servings: 2 },
        USER_ID,
        { mealPlanRepo: mockMealPlanRepo(), recipeRepo: recipeRepo as any },
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect((result.error as NotFoundError).code).toBe('RECIPE_NOT_FOUND')
    })

    it('falla si la receta está DEPRECATED', async () => {
      const recipeRepo = mockRecipeRepo({ findById: jest.fn().mockResolvedValue(ok(RECIPE_DEPRECATED)) })
      const result = await assignRecipeToMeal(
        { meal_slot_id: 'slot-001', recipe_id: RECIPE_DEPRECATED.id, servings: 2 },
        USER_ID,
        { mealPlanRepo: mockMealPlanRepo(), recipeRepo: recipeRepo as any },
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(BusinessRuleError)
        expect((result.error as BusinessRuleError).code).toBe('RECIPE_NOT_ASSIGNABLE')
      }
    })

    it('acepta una receta ACTIVE', async () => {
      const result = await assignRecipeToMeal(
        { meal_slot_id: 'slot-001', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 2 },
        USER_ID,
        { mealPlanRepo: mockMealPlanRepo(), recipeRepo: mockRecipeRepo() as any },
      )
      expect(result.ok).toBe(true)
    })
  })

  describe('INV: una receta no puede asignarse dos veces al mismo slot', () => {
    it('falla si la receta ya está asignada a ese slot', async () => {
      const mealPlanRepo = mockMealPlanRepo({
        findAssignmentBySlotAndRecipe: jest.fn().mockResolvedValue(ok(makeMealAssignment())),
      })
      const result = await assignRecipeToMeal(
        { meal_slot_id: 'slot-001', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 2 },
        USER_ID,
        { mealPlanRepo, recipeRepo: mockRecipeRepo() as any },
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(BusinessRuleError)
        expect((result.error as BusinessRuleError).code).toBe('MEAL_SLOT_OCCUPIED')
      }
    })
  })

  it('delega la creación al repositorio con el source por defecto MANUAL', async () => {
    const mealPlanRepo = mockMealPlanRepo()
    await assignRecipeToMeal(
      { meal_slot_id: 'slot-001', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 3 },
      USER_ID,
      { mealPlanRepo, recipeRepo: mockRecipeRepo() as any },
    )
    expect(mealPlanRepo.createAssignment).toHaveBeenCalledWith('slot-001', RECIPE_CHICKEN_RICE.id, 3, 'MANUAL')
  })

  it('respeta el source explícito', async () => {
    const mealPlanRepo = mockMealPlanRepo()
    await assignRecipeToMeal(
      { meal_slot_id: 'slot-001', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 3, source: 'AI_SUGGESTED' },
      USER_ID,
      { mealPlanRepo, recipeRepo: mockRecipeRepo() as any },
    )
    expect(mealPlanRepo.createAssignment).toHaveBeenCalledWith(
      'slot-001',
      RECIPE_CHICKEN_RICE.id,
      3,
      'AI_SUGGESTED',
    )
  })
})

describe('removeRecipeFromMeal use-case', () => {
  it('falla si la asignación no existe', async () => {
    const repo = mockMealPlanRepo({ findAssignmentWithOwner: jest.fn().mockResolvedValue(ok(null)) })
    const result = await removeRecipeFromMeal('assign-999', USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect((result.error as NotFoundError).code).toBe('MEAL_ASSIGNMENT_NOT_FOUND')
  })

  it('falla si la asignación pertenece a otro usuario', async () => {
    const repo = mockMealPlanRepo({
      findAssignmentWithOwner: jest.fn().mockResolvedValue(
        ok({ assignment: makeMealAssignment(), mealPlanId: 'plan-001', ownerId: OTHER_USER_ID }),
      ),
    })
    const result = await removeRecipeFromMeal('assign-001', USER_ID, repo)
    expect(result.ok).toBe(false)
  })

  it('elimina la asignación cuando el usuario es el dueño', async () => {
    const repo = mockMealPlanRepo()
    const result = await removeRecipeFromMeal('assign-001', USER_ID, repo)
    expect(result.ok).toBe(true)
    expect(repo.deleteAssignment).toHaveBeenCalledWith('assign-001')
  })
})

describe('changeServings use-case', () => {
  it('falla si servings <= 0', async () => {
    const result = await changeServings(
      { meal_assignment_id: 'assign-001', servings: -1 },
      USER_ID,
      mockMealPlanRepo(),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError)
  })

  it('falla si la asignación pertenece a otro usuario', async () => {
    const repo = mockMealPlanRepo({
      findAssignmentWithOwner: jest.fn().mockResolvedValue(
        ok({ assignment: makeMealAssignment(), mealPlanId: 'plan-001', ownerId: OTHER_USER_ID }),
      ),
    })
    const result = await changeServings({ meal_assignment_id: 'assign-001', servings: 3 }, USER_ID, repo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('actualiza servings cuando el usuario es el dueño', async () => {
    const repo = mockMealPlanRepo()
    const result = await changeServings({ meal_assignment_id: 'assign-001', servings: 5 }, USER_ID, repo)
    expect(result.ok).toBe(true)
    expect(repo.updateAssignmentServings).toHaveBeenCalledWith('assign-001', 5)
  })
})
