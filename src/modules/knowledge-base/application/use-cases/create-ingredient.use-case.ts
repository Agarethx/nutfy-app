import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { ValidationError } from '@/shared/types'
import type { Ingredient, CreateIngredientInput } from '../../domain/ingredient.types'
import type { IngredientRepository } from '../../infrastructure/repositories/ingredient.repository'

// INV-01: non-negative; INV-02: sugar_g ≤ carbs_g; INV-03: sat_fat ≤ fat
export async function createIngredient(
  input: CreateIngredientInput,
  repo: IngredientRepository,
): Promise<Result<Ingredient>> {
  const errors: Record<string, string[]> = {}

  if (!input.name || input.name.trim().length < 2) {
    errors.name = ['El nombre debe tener al menos 2 caracteres']
  }

  if (input.nutrition) {
    const { sugar_g, carbs_g, fat_g, saturated_fat_g } = input.nutrition

    if (sugar_g != null && carbs_g != null && sugar_g > carbs_g) {
      errors['nutrition.sugar_g'] = ['El azúcar no puede superar los carbohidratos totales']
    }
    if (saturated_fat_g != null && fat_g != null && saturated_fat_g > fat_g) {
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

  return repo.create(input)
}
