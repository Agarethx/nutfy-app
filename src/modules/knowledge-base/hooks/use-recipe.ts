import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { RecipeRepository } from '../repositories/recipe.repository'
import { getRecipe } from '../application/use-cases/get-recipe.use-case'
import { queryKeys } from './query-keys'

const repo = new RecipeRepository(supabase)

export function useRecipe(id: string) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => getRecipe(id, repo).then(unwrap),
    enabled: !!id,
  })
}
