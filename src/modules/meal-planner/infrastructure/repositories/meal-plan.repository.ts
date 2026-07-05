import { BaseRepository, mapResponse, mapNullableResponse, wrapError, ok, err } from '@/shared/networking'
import type { Result } from '@/shared/networking'
import type { Tables } from '@/shared/types/database.types'
import {
  mapMealPlan,
  mapMealPlanDay,
  mapMealSlot,
  mapMealAssignment,
  mapMealPlanConstraint,
} from '../mappers/meal-plan.mapper'
import { addDaysISO } from '../../domain/services/meal-plan-schedule-builder'
import type {
  MealPlan,
  MealPlanWithDetails,
  MealPlanDayDraft,
  MealPlanConstraint,
  MealSlot,
  MealAssignment,
  CreateMealPlanConstraintInput,
  UpdateMealPlanInput,
  ListMealPlansInput,
} from '../../domain/meal-plan.types'
import type { AssignmentSource } from '../../domain/shared.types'

type MealPlanRow = Tables<'meal_plans'>
type MealPlanDayRow = Tables<'meal_plan_days'>
type MealSlotRow = Tables<'meal_slots'>
type MealAssignmentRow = Tables<'meal_assignments'>
type MealPlanConstraintRow = Tables<'meal_plan_constraints'>

// Contexto de propiedad resuelto vía join hasta la raíz del agregado. Usado
// por los use-cases de asignación para validar ownership sin cargar el plan
// completo (findWithDetails sería más costoso para una sola operación puntual).
export type SlotOwnerContext = { slot: MealSlot; mealPlanId: string; ownerId: string }
export type AssignmentOwnerContext = { assignment: MealAssignment; mealPlanId: string; ownerId: string }

function buildConstraintInsert(mealPlanId: string, c: CreateMealPlanConstraintInput) {
  const hardness = c.hardness ?? ('SOFT' as const)

  if (c.constraint_type === 'MACRO_GOAL') {
    return {
      meal_plan_id: mealPlanId,
      constraint_type: c.constraint_type,
      hardness,
      macro_goal_value: c.macro_goal_value,
      numeric_value: null,
      text_value: null,
    }
  }
  if (c.constraint_type === 'PREFER_CUISINE') {
    return {
      meal_plan_id: mealPlanId,
      constraint_type: c.constraint_type,
      hardness,
      text_value: c.text_value,
      numeric_value: null,
      macro_goal_value: null,
    }
  }
  if (c.constraint_type === 'AVOID_INGREDIENT') {
    return {
      meal_plan_id: mealPlanId,
      constraint_type: c.constraint_type,
      hardness,
      text_value: c.text_value,
      numeric_value: null,
      macro_goal_value: null,
    }
  }
  return {
    meal_plan_id: mealPlanId,
    constraint_type: c.constraint_type,
    hardness,
    numeric_value: c.numeric_value,
    macro_goal_value: null,
    text_value: null,
  }
}

function toConstraintInput(c: MealPlanConstraint): CreateMealPlanConstraintInput {
  if (c.constraint_type === 'MACRO_GOAL') {
    return { constraint_type: 'MACRO_GOAL', hardness: c.hardness, macro_goal_value: c.macro_goal_value! }
  }
  if (c.constraint_type === 'PREFER_CUISINE') {
    return { constraint_type: 'PREFER_CUISINE', hardness: c.hardness, text_value: c.text_value! }
  }
  if (c.constraint_type === 'AVOID_INGREDIENT') {
    return { constraint_type: 'AVOID_INGREDIENT', hardness: c.hardness, text_value: c.text_value! }
  }
  return { constraint_type: c.constraint_type, hardness: c.hardness, numeric_value: c.numeric_value! }
}

