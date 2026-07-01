import { AppError } from '@/shared/types'

export const logger = {
  debug: (message: string, context?: object) => {
    if (__DEV__) console.debug('[DEBUG]', message, context)
  },

  info: (message: string, context?: object) => {
    if (__DEV__) console.info('[INFO]', message, context)
  },

  warn: (message: string, context?: object) => {
    console.warn('[WARN]', message, context)
  },

  error: (error: unknown, context?: object) => {
    const message = error instanceof Error ? error.message : String(error)
    const code = error instanceof AppError ? error.code : 'UNKNOWN'
    const errorContext = error instanceof AppError ? error.context : undefined

    console.error('[ERROR]', { message, code, ...errorContext, ...context })
  },
}
