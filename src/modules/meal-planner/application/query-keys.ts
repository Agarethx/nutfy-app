import type { ListMealPlansInput } from '../domain/meal-plan.types'

// Sin hooks todavía (Fase 5 de esta iteración es solo dominio/persistencia) —
// se define ya para que la UI de Fase 2 no tenga que introducir esta capa
// después, siguiendo la convención de knowledge-base/hooks/query-keys.ts.
export const queryKeys = {
  all: ['meal-plans'] as const,

  mealPlans: {
    all: ['meal-plans', 'plan'] as const,
    list: (input: ListMealPlansInput = {}) => ['meal-plans', 'plan', 'list', input] as const,
    detail: (id: string) => ['meal-plans', 'plan', 'detail', id] as const,
    currentWeek: () => ['meal-plans', 'plan', 'current-week'] as const,
  },

  shoppingSnapshots: {
    all: ['meal-plans', 'shopping-snapshot'] as const,
    active: (mealPlanId: string) => ['meal-plans', 'shopping-snapshot', 'active', mealPlanId] as const,
  },
} as const
