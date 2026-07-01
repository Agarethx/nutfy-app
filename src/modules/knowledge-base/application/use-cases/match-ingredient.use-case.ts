import type { Result } from '@/shared/networking'
import { ok, err } from '@/shared/networking'
import { ValidationError } from '@/shared/types'
import { IngredientTextParser } from '../../domain/services/ingredient-text-parser'
import type { IngredientRepository } from '../../infrastructure/repositories/ingredient.repository'

export type IngredientMatchConfidence = 'high' | 'medium' | 'low'

export type IngredientMatchResult = {
  ingredient_id: string
  quantity: number | null
  unit: string | null
  preparation: string | null
  confidence: IngredientMatchConfidence
  matched: boolean
}

// Umbrales calibrados empíricamente contra match_ingredients() (similarity
// trigram + unaccent). Ver comentarios en la migración
// 20260629000009_knowledge_base_create_ingredient_aliases.sql.
const HIGH_SIMILARITY_THRESHOLD = 0.6
const MEDIUM_SIMILARITY_THRESHOLD = 0.35

function confidenceForScore(score: number): IngredientMatchConfidence {
  if (score >= HIGH_SIMILARITY_THRESHOLD) return 'high'
  if (score >= MEDIUM_SIMILARITY_THRESHOLD) return 'medium'
  return 'low'
}

function capitalize(name: string): string {
  return name.length === 0 ? name : name[0].toUpperCase() + name.slice(1)
}

// Convierte una línea de receta en texto libre ("2 tomates grandes picados")
// en un ingrediente interno: limpia el texto, extrae cantidad/unidad/
// preparación, y busca coincidencia difusa en el catálogo (nombre, traducciones
// y alias). Si no hay ningún candidato por encima del umbral mínimo de
// match_ingredients(), crea un ingrediente nuevo PENDING_REVIEW con
// confidence baja en lugar de adivinar — nunca crea duplicados porque solo
// crea cuando la búsqueda no devolvió ningún candidato.
export async function matchIngredientLine(
  rawText: string,
  repo: IngredientRepository,
): Promise<Result<IngredientMatchResult>> {
  const parsed = IngredientTextParser.parse(rawText)

  if (parsed.cleanedName.length === 0) {
    return err(
      new ValidationError({
        input: ['No se pudo extraer un nombre de ingrediente del texto'],
      }),
    )
  }

  const candidatesResult = await repo.matchCandidates(parsed.cleanedName)
  if (!candidatesResult.ok) return candidatesResult

  const [best] = candidatesResult.data

  if (best) {
    return ok({
      ingredient_id: best.ingredient_id,
      quantity: parsed.quantity,
      unit: parsed.unit,
      preparation: parsed.preparation,
      confidence: confidenceForScore(best.score),
      matched: true,
    })
  }

  const createResult = await repo.create({
    name: capitalize(parsed.cleanedName),
  })
  if (!createResult.ok) return createResult

  return ok({
    ingredient_id: createResult.data.id,
    quantity: parsed.quantity,
    unit: parsed.unit,
    preparation: parsed.preparation,
    confidence: 'low',
    matched: false,
  })
}

// Procesa varias líneas de una misma receta. Deliberadamente SECUENCIAL (no
// Promise.all): si dos líneas distintas normalizan al mismo nombre y ninguna
// existe todavía, la segunda debe encontrar el ingrediente que acaba de crear
// la primera en vez de crear un duplicado en paralelo.
export async function matchIngredientLines(
  rawLines: string[],
  repo: IngredientRepository,
): Promise<Result<IngredientMatchResult[]>> {
  const results: IngredientMatchResult[] = []

  for (const line of rawLines) {
    const result = await matchIngredientLine(line, repo)
    if (!result.ok) return result
    results.push(result.data)
  }

  return ok(results)
}
