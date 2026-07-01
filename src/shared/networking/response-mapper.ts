import { AppError, DatabaseError, NetworkError } from '@/shared/types'
import { mapSupabaseError } from '@/shared/utils/supabase-error'
import { isNetworkError } from '@/shared/utils/is-network-error'

type SupabaseResponse<T> = {
  data: T | null
  error: { message: string; code?: string } | null
}

export function mapResponse<T>(response: SupabaseResponse<T>): T {
  if (response.error) {
    const { message, code } = response.error
    if (code) {
      const mapped = mapSupabaseError(code, message)
      if (mapped) throw mapped
    }
    throw new DatabaseError(message, code)
  }
  if (response.data === null) {
    throw new DatabaseError('Unexpected null response')
  }
  return response.data
}

export function mapNullableResponse<T>(
  response: SupabaseResponse<T>,
): T | null {
  if (response.error) {
    const { message, code } = response.error
    if (code === 'PGRST116') return null
    if (code) {
      const mapped = mapSupabaseError(code, message)
      if (mapped) throw mapped
    }
    throw new DatabaseError(message, code)
  }
  return response.data
}

export function wrapError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (isNetworkError(error)) return new NetworkError()
  if (error instanceof Error) return new DatabaseError(error.message)
  return new DatabaseError('Unknown error')
}
