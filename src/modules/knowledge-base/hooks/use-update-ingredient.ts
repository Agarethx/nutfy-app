import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { IngredientRepository } from '../repositories/ingredient.repository'
import { updateIngredient } from '../application/use-cases/update-ingredient.use-case'
import type { UpdateIngredientInput, Ingredient } from '../domain/ingredient.types'
import { queryKeys } from './query-keys'

const repo = new IngredientRepository(supabase)

export function useUpdateIngredient(ingredientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateIngredientInput) =>
      updateIngredient(ingredientId, input, repo).then(unwrap),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ingredients.detail(ingredientId) })
      const previous = queryClient.getQueryData<Ingredient>(
        queryKeys.ingredients.detail(ingredientId),
      )
      if (previous) {
        queryClient.setQueryData<Ingredient>(queryKeys.ingredients.detail(ingredientId), {
          ...previous,
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.category_id !== undefined && { category_id: input.category_id }),
          ...(input.subcategory_id !== undefined && { subcategory_id: input.subcategory_id }),
          ...(input.default_unit_id !== undefined && { default_unit_id: input.default_unit_id }),
          ...(input.countries !== undefined && { countries: input.countries }),
          ...(input.seasonality_months !== undefined && {
            seasonality: { months: input.seasonality_months },
          }),
          ...(input.nutrition !== undefined && {
            nutrition: { ...previous.nutrition, ...input.nutrition },
          }),
          updated_at: new Date().toISOString(),
        })
      }
      return { previous }
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.ingredients.detail(ingredientId), context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.detail(ingredientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all })
    },
  })
}
