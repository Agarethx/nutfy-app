import type { ListIngredientsInput } from '../domain/ingredient.types'
import type { ListRecipesInput } from '../domain/recipe.types'

export const queryKeys = {
  all: ['kb'] as const,

  ingredients: {
    all: ['kb', 'ingredient'] as const,
    list: (input: ListIngredientsInput = {}) => ['kb', 'ingredient', 'list', input] as const,
    search: (q: string) => ['kb', 'ingredient', 'search', q] as const,
    detail: (id: string) => ['kb', 'ingredient', 'detail', id] as const,
    bySlug: (slug: string) => ['kb', 'ingredient', 'slug', slug] as const,
  },

  categories: {
    all: ['kb', 'category'] as const,
    list: () => ['kb', 'category', 'list'] as const,
    subcategories: (categoryId?: string) =>
      ['kb', 'category', 'subcategories', categoryId ?? 'all'] as const,
  },

  recipes: {
    all: ['kb', 'recipe'] as const,
    list: (input: ListRecipesInput = {}) => ['kb', 'recipe', 'list', input] as const,
    detail: (id: string) => ['kb', 'recipe', 'detail', id] as const,
  },

  units: {
    all: ['kb', 'unit'] as const,
    list: () => ['kb', 'unit', 'list'] as const,
    conversions: () => ['kb', 'unit', 'conversions'] as const,
  },

  storageMethods: {
    all: ['kb', 'storage-method'] as const,
    list: () => ['kb', 'storage-method', 'list'] as const,
  },
} as const
