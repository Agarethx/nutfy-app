export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function percentage(part: number, total: number): number {
  if (total === 0) return 0
  return roundTo((part / total) * 100, 1)
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}
