import { AppError, type ErrorCode } from '@/shared/types'

const errorMessages: Record<ErrorCode, string> = {
  INGREDIENT_NOT_FOUND: 'No encontramos este ingrediente.',
  RECIPE_NOT_FOUND: 'No encontramos esta receta.',
  INVALID_UNIT_CONVERSION: 'No se puede convertir entre estas unidades.',
  UNIT_CONVERSION_UNAVAILABLE:
    'Datos de conversión no disponibles para este ingrediente.',
  NUTRITIONAL_DATA_INCOMPLETE:
    'Datos nutricionales incompletos para algunos ingredientes.',
  RECIPE_REQUIRES_INGREDIENTS: 'La receta necesita al menos un ingrediente.',
  VARIATION_OVERRIDE_INVALID:
    'La variación referencia un ingrediente que no está en la receta.',
  INVENTORY_ITEM_NOT_FOUND: 'No encontramos este artículo en tu inventario.',
  INSUFFICIENT_STOCK: 'No tienes suficiente cantidad en tu inventario.',
  MEAL_PLAN_NOT_FOUND: 'No encontramos este plan de comidas.',
  MEAL_SLOT_OCCUPIED: 'Este espacio ya tiene una receta asignada.',
  MEAL_PLAN_INVALID_WEEK: 'La semana del plan no es válida.',
  MEAL_PLAN_WEEK_ALREADY_PLANNED: 'Ya tienes un plan para esta semana.',
  MEAL_SLOT_NOT_FOUND: 'No encontramos este espacio del plan.',
  MEAL_ASSIGNMENT_NOT_FOUND: 'No encontramos esta receta dentro del plan.',
  RECIPE_NOT_ASSIGNABLE: 'Esta receta ya no está disponible para planificar.',
  DATABASE_ERROR: 'Ocurrió un error al guardar los datos. Intenta de nuevo.',
  NETWORK_UNAVAILABLE: 'Sin conexión a internet. Verifica tu conexión.',
  STORAGE_ERROR: 'No se pudo guardar el archivo. Intenta de nuevo.',
  STORAGE_LIMIT_EXCEEDED: 'El archivo es demasiado grande.',
  AUTH_REQUIRED: 'Necesitas iniciar sesión para continuar.',
  AUTH_SESSION_EXPIRED: 'Tu sesión expiró. Inicia sesión de nuevo.',
  AUTH_INSUFFICIENT_PERMISSIONS: 'No tienes permiso para realizar esta acción.',
  AUTH_INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  AUTH_EMAIL_ALREADY_REGISTERED: 'Ya existe una cuenta con este correo.',
  AUTH_WEAK_PASSWORD: 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
  AUTH_EMAIL_NOT_CONFIRMED: 'Confirma tu correo antes de iniciar sesión.',
  VALIDATION_ERROR: 'Verifica los datos ingresados.',
  UNKNOWN_ERROR: 'Ocurrió un error inesperado. Intenta de nuevo.',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return errorMessages[error.code] ?? errorMessages.UNKNOWN_ERROR
  }
  return errorMessages.UNKNOWN_ERROR
}
