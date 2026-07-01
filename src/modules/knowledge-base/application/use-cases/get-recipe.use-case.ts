import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { RecipeWithDetails } from '../../domain/recipe.types'
import type { RecipeRepository } from '../../infrastructure/repositories/recipe.repository'

export async function getRecipe(
  id: string,
  repo: RecipeRepository,
): Promise<Result<RecipeWithDetails>> {
  const result = await repo.findWithDetails(id)
  if (!result.ok) return result

  if (!result.data) {
    return err(new NotFoundError('RECIPE_NOT_FOUND', id))
  }

  return result as Result<RecipeWithDetails>
}
