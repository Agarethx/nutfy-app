import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { RecipeRepository } from '../repositories/recipe.repository'
import { listRecipes } from '../application/use-cases/list-recipes.use-case'
import type { ListRecipesInput } from '../domain/recipe.types'
import { queryKeys } from './query-keys'
import { useAuthStore } from '@/shared/stores'

const repo = new RecipeRepository(supabase)

export function useRecipes(input: ListRecipesInput = {}) {
  const userId = useAuthStore((s) => s.user?.id ?? '')

  return useQuery({
    queryKey: queryKeys.recipes.list(input),
    queryFn: () => listRecipes(input, userId, repo).then(unwrap),
    enabled: !!userId,
  })
}
