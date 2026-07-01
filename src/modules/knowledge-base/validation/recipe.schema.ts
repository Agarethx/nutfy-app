import { z } from 'zod'

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const

const COOKING_METHODS = [
  'RAW', 'BAKE', 'GRILL', 'ROAST', 'STEAM', 'BOIL', 'SAUTE', 'FRY',
  'AIR_FRY', 'SLOW_COOK', 'PRESSURE_COOK', 'MICROWAVE', 'FERMENT', 'CURE', 'SOUS_VIDE',
] as const

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

export const recipeIngredientSchema = z.object({
  ingredient_id: z.string().uuid('ID de ingrediente inválido'),
  unit_id: z.string().uuid('ID de unidad inválido'),
  quantity: z.number().positive('La cantidad debe ser mayor que 0'),
  is_optional: z.boolean().optional(),
  notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

export const recipeStepSchema = z.object({
  instruction: z
    .string()
    .min(3, 'La instrucción debe tener al menos 3 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
  duration_min: z.number().int().positive('La duración debe ser positiva').optional(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const createRecipeSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200, 'Máximo 200 caracteres'),
    description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    servings_min: z.number().int().positive('Las raciones mínimas deben ser positivas'),
    servings_max: z.number().int().positive('Las raciones máximas deben ser positivas'),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    cooking_methods: z.array(z.enum(COOKING_METHODS)).optional(),
    prep_time_min: z.number().int().positive('Debe ser positivo').optional(),
    cook_time_min: z.number().int().positive('Debe ser positivo').optional(),
    rest_time_min: z.number().int().positive('Debe ser positivo').optional(),
    source_url: z
      .union([z.string().url('URL inválida'), z.literal('')])
      .optional(),
    notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
    is_public: z.boolean().optional(),
    ingredients: z
      .array(recipeIngredientSchema)
      .min(1, 'La receta debe tener al menos 1 ingrediente'),
    steps: z.array(recipeStepSchema).min(1, 'La receta debe tener al menos 1 paso'),
  })
  .refine((data) => data.servings_min <= data.servings_max, {
    message: 'Las raciones mínimas no pueden superar las máximas',
    path: ['servings_max'],
  })

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateRecipeSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200)
      .optional(),
    description: z.string().max(1000).optional(),
    servings_min: z.number().int().positive().optional(),
    servings_max: z.number().int().positive().optional(),
    difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
    cooking_methods: z.array(z.enum(COOKING_METHODS)).optional(),
    prep_time_min: z.number().int().positive().optional(),
    cook_time_min: z.number().int().positive().optional(),
    rest_time_min: z.number().int().positive().optional(),
    source_url: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
    notes: z.string().max(500).optional(),
    is_public: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.servings_min !== undefined &&
      data.servings_max !== undefined &&
      data.servings_min > data.servings_max
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Las raciones mínimas no pueden superar las máximas',
        path: ['servings_max'],
      })
    }
  })

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateRecipeFormValues = z.infer<typeof createRecipeSchema>
export type UpdateRecipeFormValues = z.infer<typeof updateRecipeSchema>
export type RecipeIngredientFormValues = z.infer<typeof recipeIngredientSchema>
export type RecipeStepFormValues = z.infer<typeof recipeStepSchema>
