import type { Unit, UnitConversion, Ingredient, RecipeWithDetails } from '@/modules/knowledge-base'
import { ok } from '@/shared/networking'
import type {
  MealPlan,
  MealPlanDay,
  MealSlot,
  MealAssignment,
  MealPlanConstraint,
  MealPlanWithDetails,
  MealSlotWithAssignments,
  MealPlanDayWithSlots,
  CreateMealPlanInput,
} from '../domain/meal-plan.types'
import type { MealPlanRepository } from '../infrastructure/repositories/meal-plan.repository'
import type { ShoppingSnapshotRepository } from '../infrastructure/repositories/shopping-snapshot.repository'

// ─── Constantes ───────────────────────────────────────────────────────────────

export const USER_ID = 'user-001'
export const OTHER_USER_ID = 'user-002'
export const WEEK_START_DATE = '2026-06-29' // lunes (verificado: getUTCDay() === 1)

// ─── Units (mínimos, para MealPlanIngredientAggregator/StatisticsCalculator) ──

export const UNIT_G: Unit = {
  id: 'unit-g',
  name: 'Gram',
  abbreviation: 'g',
  unit_type: 'WEIGHT',
  system: 'METRIC',
  base_unit_id: null,
  to_base_factor: null,
  status: 'ACTIVE',
}

export const UNIT_KG: Unit = {
  id: 'unit-kg',
  name: 'Kilogram',
  abbreviation: 'kg',
  unit_type: 'WEIGHT',
  system: 'METRIC',
  base_unit_id: 'unit-g',
  to_base_factor: 1000,
  status: 'ACTIVE',
}

export const ALL_UNITS: Unit[] = [UNIT_G, UNIT_KG]
export const GLOBAL_CONVERSIONS: UnitConversion[] = [
  { id: 'conv-kg-g', from_unit: 'unit-kg', to_unit: 'unit-g', factor: 1000 },
]

// ─── Ingredients mínimos ──────────────────────────────────────────────────────

export function makeIngredient(overrides: Partial<Ingredient> & { id: string; name: string; slug: string }): Ingredient {
  return {
    description: null,
    category_id: null,
    subcategory_id: null,
    default_unit_id: UNIT_G.id,
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
    is_system: true,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deprecated_at: null,
    ...overrides,
  }
}

