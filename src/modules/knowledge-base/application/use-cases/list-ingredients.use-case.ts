import type { Result } from '@/shared/networking'
import type { Ingredient, ListIngredientsInput } from '../../domain/ingredient.types'
import type { IngredientRepository } from '../../infrastructure/repositories/ingredient.repository'

export async function listIngredients(
  input: ListIngredientsInput,
  repo: IngredientRepository,
): Promise<Result<Ingredient[]>> {
  return repo.list(input)
}
