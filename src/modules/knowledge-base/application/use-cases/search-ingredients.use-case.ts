import type { Result } from '@/shared/networking'
import type { Ingredient } from '../../domain/ingredient.types'
import type { IngredientRepository } from '../../infrastructure/repositories/ingredient.repository'

export async function searchIngredients(
  query: string,
  repo: IngredientRepository,
  limit = 20,
): Promise<Result<Ingredient[]>> {
  if (query.trim().length < 2) {
    return { ok: true, data: [] }
  }
  return repo.search(query.trim(), limit)
}