export const INGREDIENT_CHICKEN = makeIngredient({
  id: 'ing-chicken',
  name: 'Chicken Breast',
  slug: 'chicken-breast',
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

export const INGREDIENT_RICE = makeIngredient({
  id: 'ing-rice',
  name: 'White Rice',
  slug: 'white-rice',
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

// ─── Recipes mínimas (RecipeWithDetails) ─────────────────────────────────────

export function makeRecipeWithDetails(
  overrides: Partial<RecipeWithDetails> & { id: string; name: string; slug: string },
): RecipeWithDetails {
  return {
    user_id: USER_ID,
    description: null,
    image_url: null,
    servings_min: 2,
    servings_max: 4,
    prep_time_min: 10,
    cook_time_min: 20,
    rest_time_min: null,
    difficulty: 'MEDIUM',
    cooking_methods: [],
    source_url: null,
    notes: null,
    is_public: false,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deprecated_at: null,
    ingredients: [
      {
        id: 'ri-001',
        recipe_id: overrides.id,
        ingredient_id: INGREDIENT_CHICKEN.id,
        ingredient: INGREDIENT_CHICKEN,
        unit_id: UNIT_G.id,
        unit: UNIT_G,
        quantity: 200,
        is_optional: false,
        notes: null,
      },
    ],
    steps: [],
    variations: [],
    storage_rules: [],
    attributes: [],
    ...overrides,
  }
}

export const RECIPE_CHICKEN_RICE = makeRecipeWithDetails({
  id: 'rec-001',
  name: 'Chicken and Rice',
  slug: 'chicken-and-rice',
  servings_min: 2,
  cook_time_min: 25,
  ingredients: [
    {
      id: 'ri-001',
      recipe_id: 'rec-001',
      ingredient_id: INGREDIENT_CHICKEN.id,
      ingredient: INGREDIENT_CHICKEN,
      unit_id: UNIT_G.id,
      unit: UNIT_G,
      quantity: 200,
      is_optional: false,
      notes: null,
    },
    {
      id: 'ri-002',
      recipe_id: 'rec-001',
      ingredient_id: INGREDIENT_RICE.id,
      ingredient: INGREDIENT_RICE,
      unit_id: UNIT_G.id,
      unit: UNIT_G,
      quantity: 150,
      is_optional: false,
      notes: null,
    },
  ],
})

export const RECIPE_DEPRECATED = makeRecipeWithDetails({
  id: 'rec-dep',
  name: 'Old Recipe',
  slug: 'old-recipe',
  status: 'DEPRECATED',
  deprecated_at: '2026-01-15T00:00:00Z',
})

// ─── MealPlan y miembros ──────────────────────────────────────────────────────

export function makeMealPlan(overrides?: Partial<MealPlan>): MealPlan {
  return {
    id: 'plan-001',
    user_id: USER_ID,
    name: 'Semana del 29 de junio',
    week_start_date: WEEK_START_DATE,
    status: 'DRAFT',
    notes: null,
    created_at: '2026-06-28T00:00:00Z',
    updated_at: '2026-06-28T00:00:00Z',
    deleted_at: null,
    ...overrides,
  }
}

export function makeMealPlanDay(overrides?: Partial<MealPlanDay>): MealPlanDay {
  return {
    id: 'day-001',
    meal_plan_id: 'plan-001',
    date: WEEK_START_DATE,
    position: 0,
    ...overrides,
  }
}

export function makeMealSlot(overrides?: Partial<MealSlot>): MealSlot {
  return {
    id: 'slot-001',
    meal_plan_day_id: 'day-001',
    meal_type: 'lunch',
    slot_kind: 'COOK_AT_HOME',
    target_servings: 2,
    position: 0,
    notes: null,
    ...overrides,
  }
}

export function makeMealAssignment(overrides?: Partial<MealAssignment>): MealAssignment {
  return {
    id: 'assign-001',
    meal_slot_id: 'slot-001',
    recipe_id: RECIPE_CHICKEN_RICE.id,
    servings: 2,
    source: 'MANUAL',
    position: 0,
    ...overrides,
  }
}

export function makeMealPlanConstraint(overrides?: Partial<MealPlanConstraint>): MealPlanConstraint {
  return {
    id: 'constraint-001',
    meal_plan_id: 'plan-001',
    constraint_type: 'MAX_COOK_TIME_MIN',
    hardness: 'HARD',
    numeric_value: 120,
    macro_goal_value: null,
    text_value: null,
    ...overrides,
  }
}

export function makeSlotWithAssignments(
  overrides?: Partial<MealSlotWithAssignments>,
): MealSlotWithAssignments {
  return { ...makeMealSlot(), assignments: [], ...overrides }
}

export function makeDayWithSlots(overrides?: Partial<MealPlanDayWithSlots>): MealPlanDayWithSlots {
  return { ...makeMealPlanDay(), slots: [], ...overrides }
}

export function makeMealPlanWithDetails(overrides?: Partial<MealPlanWithDetails>): MealPlanWithDetails {
  return {
    ...makeMealPlan(),
    days: [makeDayWithSlots({ slots: [makeSlotWithAssignments()] })],
    constraints: [],
    ...overrides,
  }
}

export function makeCreateMealPlanInput(overrides?: Partial<CreateMealPlanInput>): CreateMealPlanInput {
  return {
    name: 'Mi semana',
    week_start_date: WEEK_START_DATE,
    demand: [
      { meal_type: 'lunch', slot_kind: 'COOK_AT_HOME', count: 5 },
      { meal_type: 'dinner', slot_kind: 'COOK_AT_HOME', count: 4 },
      { meal_type: 'dinner', slot_kind: 'EAT_OUT', count: 2 },
    ],
    ...overrides,
  }
}

// ─── Fakes de repositorio ─────────────────────────────────────────────────────

export function mockMealPlanRepo(overrides?: Partial<MealPlanRepository>): MealPlanRepository {
  return {
    findById: jest.fn().mockResolvedValue(ok(makeMealPlan())),
    findWithDetails: jest.fn().mockResolvedValue(ok(makeMealPlanWithDetails())),
    findByWeek: jest.fn().mockResolvedValue(ok(null)),
    list: jest.fn().mockResolvedValue(ok([])),
    create: jest.fn().mockResolvedValue(ok(makeMealPlanWithDetails())),
    duplicate: jest.fn().mockResolvedValue(ok(makeMealPlanWithDetails())),
    update: jest.fn().mockResolvedValue(ok(makeMealPlan())),
    softDelete: jest.fn().mockResolvedValue(ok(undefined)),
    findSlotWithOwner: jest.fn().mockResolvedValue(
      ok({ slot: makeMealSlot(), mealPlanId: 'plan-001', ownerId: USER_ID }),
    ),
    findAssignmentBySlotAndRecipe: jest.fn().mockResolvedValue(ok(null)),
    createAssignment: jest.fn().mockResolvedValue(ok(makeMealAssignment())),
    findAssignmentWithOwner: jest.fn().mockResolvedValue(
      ok({ assignment: makeMealAssignment(), mealPlanId: 'plan-001', ownerId: USER_ID }),
    ),
    updateAssignmentServings: jest.fn().mockResolvedValue(ok(makeMealAssignment())),
    deleteAssignment: jest.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  } as unknown as MealPlanRepository
}

export function mockShoppingSnapshotRepo(
  overrides?: Partial<ShoppingSnapshotRepository>,
): ShoppingSnapshotRepository {
  return {
    findActiveByPlan: jest.fn().mockResolvedValue(ok(null)),
    generate: jest.fn().mockResolvedValue(
      ok({
        id: 'snap-001',
        meal_plan_id: 'plan-001',
        user_id: USER_ID,
        version: 1,
        status: 'ACTIVE',
        plan_signature: 'sig',
        generated_at: '2026-06-28T00:00:00Z',
        items: [],
      }),
    ),
    ...overrides,
  } as unknown as ShoppingSnapshotRepository
}

// Fake mínimo de KB RecipeRepository — solo los métodos que meal-planner consume.
export function mockRecipeRepo(overrides?: Record<string, jest.Mock>) {
  return {
    findById: jest.fn().mockResolvedValue(ok(RECIPE_CHICKEN_RICE)),
    findWithDetails: jest.fn().mockResolvedValue(ok(RECIPE_CHICKEN_RICE)),
    ...overrides,
  }
}

// Fake mínimo de KB StorageRepository — solo los métodos que meal-planner consume.
export function mockStorageRepo(overrides?: Record<string, jest.Mock>) {
  return {
    listUnits: jest.fn().mockResolvedValue(ok(ALL_UNITS)),
    listUnitConversions: jest.fn().mockResolvedValue(ok(GLOBAL_CONVERSIONS)),
    ...overrides,
  }
}
