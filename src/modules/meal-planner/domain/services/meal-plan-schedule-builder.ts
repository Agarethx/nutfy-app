import type { MealType } from '../shared.types'
import type { MealDemandItem, MealPlanDayDraft, MealSlotDraft } from '../meal-plan.types'

// ─── MealPlanScheduleBuilder ──────────────────────────────────────────────────
// Construye el esqueleto de 7 días + slots vacíos a partir de una especificación
// de demanda ("5 almuerzos, 4 cenas, 2 comidas afuera"). Puro — no accede a la
// base de datos, no decide qué recetas asignar (eso es el motor de Fase 2).
//
// Lo que NO hace:
//   - No decide qué receta va en cada slot (MealAssignment se crea después,
//     manual o vía el motor de Fase 2).
//   - No valida constraints (HARD/SOFT) del plan — eso es responsabilidad del
//     futuro motor de asignación, que leerá MealPlanConstraint por separado.
//   - No valida que week_start_date sea lunes — esa invariante la valida el
//     use-case `createMealPlan` antes de llamar a este servicio (y la DB la
//     refuerza con un CHECK).
//   - No persiste nada — devuelve borradores (`MealPlanDayDraft`) sin id; el
//     repositorio es quien los inserta.

const MEAL_TYPE_ORDER: Record<MealType, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
}

// Reparte `count` ocurrencias lo más uniformemente posible entre `totalDays`
// días, devolviendo el índice de día (0-based) de cada ocurrencia en orden.
// Ej.: spreadIndices(5, 7) → [0, 1, 2, 4, 5] (evita amontonar al inicio).
// Si count > totalDays, algunos días reciben más de una ocurrencia.
function spreadIndices(count: number, totalDays: number): number[] {
  if (count <= 0) return []
  const indices: number[] = []
  for (let i = 0; i < count; i++) {
    indices.push(Math.floor((i * totalDays) / count))
  }
  return indices
}

// Suma días a una fecha ISO (YYYY-MM-DD) usando aritmética UTC para evitar
// desfases de zona horaria / horario de verano. Exportada porque duplicateMealPlan
// (infrastructure/repositories/meal-plan.repository.ts) necesita la misma
// aritmética para recalcular las fechas del plan copiado.
export function addDaysISO(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const utcMillis = Date.UTC(year, month - 1, day + days)
  return new Date(utcMillis).toISOString().slice(0, 10)
}

// Formato YYYY-MM-DD estricto. Usado por los use-cases de creación/duplicación
// antes de aceptar una fecha como week_start_date.
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// INV: week_start_date siempre es lunes (mismo criterio que el CHECK de DB
// `extract(dow from week_start_date) = 1`), calculado en UTC para no depender
// de la zona horaria del dispositivo.
export function isMonday(isoDate: string): boolean {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 1
}

export const MealPlanScheduleBuilder = {
  // Construye los 7 MealPlanDayDraft de la semana que empieza en weekStartDate,
  // con los slots que resultan de repartir cada item de demanda entre los días.
  build(weekStartDate: string, demand: MealDemandItem[]): MealPlanDayDraft[] {
    const totalDays = 7
    const slotsByDay: MealSlotDraft[][] = Array.from({ length: totalDays }, () => [])

    for (const item of demand) {
      const dayIndices = spreadIndices(item.count, totalDays)
      for (const dayIndex of dayIndices) {
        slotsByDay[dayIndex].push({
          meal_type: item.meal_type,
          slot_kind: item.slot_kind,
          target_servings: item.target_servings ?? 1,
          position: 0, // se recalcula al ordenar, ver abajo
        })
      }
    }

    return slotsByDay.map((slots, dayIndex) => {
      const ordered = [...slots].sort(
        (a, b) => MEAL_TYPE_ORDER[a.meal_type] - MEAL_TYPE_ORDER[b.meal_type],
      )
      return {
        date: addDaysISO(weekStartDate, dayIndex),
        position: dayIndex,
        slots: ordered.map((slot, position) => ({ ...slot, position })),
      }
    })
  },
}
