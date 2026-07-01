import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { RecipeRepository } from '../repositories/recipe.repository'
import { updateRecipe } from '../application/use-cases/update-recipe.use-case'
import type { UpdateRecipeInput, RecipeWithDetails } from '../domain/recipe.types'
import { queryKeys } from './query-keys'
import { useAuthStore } from '@/shared/stores'

const repo = new RecipeRepository(supabase)

export function useUpdateRecipe(recipeId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useMutation({
    mutationFn: (input: UpdateRecipeInput) =>
      updateRecipe(recipeId, input, userId, repo).then(unwrap),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recipes.detail(recipeId) })
      const previous = queryClient.getQueryData<RecipeWithDetails>(
        queryKeys.recipes.detail(recipeId),
      )
      if (previous) {
        queryClient.setQueryData<RecipeWithDetails>(queryKeys.recipes.detail(recipeId), {
          ...previous,
          ...input,
          updated_at: new Date().toISOString(),
        })
      }
      return { previous }
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.recipes.detail(recipeId), context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}
