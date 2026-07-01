import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { CategoryRepository } from '../repositories/category.repository'
import { queryKeys } from './query-keys'

const repo = new CategoryRepository(supabase)

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => repo.listCategories().then(unwrap),
    staleTime: 5 * 60_000,
  })
}

export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: queryKeys.categories.subcategories(categoryId),
    queryFn: () => repo.listSubcategories(categoryId).then(unwrap),
    staleTime: 5 * 60_000,
  })
}
