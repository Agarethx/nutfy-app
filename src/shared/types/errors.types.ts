export type ErrorCode =
  | 'INGREDIENT_NOT_FOUND'
  | 'RECIPE_NOT_FOUND'
  | 'INVALID_UNIT_CONVERSION'
  | 'UNIT_CONVERSION_UNAVAILABLE'
  | 'NUTRITIONAL_DATA_INCOMPLETE'
  | 'RECIPE_REQUIRES_INGREDIENTS'
  | 'VARIATION_OVERRIDE_INVALID'
  | 'INVENTORY_ITEM_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'MEAL_PLAN_NOT_FOUND'
  | 'MEAL_SLOT_OCCUPIED'
  | 'MEAL_PLAN_INVALID_WEEK'
  | 'MEAL_PLAN_WEEK_ALREADY_PLANNED'
  | 'MEAL_SLOT_NOT_FOUND'
  | 'MEAL_ASSIGNMENT_NOT_FOUND'
  | 'RECIPE_NOT_ASSIGNABLE'
  | 'DATABASE_ERROR'
  | 'NETWORK_UNAVAILABLE'
  | 'STORAGE_ERROR'
  | 'STORAGE_LIMIT_EXCEEDED'
  | 'AUTH_REQUIRED'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_INSUFFICIENT_PERMISSIONS'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_EMAIL_ALREADY_REGISTERED'
  | 'AUTH_WEAK_PASSWORD'
  | 'AUTH_EMAIL_NOT_CONFIRMED'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly context?: Record<string, unknown>

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = context
  }
}

export class DomainError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(code, message, context)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends DomainError {
  constructor(code: ErrorCode, resourceId?: string) {
    super(code, `Resource not found: ${resourceId ?? 'unknown'}`, {
      resourceId,
    })
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends DomainError {
  readonly fields: Record<string, string[]>

  constructor(fields: Record<string, string[]>) {
    super('VALIDATION_ERROR', 'Validation failed', { fields })
    this.name = 'ValidationError'
    this.fields = fields
  }
}

export class BusinessRuleError extends DomainError {
  constructor(code: ErrorCode, message: string) {
    super(code, message)
    this.name = 'BusinessRuleError'
  }
}

export class DatabaseError extends AppError {
  readonly supabaseCode?: string

  constructor(message: string, supabaseCode?: string) {
    super('DATABASE_ERROR', message, { supabaseCode })
    this.name = 'DatabaseError'
    this.supabaseCode = supabaseCode
  }
}

export class NetworkError extends AppError {
  constructor() {
    super('NETWORK_UNAVAILABLE', 'Network request failed')
    this.name = 'NetworkError'
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super('STORAGE_ERROR', message)
    this.name = 'StorageError'
  }
}

export class AuthError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message)
    this.name = 'AuthError'
  }
}

export class UnauthenticatedError extends AuthError {
  constructor() {
    super('AUTH_REQUIRED', 'Authentication required')
    this.name = 'UnauthenticatedError'
  }
}

export class UnauthorizedError extends AuthError {
  constructor() {
    super('AUTH_INSUFFICIENT_PERMISSIONS', 'Insufficient permissions')
    this.name = 'UnauthorizedError'
  }
}
