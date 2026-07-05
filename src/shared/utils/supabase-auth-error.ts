import { isAuthApiError } from '@supabase/auth-js'
import { AppError, AuthError as AppAuthError } from '@/shared/types'

// Traduce errores del SDK de Supabase Auth (@supabase/auth-js) a la jerarquía de
// AppError del proyecto, siguiendo el mismo patrón que
// `shared/utils/supabase-error.ts` para errores de Postgres/PostgREST.
// `@supabase/auth-js` es una dependencia real (no peer) de `@supabase/supabase-js`
// — ver package.json de ese paquete — por eso es seguro importar directo de ahí
// en vez de esperar a que `@supabase/supabase-js` la re-exporte.
export function mapAuthError(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return new AppAuthError('AUTH_INVALID_CREDENTIALS', error.message)
      case 'user_already_exists':
        return new AppAuthError('AUTH_EMAIL_ALREADY_REGISTERED', error.message)
      case 'weak_password':
        return new AppAuthError('AUTH_WEAK_PASSWORD', error.message)
      case 'email_not_confirmed':
        return new AppAuthError('AUTH_EMAIL_NOT_CONFIRMED', error.message)
      default:
        return new AppAuthError('UNKNOWN_ERROR', error.message)
    }
  }

  if (error instanceof Error) return new AppAuthError('UNKNOWN_ERROR', error.message)
  return new AppAuthError('UNKNOWN_ERROR', 'Unknown auth error')
}
