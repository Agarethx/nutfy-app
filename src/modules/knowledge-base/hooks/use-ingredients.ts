import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { IngredientRepository } from '../repositories/ingredient.repository'
import { listIngredients } from '../application/use-cases/list-ingredients.use-case'
import type { ListIngredientsInput } from '../domain/ingredient.types'
import { queryKeys } from './query-keys'

const repo = new IngredientRepository(supabase)

export function useIngredients(input: ListIngredientsInput = {}) {
  return useQuery({
    queryKey: queryKeys.ingredients.list(input),
    queryFn: () => listIngredients(input, repo).then(unwrap),
  })
}
