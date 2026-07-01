import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { NotFoundError, ValidationError } from '@/shared/types'
import type { Ingredient, UpdateIngredientInput } from '../../domain/ingredient.types'
import type { IngredientRepository } from '../../infrastructure/repositories/ingredient.repository'

export async function updateIngredient(
  id: string,
  input: UpdateIngredientInput,
  repo: IngredientRepository,
): Promise<Result<Ingredient>> {
  const existing = await repo.findById(id)
  if (!existing.ok) return existing
  if (!existing.data) return err(new NotFoundError('INGREDIENT_NOT_FOUND', id))

  if (existing.data.is_system) {
    return err(new ValidationError({ id: ['No se puede editar un ingrediente del sistema'] }))
  }
  if (existing.data.status === 'DEPRECATED') {
    return err(new ValidationError({ status: ['No se puede editar un ingrediente deprecado'] }))
  }

  const errors: Record<string, string[]> = {}

  if (input.name !== undefined && input.name.trim().length < 2) {
    errors.name = ['El nombre debe tener al menos 2 caracteres']
  }

  if (input.nutrition) {
    const { sugar_g, carbs_g, fat_g, saturated_fat_g } = input.nutrition
    // Merge with existing values to validate combined state
    const effectiveCarbs = carbs_g ?? existing.data.nutrition.carbs_g
    const effectiveFat = fat_g ?? existing.data.nutrition.fat_g

    if (sugar_g != null && effectiveCarbs != null && sugar_g > effectiveCarbs) {
      errors['nutrition.sugar_g'] = ['El azúcar no puede superar los carbohidratos totales']
    }
    if (saturated_fat_g != null && effectiveFat != null && saturated_fat_g > effectiveFat) {
      errors['nutrition.saturated_fat_g'] = ['La grasa saturada no puede superar la grasa total']
    }

    const numericFields = [
      'calories_kcal', 'protein_g', 'carbs_g', 'sugar_g',
      'fiber_g', 'fat_g', 'saturated_fat_g', 'sodium_mg',
    ] as const
    for (const field of numericFields) {
      const val = input.nutrition[field]
      if (typeof val === 'number' && val < 0) {
        errors[`nutrition.${field}`] = ['Los valores nutricionales no pueden ser negativos']
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return err(new ValidationError(errors))
  }

  return repo.update(id, input)
}
