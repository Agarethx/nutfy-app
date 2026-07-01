import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types'
import { wrapError } from './response-mapper'

export type Supabase = SupabaseClient<Database>

export abstract class BaseRepository {
  constructor(protected readonly db: Supabase) {}

  protected async query<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      throw wrapError(error)
    }
  }
}
