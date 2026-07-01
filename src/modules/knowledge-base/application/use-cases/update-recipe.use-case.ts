import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { NotFoundError, ValidationError } from '@/shared/types'
import type { Recipe, UpdateRecipeInput } from '../../domain/recipe.types'
import type { RecipeRepository } from '../../infrastructure/repositories/recipe.repository'

export async function updateRecipe(
  id: string,
  input: UpdateRecipeInput,
  userId: string,
  repo: RecipeRepository,
): Promise<Result<Recipe>> {
  // Verificar que la receta existe y pertenece al usuario
  const existing = await repo.findById(id)
  if (!existing.ok) return existing
  if (!existing.data) return err(new NotFoundError('RECIPE_NOT_FOUND', id))
  if (existing.data.user_id !== userId) {
    return err(new NotFoundError('RECIPE_NOT_FOUND', id))
  }
  if (existing.data.status === 'DEPRECATED') {
    return err(new ValidationError({ status: ['No se puede editar una receta deprecada'] }))
  }

  const errors: Record<string, string[]> = {}
  if (input.name !== undefined && input.name.trim().length < 2) {
    errors.name = ['El nombre debe tener al menos 2 caracteres']
  }
  if (
    input.servings_min !== undefined &&
    input.servings_max !== undefined &&
    input.servings_min > input.servings_max
  ) {
    errors.servings = ['servings_min no puede ser mayor que servings_max']
  }

  if (Object.keys(errors).length > 0) {
    return err(new ValidationError(errors))
  }

  return repo.update(id, input)
}
