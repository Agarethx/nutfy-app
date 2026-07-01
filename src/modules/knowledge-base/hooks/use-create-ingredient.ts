import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { IngredientRepository } from '../repositories/ingredient.repository'
import { createIngredient } from '../application/use-cases/create-ingredient.use-case'
import type { CreateIngredientInput } from '../domain/ingredient.types'
import { queryKeys } from './query-keys'

const repo = new IngredientRepository(supabase)

export function useCreateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateIngredientInput) =>
      createIngredient(input, repo).then(unwrap),
    onSuccess: (data) => {
      // Seed detail cache para navegación inmediata
      queryClient.setQueryData(queryKeys.ingredients.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all })
    },
  })
}
