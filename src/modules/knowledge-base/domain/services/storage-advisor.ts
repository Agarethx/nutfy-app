import type { StorageMethodType } from '../shared.types'
import type { Ingredient, IngredientStorageRule } from '../ingredient.types'
import type { Recipe, RecipeStorageRule } from '../recipe.types'

// ─── StorageAdvisor ───────────────────────────────────────────────────────────
// Expone reglas de almacenamiento de ingredientes y recetas.
// Puro — no escribe, no notifica, no conoce el inventario del usuario.
// ADR-015: Exportable para uso en otros módulos (ej. Inventory, Meal Prep).

function toDays(duration: number, unit: IngredientStorageRule['duration_unit']): number {
  switch (unit) {
    case 'DAYS': return duration
    case 'WEEKS': return duration * 7
    case 'MONTHS': return duration * 30
  }
}

export const StorageAdvisor = {
  // Devuelve todas las reglas del ingrediente, ordenadas de mayor a menor duración.
  getStorageRulesForIngredient(rules: IngredientStorageRule[]): IngredientStorageRule[] {
    return [...rules].sort(
      (a, b) => toDays(b.max_duration, b.duration_unit) - toDays(a.max_duration, a.duration_unit),
    )
  },

  // Devuelve el método de almacenamiento que maximiza la duración.
  getBestStorageMethod(rules: IngredientStorageRule[]): IngredientStorageRule | null {
    const sorted = StorageAdvisor.getStorageRulesForIngredient(rules)
    return sorted[0] ?? null
  },

  // Devuelve la regla para un método específico, o null si no aplica.
  getStorageRuleForMethod(
    rules: IngredientStorageRule[],
    method: StorageMethodType,
  ): IngredientStorageRule | null {
    return rules.find((r) => r.storage_method.storage_type === method) ?? null
  },

  // Análogo a getStorageRulesForIngredient para recetas elaboradas.
  getStorageRulesForRecipe(rules: RecipeStorageRule[]): RecipeStorageRule[] {
    return [...rules].sort(
      (a, b) => toDays(b.max_duration, b.duration_unit) - toDays(a.max_duration, a.duration_unit),
    )
  },

  // Indica si el ingrediente puede congelarse.
  canFreeze(rules: IngredientStorageRule[]): boolean {
    return rules.some(
      (r) => r.storage_method.storage_type === 'FREEZER' || r.can_freeze,
    )
  },

  // Indica si el ingrediente está en temporada en el mes dado (o el mes actual).
  // Retorna true si months está vacío (disponible todo el año).
  isInSeason(ingredient: Ingredient, month?: number): boolean {
    const { months } = ingredient.seasonality
    if (months.length === 0) return true
    const targetMonth = month ?? new Date().getMonth() + 1
    return months.includes(targetMonth)
  },
}
