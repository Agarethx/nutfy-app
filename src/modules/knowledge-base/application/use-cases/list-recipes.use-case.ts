import type { Result } from '@/shared/networking'
import type { Recipe, ListRecipesInput } from '../../domain/recipe.types'
import type { RecipeRepository } from '../../infrastructure/repositories/recipe.repository'

export async function listRecipes(
  input: ListRecipesInput,
  userId: string,
  repo: RecipeRepository,
): Promise<Result<Recipe[]>> {
  return repo.list(input, userId)
}