// Ensambla un MealPlanWithDetails a partir de las filas planas devueltas por
// los inserts (create/duplicate no usan el select anidado de findWithDetails).
function assemblePlan(
  planRow: MealPlanRow,
  dayRows: MealPlanDayRow[],
  slotRows: MealSlotRow[],
  assignmentRows: MealAssignmentRow[],
  constraintRows: MealPlanConstraintRow[],
): MealPlanWithDetails {
  const slotsByDayId = new Map<string, MealSlotRow[]>()
  for (const s of slotRows) {
    const list = slotsByDayId.get(s.meal_plan_day_id) ?? []
    list.push(s)
    slotsByDayId.set(s.meal_plan_day_id, list)
  }

  const assignmentsBySlotId = new Map<string, MealAssignmentRow[]>()
  for (const a of assignmentRows) {
    const list = assignmentsBySlotId.get(a.meal_slot_id) ?? []
    list.push(a)
    assignmentsBySlotId.set(a.meal_slot_id, list)
  }

  return {
    ...mapMealPlan(planRow),
    days: [...dayRows]
      .sort((a, b) => a.position - b.position)
      .map((d) => ({
        ...mapMealPlanDay(d),
        slots: (slotsByDayId.get(d.id) ?? [])
          .sort((a, b) => a.position - b.position)
          .map((s) => ({
            ...mapMealSlot(s),
            assignments: (assignmentsBySlotId.get(s.id) ?? [])
              .sort((a, b) => a.position - b.position)
              .map(mapMealAssignment),
          })),
      })),
    constraints: constraintRows.map(mapMealPlanConstraint),
  }
}

