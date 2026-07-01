import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { RecipeRepository } from '../repositories/recipe.repository'
import { createRecipe } from '../application/use-cases/create-recipe.use-case'
import type { CreateRecipeInput } from '../domain/recipe.types'
import { queryKeys } from './query-keys'
import { useAuthStore } from '@/shared/stores'

const repo = new RecipeRepository(supabase)

export function useCreateRecipe() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useMutation({
    mutationFn: (input: CreateRecipeInput) =>
      createRecipe(input, userId, repo).then(unwrap),
    onSuccess: (data) => {
      // Seed detail cache para navegación inmediata al detalle
      queryClient.setQueryData(queryKeys.recipes.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}
