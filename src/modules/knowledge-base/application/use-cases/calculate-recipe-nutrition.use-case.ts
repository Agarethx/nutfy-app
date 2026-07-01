import type { Result } from '@/shared/networking'
import { ok, err } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { NutritionalInfo } from '../../domain/shared.types'
import { NutritionCalculator } from '../../domain/services/nutrition-calculator'
import type { RecipeRepository } from '../../infrastructure/repositories/recipe.repository'
import type { StorageRepository } from '../../infrastructure/repositories/storage.repository'

export async function calculateRecipeNutrition(
  recipeId: string,
  recipeRepo: RecipeRepository,
  storageRepo: StorageRepository,
  servings?: number,
): Promise<Result<NutritionalInfo>> {
  const [recipeResult, unitsResult, conversionsResult] = await Promise.all([
    recipeRepo.findWithDetails(recipeId),
    storageRepo.listUnits(),
    storageRepo.listUnitConversions(),
  ])

  if (!recipeResult.ok) return recipeResult
  if (!unitsResult.ok) return unitsResult
  if (!conversionsResult.ok) return conversionsResult

  if (!recipeResult.data) {
    return err(new NotFoundError('RECIPE_NOT_FOUND', recipeId))
  }

  const recipe = recipeResult.data
  const nutrition = NutritionCalculator.calculateForRecipe(
    recipe,
    recipe.ingredients,
    unitsResult.data,
    conversionsResult.data,
    servings,
  )

  return ok(nutrition)
}
