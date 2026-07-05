import { generateShoppingSnapshot } from '../application/use-cases/generate-shopping-snapshot.use-case'
import { NotFoundError } from '@/shared/types'
import { ok } from '@/shared/networking'
import {
  OTHER_USER_ID,
  RECIPE_CHICKEN_RICE,
  USER_ID,
  makeDayWithSlots,
  makeMealAssignment,
  makeMealPlanWithDetails,
  makeSlotWithAssignments,
  mockMealPlanRepo,
  mockRecipeRepo,
  mockShoppingSnapshotRepo,
  mockStorageRepo,
} from './fixtures'

function deps(overrides?: Partial<Record<string, unknown>>) {
  return {
    mealPlanRepo: mockMealPlanRepo(),
    snapshotRepo: mockShoppingSnapshotRepo(),
    recipeRepo: mockRecipeRepo() as any,
    storageRepo: mockStorageRepo() as any,
    ...overrides,
  }
}

describe('generateShoppingSnapshot use-case', () => {
  it('falla con 404 si el plan no existe o es de otro usuario', async () => {
    const mealPlanRepo = mockMealPlanRepo({
      findWithDetails: jest.fn().mockResolvedValue(ok(makeMealPlanWithDetails({ user_id: OTHER_USER_ID }))),
    })
    const result = await generateShoppingSnapshot('plan-001', USER_ID, deps({ mealPlanRepo }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError)
  })

  it('genera un snapshot con items agregados a partir de los slots COOK_AT_HOME', async () => {
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [
                makeMealAssignment({ recipe_id: RECIPE_CHICKEN_RICE.id, servings: RECIPE_CHICKEN_RICE.servings_min }),
              ],
            }),
          ],
        }),
      ],
    })
    const mealPlanRepo = mockMealPlanRepo({ findWithDetails: jest.fn().mockResolvedValue(ok(plan)) })
    const snapshotRepo = mockShoppingSnapshotRepo()

    const result = await generateShoppingSnapshot('plan-001', USER_ID, deps({ mealPlanRepo, snapshotRepo }))

    expect(result.ok).toBe(true)
    expect(snapshotRepo.generate).toHaveBeenCalledWith(
      USER_ID,
      'plan-001',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ ingredient_id: 'ing-chicken', total_quantity: 200 }),
      ]),
    )
  })

  it('ignora slots EAT_OUT/LEFTOVERS/SKIP al agregar ingredientes', async () => {
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({ slot_kind: 'EAT_OUT', assignments: [] }),
            makeSlotWithAssignments({ slot_kind: 'SKIP', assignments: [] }),
          ],
        }),
      ],
    })
    const mealPlanRepo = mockMealPlanRepo({ findWithDetails: jest.fn().mockResolvedValue(ok(plan)) })
    const snapshotRepo = mockShoppingSnapshotRepo()
    const recipeRepo = mockRecipeRepo({ findWithDetails: jest.fn() })

    await generateShoppingSnapshot('plan-001', USER_ID, deps({ mealPlanRepo, snapshotRepo, recipeRepo }))

    expect(recipeRepo.findWithDetails).not.toHaveBeenCalled()
    expect(snapshotRepo.generate).toHaveBeenCalledWith(USER_ID, 'plan-001', expect.any(String), [])
  })

  it('un plan sin asignaciones genera un snapshot con items vacíos (estado válido)', async () => {
    const plan = makeMealPlanWithDetails({ days: [] })
    const mealPlanRepo = mockMealPlanRepo({ findWithDetails: jest.fn().mockResolvedValue(ok(plan)) })
    const result = await generateShoppingSnapshot('plan-001', USER_ID, deps({ mealPlanRepo }))
    expect(result.ok).toBe(true)
  })

  it('deduplica recetas repetidas antes de cargarlas de Knowledge Base', async () => {
    const plan = makeMealPlanWithDetails({
      days: [
        makeDayWithSlots({
          slots: [
            makeSlotWithAssignments({
              slot_kind: 'COOK_AT_HOME',
              assignments: [
                makeMealAssignment({ id: 'a1', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 2 }),
                makeMealAssignment({ id: 'a2', recipe_id: RECIPE_CHICKEN_RICE.id, servings: 2 }),
              ],
            }),
          ],
        }),
      ],
    })
    const mealPlanRepo = mockMealPlanRepo({ findWithDetails: jest.fn().mockResolvedValue(ok(plan)) })
    const recipeRepo = mockRecipeRepo()

    await generateShoppingSnapshot('plan-001', USER_ID, deps({ mealPlanRepo, recipeRepo }))

    expect(recipeRepo.findWithDetails).toHaveBeenCalledTimes(1)
  })
})
