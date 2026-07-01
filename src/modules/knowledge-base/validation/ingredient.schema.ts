import { z } from 'zod'

// ─── Nutrition sub-schema ─────────────────────────────────────────────────────

const nutritionSchema = z
  .object({
    calories_kcal: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
    protein_g: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
    carbs_g: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
    sugar_g: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
    fiber_g: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
    fat_g: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
    saturated_fat_g: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
    sodium_mg: z.number().nonnegative('Debe ser ≥ 0').nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sugar_g != null && data.carbs_g != null && data.sugar_g > data.carbs_g) {
      ctx.addIssue({
        code: 'custom',
        message: 'El azúcar no puede superar los carbohidratos totales',
        path: ['sugar_g'],
      })
    }
    if (
      data.saturated_fat_g != null &&
      data.fat_g != null &&
      data.saturated_fat_g > data.fat_g
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'La grasa saturada no puede superar la grasa total',
        path: ['saturated_fat_g'],
      })
    }
  })

// ─── Create ───────────────────────────────────────────────────────────────────

export const createIngredientSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  category_id: z.string().uuid('UUID inválido').optional(),
  subcategory_id: z.string().uuid('UUID inválido').optional(),
  default_unit_id: z.string().uuid('UUID inválido').optional(),
  countries: z
    .array(z.string().length(2, 'Código de país inválido (ISO 3166-1 alpha-2)'))
    .optional(),
  seasonality_months: z
    .array(z.number().int().min(1, 'Mes inválido').max(12, 'Mes inválido'))
    .optional(),
  nutrition: nutritionSchema.optional(),
})

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateIngredientSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'Máximo 150 caracteres')
    .optional(),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid('UUID inválido').nullable().optional(),
  subcategory_id: z.string().uuid('UUID inválido').nullable().optional(),
  default_unit_id: z.string().uuid('UUID inválido').nullable().optional(),
  countries: z
    .array(z.string().length(2, 'Código de país inválido'))
    .optional(),
  seasonality_months: z
    .array(z.number().int().min(1, 'Mes inválido').max(12, 'Mes inválido'))
    .optional(),
  nutrition: nutritionSchema.optional(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateIngredientFormValues = z.infer<typeof createIngredientSchema>
export type UpdateIngredientFormValues = z.infer<typeof updateIngredientSchema>
