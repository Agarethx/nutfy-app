import {
  AppError,
  DatabaseError,
  UnauthenticatedError,
  UnauthorizedError,
} from '@/shared/types'

export function mapSupabaseError(
  code: string,
  message: string,
): AppError | null {
  switch (code) {
    case 'PGRST116':
      return null
    case '23505':
      return new DatabaseError('Duplicate entry', code)
    case '23503':
      return new DatabaseError('Referenced record not found', code)
    case 'PGRST301':
      return new UnauthenticatedError()
    case '42501':
      return new UnauthorizedError()
    default:
      return new DatabaseError(message, code)
  }
}
