import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/services/supabase'
import { unwrap } from '@/shared/networking'
import { StorageRepository } from '../repositories/storage.repository'
import { queryKeys } from './query-keys'

const repo = new StorageRepository(supabase)

export function useUnits() {
  return useQuery({
    queryKey: queryKeys.units.list(),
    queryFn: () => repo.listUnits().then(unwrap),
    staleTime: 10 * 60_000,
  })
}
