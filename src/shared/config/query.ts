import { QueryClient } from '@tanstack/react-query'
import { AppError, DomainError, AuthError } from '@/shared/types'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof DomainError) return false
          if (error instanceof AuthError) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
        onError: (error) => {
          if (!(error instanceof AppError)) {
            console.error('[QueryClient] Unhandled mutation error:', error)
          }
        },
      },
    },
  })
}
