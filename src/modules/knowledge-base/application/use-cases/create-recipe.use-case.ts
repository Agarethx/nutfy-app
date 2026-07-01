import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { ValidationError } from '@/shared/types'
import type { Recipe, CreateRecipeInput } from '../../domain/recipe.types'
import type { RecipeRepository } from '../../infrastructure/repositories/recipe.repository'

// INV-07: Recipe tiene al menos 1 ingrediente y al menos 1 paso.
export async function createRecipe(
  input: CreateRecipeInput,
  userId: string,
  repo: RecipeRepository,
): Promise<Result<Recipe>> {
  const errors: Record<string, string[]> = {}

  if (!input.name || input.name.trim().length < 2) {
    errors.name = ['El nombre debe tener al menos 2 caracteres']
  }
  if (input.ingredients.length === 0) {
    errors.ingredients = ['La receta debe tener al menos 1 ingrediente']
  }
  if (input.steps.length === 0) {
    errors.steps = ['La receta debe tener al menos 1 paso']
  }
  if (input.servings_min > input.servings_max) {
    errors.servings = ['servings_min no puede ser mayor que servings_max']
  }

  if (Object.keys(errors).length > 0) {
    return err(new ValidationError(errors))
  }

  return repo.create(input, userId)
}
