import { NetworkError } from '@/shared/types'

export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true
  if (error instanceof TypeError && error.message.includes('fetch')) return true
  if (
    error instanceof Error &&
    error.message.includes('Network request failed')
  )
    return true
  return false
}
