import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { RecipeRepository } from '../repositories/recipe.repository'
import { StorageRepository } from '../repositories/storage.repository'
import { calculateRecipeNutrition } from '../application/use-cases/calculate-recipe-nutrition.use-case'
import { queryKeys } from './query-keys'

const recipeRepo = new RecipeRepository(supabase)
const storageRepo = new StorageRepository(supabase)

export function useRecipeNutrition(recipeId: string, servings?: number) {
  return useQuery({
    queryKey: [...queryKeys.recipes.detail(recipeId), 'nutrition', servings] as const,
    queryFn: () =>
      calculateRecipeNutrition(recipeId, recipeRepo, storageRepo, servings).then(unwrap),
    enabled: !!recipeId,
  })
}
