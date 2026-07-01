import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { IngredientRepository } from '../repositories/ingredient.repository'
import { searchIngredients } from '../application/use-cases/search-ingredients.use-case'
import { queryKeys } from './query-keys'

const repo = new IngredientRepository(supabase)

export function useSearchIngredients(query: string) {
  return useQuery({
    queryKey: queryKeys.ingredients.search(query),
    queryFn: () => searchIngredients(query, repo).then(unwrap),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  })
}
