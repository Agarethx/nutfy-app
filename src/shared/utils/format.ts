export function formatCalories(calories: number): string {
  return `${Math.round(calories)} kcal`
}

export function formatMacro(grams: number): string {
  return `${Math.round(grams)}g`
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)}kg`
  }
  return `${Math.round(grams)}g`
}

export function formatVolume(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`
  }
  return `${Math.round(ml)}ml`
}
