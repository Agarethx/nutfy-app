import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { IngredientRepository } from '../repositories/ingredient.repository'
import { getIngredient } from '../application/use-cases/get-ingredient.use-case'
import { queryKeys } from './query-keys'

const repo = new IngredientRepository(supabase)

export function useIngredient(id: string) {
  return useQuery({
    queryKey: queryKeys.ingredients.detail(id),
    queryFn: () => getIngredient(id, repo).then(unwrap),
    enabled: !!id,
  })
}
