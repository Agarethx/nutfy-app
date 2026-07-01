import type { Result } from '@/shared/networking'
import { err } from '@/shared/networking'
import { NotFoundError } from '@/shared/types'
import type { IngredientWithDetails } from '../../domain/ingredient.types'
import type { IngredientRepository } from '../../infrastructure/repositories/ingredient.repository'

export async function getIngredient(
  id: string,
  repo: IngredientRepository,
): Promise<Result<IngredientWithDetails>> {
  const result = await repo.findWithDetails(id)
  if (!result.ok) return result

  if (!result.data) {
    return err(new NotFoundError('INGREDIENT_NOT_FOUND', id))
  }

  return result as Result<IngredientWithDetails>
}