export class MealPlanRepository extends BaseRepository {
  async findById(id: string): Promise<Result<MealPlan | null>> {
    try {
      const response = await this.db.from('meal_plans').select('*').eq('id', id).maybeSingle()
      const row = mapNullableResponse(response)
      return ok(row ? mapMealPlan(row) : null)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async findWithDetails(id: string): Promise<Result<MealPlanWithDetails | null>> {
    try {
      const response = await this.db
        .from('meal_plans')
        .select(`
          *,
          meal_plan_days (
            *,
            meal_slots ( *, meal_assignments ( * ) )
          ),
          meal_plan_constraints ( * )
        `)
        .eq('id', id)
        .maybeSingle()

      const data = mapNullableResponse(response)
      if (!data) return ok(null)

      const d = data as any
      const dayRows: MealPlanDayRow[] = d.meal_plan_days ?? []
      const slotRows: MealSlotRow[] = dayRows.flatMap((day: any) => day.meal_slots ?? [])
      const assignmentRows: MealAssignmentRow[] = slotRows.flatMap((slot: any) => slot.meal_assignments ?? [])
      const constraintRows: MealPlanConstraintRow[] = d.meal_plan_constraints ?? []

      return ok(assemblePlan(data, dayRows, slotRows, assignmentRows, constraintRows))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  // Un solo plan activo (no soft-deleted) por usuario y semana — ver unique
  // index parcial `meal_plans_user_week_unique_idx`.
  async findByWeek(userId: string, weekStartDate: string): Promise<Result<MealPlan | null>> {
    try {
      const response = await this.db
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .is('deleted_at', null)
        .maybeSingle()
      const row = mapNullableResponse(response)
      return ok(row ? mapMealPlan(row) : null)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async list(input: ListMealPlansInput, userId: string): Promise<Result<MealPlan[]>> {
    try {
      let query = this.db.from('meal_plans').select('*').eq('user_id', userId).is('deleted_at', null)

      if (input.status) query = query.eq('status', input.status)
      query = query
        .order('week_start_date', { ascending: false })
        .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 20) - 1)

      const response = await query
      const rows = mapResponse(response)
      return ok(rows.map(mapMealPlan))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async create(
    userId: string,
    input: { name: string; week_start_date: string; notes?: string },
    days: MealPlanDayDraft[],
    constraints: CreateMealPlanConstraintInput[],
  ): Promise<Result<MealPlanWithDetails>> {
    try {
      const planResponse = await this.db
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: input.name,
          week_start_date: input.week_start_date,
          notes: input.notes ?? null,
          status: 'DRAFT' as const,
        })
        .select('*')
        .single()
      const planRow = mapResponse(planResponse)

      const dayRows = await this.insertDays(planRow.id, days)
      const slotRows = await this.insertSlots(days, dayRows)

      let constraintRows: MealPlanConstraintRow[] = []
      if (constraints.length > 0) {
        const constraintsResponse = await this.db
          .from('meal_plan_constraints')
          .insert(constraints.map((c) => buildConstraintInsert(planRow.id, c)))
          .select('*')
        constraintRows = mapResponse(constraintsResponse)
      }

      return ok(assemblePlan(planRow, dayRows, slotRows, [], constraintRows))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  // Copia estructura + asignaciones + restricciones de `source` hacia un plan
  // nuevo en `newWeekStartDate`. Correlaciona días/slots por posición (0-6 /
  // 0..N), ya que tanto create() como duplicate() preservan ese esquema.
  async duplicate(
    source: MealPlanWithDetails,
    userId: string,
    newWeekStartDate: string,
    name: string,
  ): Promise<Result<MealPlanWithDetails>> {
    try {
      const dayDrafts: MealPlanDayDraft[] = source.days.map((d) => ({
        date: addDaysISO(newWeekStartDate, d.position),
        position: d.position,
        slots: d.slots.map((s) => ({
          meal_type: s.meal_type,
          slot_kind: s.slot_kind,
          target_servings: s.target_servings,
          position: s.position,
        })),
      }))

      const createdResult = await this.create(
        userId,
        { name, week_start_date: newWeekStartDate, notes: source.notes ?? undefined },
        dayDrafts,
        source.constraints.map(toConstraintInput),
      )
      if (!createdResult.ok) return createdResult
      const created = createdResult.data

      const newSlotIdByPosition = new Map<string, string>()
      for (const d of created.days) {
        for (const s of d.slots) {
          newSlotIdByPosition.set(`${d.position}:${s.position}`, s.id)
        }
      }

      const assignmentsInsert: {
        meal_slot_id: string
        recipe_id: string
        servings: number
        source: AssignmentSource
        position: number
      }[] = []
      for (const d of source.days) {
        for (const s of d.slots) {
          const newSlotId = newSlotIdByPosition.get(`${d.position}:${s.position}`)
          if (!newSlotId) continue
          for (const a of s.assignments) {
            assignmentsInsert.push({
              meal_slot_id: newSlotId,
              recipe_id: a.recipe_id,
              servings: a.servings,
              source: a.source,
              position: a.position,
            })
          }
        }
      }

      if (assignmentsInsert.length === 0) return ok(created)

      const assignmentsResponse = await this.db
        .from('meal_assignments')
        .insert(assignmentsInsert)
        .select('*')
      const assignmentRows = mapResponse(assignmentsResponse)

      const assignmentsBySlotId = new Map<string, MealAssignmentRow[]>()
      for (const a of assignmentRows) {
        const list = assignmentsBySlotId.get(a.meal_slot_id) ?? []
        list.push(a)
        assignmentsBySlotId.set(a.meal_slot_id, list)
      }

      const finalPlan: MealPlanWithDetails = {
        ...created,
        days: created.days.map((d) => ({
          ...d,
          slots: d.slots.map((s) => ({
            ...s,
            assignments: (assignmentsBySlotId.get(s.id) ?? [])
              .sort((a, b) => a.position - b.position)
              .map(mapMealAssignment),
          })),
        })),
      }

      return ok(finalPlan)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async update(id: string, input: UpdateMealPlanInput): Promise<Result<MealPlan>> {
    try {
      const response = await this.db
        .from('meal_plans')
        .update({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.status !== undefined && { status: input.status }),
        })
        .eq('id', id)
        .select('*')
        .single()
      const row = mapResponse(response)
      return ok(mapMealPlan(row))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async softDelete(id: string): Promise<Result<void>> {
    try {
      const response = await this.db
        .from('meal_plans')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (response.error) throw response.error
      return ok(undefined)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  // ─── Slots / Assignments (operaciones puntuales) ────────────────────────────

  async findSlotWithOwner(slotId: string): Promise<Result<SlotOwnerContext | null>> {
    try {
      const response = await this.db
        .from('meal_slots')
        .select(`*, meal_plan_days ( meal_plan_id, meal_plans ( id, user_id ) )`)
        .eq('id', slotId)
        .maybeSingle()
      const data = mapNullableResponse(response)
      if (!data) return ok(null)

      const d = data as any
      const mealPlan = d.meal_plan_days?.meal_plans
      if (!mealPlan) return ok(null)

      return ok({
        slot: mapMealSlot(data),
        mealPlanId: mealPlan.id,
        ownerId: mealPlan.user_id,
      })
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async findAssignmentBySlotAndRecipe(
    slotId: string,
    recipeId: string,
  ): Promise<Result<MealAssignment | null>> {
    try {
      const response = await this.db
        .from('meal_assignments')
        .select('*')
        .eq('meal_slot_id', slotId)
        .eq('recipe_id', recipeId)
        .maybeSingle()
      const row = mapNullableResponse(response)
      return ok(row ? mapMealAssignment(row) : null)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async createAssignment(
    slotId: string,
    recipeId: string,
    servings: number,
    source: AssignmentSource,
  ): Promise<Result<MealAssignment>> {
    try {
      const countResponse = await this.db
        .from('meal_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('meal_slot_id', slotId)
      const position = countResponse.count ?? 0

      const response = await this.db
        .from('meal_assignments')
        .insert({ meal_slot_id: slotId, recipe_id: recipeId, servings, source, position })
        .select('*')
        .single()
      const row = mapResponse(response)
      return ok(mapMealAssignment(row))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async findAssignmentWithOwner(assignmentId: string): Promise<Result<AssignmentOwnerContext | null>> {
    try {
      const response = await this.db
        .from('meal_assignments')
        .select(`*, meal_slots ( meal_plan_days ( meal_plan_id, meal_plans ( id, user_id ) ) )`)
        .eq('id', assignmentId)
        .maybeSingle()
      const data = mapNullableResponse(response)
      if (!data) return ok(null)

      const d = data as any
      const mealPlan = d.meal_slots?.meal_plan_days?.meal_plans
      if (!mealPlan) return ok(null)

      return ok({
        assignment: mapMealAssignment(data),
        mealPlanId: mealPlan.id,
        ownerId: mealPlan.user_id,
      })
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async updateAssignmentServings(assignmentId: string, servings: number): Promise<Result<MealAssignment>> {
    try {
      const response = await this.db
        .from('meal_assignments')
        .update({ servings })
        .eq('id', assignmentId)
        .select('*')
        .single()
      const row = mapResponse(response)
      return ok(mapMealAssignment(row))
    } catch (e) {
      return err(wrapError(e))
    }
  }

  async deleteAssignment(assignmentId: string): Promise<Result<void>> {
    try {
      const response = await this.db.from('meal_assignments').delete().eq('id', assignmentId)
      if (response.error) throw response.error
      return ok(undefined)
    } catch (e) {
      return err(wrapError(e))
    }
  }

  // ─── Helpers privados de create() ────────────────────────────────────────────

  private async insertDays(mealPlanId: string, days: MealPlanDayDraft[]): Promise<MealPlanDayRow[]> {
    const response = await this.db
      .from('meal_plan_days')
      .insert(days.map((d) => ({ meal_plan_id: mealPlanId, date: d.date, position: d.position })))
      .select('*')
    return mapResponse(response)
  }

  private async insertSlots(
    days: MealPlanDayDraft[],
    dayRows: MealPlanDayRow[],
  ): Promise<MealSlotRow[]> {
    const dayRowByPosition = new Map(dayRows.map((r) => [r.position, r]))
    const slotsInsert = days.flatMap((d) => {
      const dayRow = dayRowByPosition.get(d.position)
      if (!dayRow) return []
      return d.slots.map((s) => ({
        meal_plan_day_id: dayRow.id,
        meal_type: s.meal_type,
        slot_kind: s.slot_kind,
        target_servings: s.target_servings,
        position: s.position,
      }))
    })

    if (slotsInsert.length === 0) return []
    const response = await this.db.from('meal_slots').insert(slotsInsert).select('*')
    return mapResponse(response)
  }
}
