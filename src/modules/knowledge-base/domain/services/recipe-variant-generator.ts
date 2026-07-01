import type { Ingredient, IngredientWithDetails } from '../ingredient.types'
import type { RecipeIngredient } from '../recipe.types'

// ─── RecipeVariantGenerator ───────────────────────────────────────────────────
// Decide QUÉ cambiar en una receta para producir cada variante dietética, sin
// tocar la base de datos y sin llamar a IA — solo reglas deterministas sobre
// los datos ya cargados del ingrediente (attributes, allergens, nutrition,
// nombre) más un catálogo de sustituciones curado (best-effort, no exhaustivo,
// igual que REMOVABLE_BRANDS en ingredient-text-parser.ts).
//
// Puro — el caller (generate-recipe-variants.use-case.ts) es responsable de:
//   - resolver `substituteQuery` a un ingredient_id real (vía el motor de
//     matching de ingredient-text-parser / match-ingredient.use-case)
//   - recalcular la nutrición (vía NutritionCalculator, ya existente)
//   - persistir el resultado como RecipeVariation + VariationIngredientOverride
//
// ADR-015: Exportable para uso en otros módulos.

export type DietVariantType =
  | 'high_protein'
  | 'low_calorie'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'gluten_free'
  | 'dairy_free'

export const DIET_VARIANT_METADATA: Record<
  DietVariantType,
  { name: string; slug: string }
> = {
  high_protein: { name: 'Alta proteína', slug: 'alta-proteina' },
  low_calorie: { name: 'Baja calórica', slug: 'baja-calorica' },
  vegetarian: { name: 'Vegetariana', slug: 'vegetariana' },
  vegan: { name: 'Vegana', slug: 'vegana' },
  keto: { name: 'Keto', slug: 'keto' },
  gluten_free: { name: 'Sin gluten', slug: 'sin-gluten' },
  dairy_free: { name: 'Sin lactosa', slug: 'sin-lactosa' },
}

export type VariantIngredientContext = {
  recipeIngredient: RecipeIngredient
  details: IngredientWithDetails
}

export type ChangePlan =
  | {
      kind: 'remove'
      recipeIngredientId: string
      ingredientName: string
      reason: string
    }
  | {
      kind: 'replace'
      recipeIngredientId: string
      ingredientName: string
      substituteQuery: string
      reason: string
    }
  | {
      kind: 'adjust_quantity'
      recipeIngredientId: string
      ingredientName: string
      newQuantity: number
      reason: string
    }

// ─── Utilidades de texto ───────────────────────────────────────────────────────

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalizedName(ingredient: Ingredient): string {
  return stripAccents(ingredient.name.toLowerCase())
}

function findKeyword(name: string, keywords: string[]): string | null {
  return keywords.find((keyword) => name.includes(keyword)) ?? null
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// ─── Reglas de exclusión (vegetariana, vegana, keto, sin gluten, sin lactosa) ──
// Cada regla decide si un ingrediente VIOLA la dieta, y si es así, qué buscar
// como sustituto (o null si se debe eliminar directamente sin reemplazo).

type Substitution = { keywords: string[]; substitute: string; note: string }

type ExclusionRule = {
  // Si el ingrediente tiene alguno de estos atributos curados, se confía en
  // el dato de DB y se considera compatible sin más comprobación.
  compliantAttributeSlugs: string[]
  // Alérgeno de presencia DIRECTA (no traza) que descalifica el ingrediente.
  violatingAllergenSlugs: string[]
  // Heurística de respaldo cuando no hay attributes/allergens curados.
  violatingKeywords: string[]
  substitutions: Substitution[]
}

const GLUTEN_FREE_RULE: ExclusionRule = {
  compliantAttributeSlugs: ['sin-gluten'],
  violatingAllergenSlugs: ['gluten'],
  violatingKeywords: [
    'harina de trigo',
    'harina',
    'pan',
    'pasta',
    'trigo',
    'cebada',
    'centeno',
    'cuscus',
    'semola',
    'seitan',
    'cerveza',
  ],
  substitutions: [
    {
      keywords: ['harina'],
      substitute: 'harina sin gluten',
      note: 'Sustituir por harina certificada sin gluten en la misma cantidad.',
    },
    {
      keywords: ['pan'],
      substitute: 'pan sin gluten',
      note: 'Sustituir por pan sin gluten.',
    },
    {
      keywords: ['pasta'],
      substitute: 'pasta sin gluten',
      note: 'Sustituir por pasta sin gluten (arroz o maíz).',
    },
    {
      keywords: ['trigo', 'cebada', 'centeno', 'cuscus', 'semola'],
      substitute: 'quinoa',
      note: 'Sustituir por quinoa, un grano naturalmente libre de gluten.',
    },
  ],
}

const DAIRY_FREE_RULE: ExclusionRule = {
  compliantAttributeSlugs: ['sin-lactosa', 'sin-lacteos', 'vegano'],
  violatingAllergenSlugs: ['lacteos'],
  violatingKeywords: [
    'leche condensada',
    'leche evaporada',
    'leche',
    'nata',
    'crema de leche',
    'mantequilla',
    'queso',
    'yogur',
    'yogurt',
    'requeson',
    'mascarpone',
    'ricotta',
  ],
  substitutions: [
    {
      keywords: ['leche condensada'],
      substitute: 'leche condensada de coco',
      note: 'Sustituir por leche condensada de coco.',
    },
    {
      keywords: ['leche evaporada'],
      substitute: 'leche evaporada de coco',
      note: 'Sustituir por leche evaporada de coco.',
    },
    {
      keywords: ['leche'],
      substitute: 'leche de almendra',
      note: 'Sustituir por leche de almendra en la misma cantidad.',
    },
    {
      keywords: ['mantequilla'],
      substitute: 'aceite de coco',
      note: 'Sustituir por aceite de coco en la misma cantidad.',
    },
    {
      keywords: ['nata', 'crema de leche'],
      substitute: 'leche de coco',
      note: 'Sustituir por leche de coco entera.',
    },
    {
      keywords: ['yogur', 'yogurt'],
      substitute: 'yogur de coco',
      note: 'Sustituir por yogur de coco.',
    },
    {
      keywords: ['queso', 'requeson', 'mascarpone', 'ricotta'],
      substitute: 'queso sin lactosa',
      note: 'Sustituir por queso sin lactosa.',
    },
  ],
}

const VEGETARIAN_SUBSTITUTIONS: Substitution[] = [
  {
    keywords: ['pechuga de pollo', 'muslo de pollo', 'pollo'],
    substitute: 'tofu firme',
    note: 'Sustituir por tofu firme — tiempo de cocción similar.',
  },
  {
    keywords: ['tocino', 'panceta'],
    substitute: 'tempeh ahumado',
    note: 'Sustituir por tempeh ahumado.',
  },
  {
    keywords: ['jamon', 'chorizo', 'salchicha'],
    substitute: 'salchicha vegetal',
    note: 'Sustituir por un embutido vegetal.',
  },
  {
    keywords: ['atun', 'salmon', 'pescado'],
    substitute: 'tofu ahumado',
    note: 'Sustituir por tofu ahumado.',
  },
  {
    keywords: ['camaron', 'gamba', 'marisco', 'calamar', 'pulpo'],
    substitute: 'setas ostra',
    note: 'Sustituir por setas ostra — textura similar al salteado.',
  },
  {
    keywords: ['res', 'ternera', 'cerdo', 'carne'],
    substitute: 'seitan',
    note: 'Sustituir por seitan en la misma cantidad.',
  },
]

const VEGETARIAN_RULE: ExclusionRule = {
  compliantAttributeSlugs: ['vegetariano', 'vegano'],
  violatingAllergenSlugs: ['pescado', 'crustaceos', 'moluscos'],
  violatingKeywords: [
    'pechuga de pollo',
    'muslo de pollo',
    'pollo',
    'res',
    'ternera',
    'cerdo',
    'tocino',
    'panceta',
    'jamon',
    'chorizo',
    'salchicha',
    'carne',
    'pescado',
    'atun',
    'salmon',
    'camaron',
    'gamba',
    'marisco',
    'calamar',
    'pulpo',
  ],
  substitutions: VEGETARIAN_SUBSTITUTIONS,
}

const VEGAN_RULE: ExclusionRule = {
  compliantAttributeSlugs: ['vegano'],
  violatingAllergenSlugs: [
    'pescado',
    'crustaceos',
    'moluscos',
    'lacteos',
    'huevo',
  ],
  violatingKeywords: [
    ...VEGETARIAN_RULE.violatingKeywords,
    'leche',
    'nata',
    'crema de leche',
    'mantequilla',
    'queso',
    'yogur',
    'yogurt',
    'huevo',
    'miel',
  ],
  substitutions: [
    ...VEGETARIAN_SUBSTITUTIONS,
    {
      keywords: ['leche'],
      substitute: 'leche de almendra',
      note: 'Sustituir por leche de almendra en la misma cantidad.',
    },
    {
      keywords: ['mantequilla'],
      substitute: 'aceite de coco',
      note: 'Sustituir por aceite de coco en la misma cantidad.',
    },
    {
      keywords: ['nata', 'crema de leche'],
      substitute: 'leche de coco',
      note: 'Sustituir por leche de coco entera.',
    },
    {
      keywords: ['yogur', 'yogurt'],
      substitute: 'yogur de coco',
      note: 'Sustituir por yogur de coco.',
    },
    {
      keywords: ['queso'],
      substitute: 'queso vegano',
      note: 'Sustituir por queso vegano.',
    },
    {
      keywords: ['huevo'],
      substitute: 'linaza molida',
      note: 'Sustituir cada huevo por 1 cda de linaza molida + 3 cda de agua (dejar reposar 5 min).',
    },
    {
      keywords: ['miel'],
      substitute: 'sirope de agave',
      note: 'Sustituir por sirope de agave en la misma cantidad.',
    },
  ],
}

const KETO_RULE: ExclusionRule = {
  compliantAttributeSlugs: ['keto', 'bajo-en-carbos'],
  violatingAllergenSlugs: [],
  violatingKeywords: [
    'azucar',
    'arroz',
    'pasta',
    'pan',
    'papa',
    'patata',
    'harina',
    'miel',
    'refresco',
    'cerveza',
  ],
  substitutions: [
    {
      keywords: ['arroz'],
      substitute: 'coliflor arroz',
      note: 'Sustituir por arroz de coliflor.',
    },
    {
      keywords: ['pasta'],
      substitute: 'espagueti de calabacin',
      note: 'Sustituir por espagueti de calabacín.',
    },
    {
      keywords: ['pan'],
      substitute: 'pan keto',
      note: 'Sustituir por pan bajo en carbohidratos.',
    },
    {
      keywords: ['papa', 'patata'],
      substitute: 'coliflor',
      note: 'Sustituir por coliflor.',
    },
    {
      keywords: ['harina'],
      substitute: 'harina de almendra',
      note: 'Sustituir por harina de almendra en la misma cantidad.',
    },
    {
      keywords: ['azucar', 'miel'],
      substitute: 'eritritol',
      note: 'Sustituir por eritritol (edulcorante sin carbohidratos netos) en la misma cantidad.',
    },
  ],
}

// Umbral de carbohidratos por 100g a partir del cual, aunque no haya keyword
// ni atributo, se considera el ingrediente incompatible con keto.
const KETO_CARBS_THRESHOLD_PER_100G = 20

function isExcluded(
  ctx: VariantIngredientContext,
  rule: ExclusionRule,
  extraCheck?: (ctx: VariantIngredientContext) => string | null,
): { reason: string } | null {
  const attributeSlugs = ctx.details.attributes.map((a) => a.slug)
  if (
    rule.compliantAttributeSlugs.some((slug) => attributeSlugs.includes(slug))
  ) {
    return null
  }

  const directAllergens = ctx.details.allergens.filter((a) => !a.is_trace)
  const matchedAllergen = directAllergens.find((a) =>
    rule.violatingAllergenSlugs.includes(a.allergen.slug),
  )
  if (matchedAllergen) {
    return { reason: `Contiene ${matchedAllergen.allergen.name.toLowerCase()}` }
  }

  const name = normalizedName(ctx.recipeIngredient.ingredient)
  const matchedKeyword = findKeyword(name, rule.violatingKeywords)
  if (matchedKeyword) {
    return {
      reason: `"${ctx.recipeIngredient.ingredient.name}" no es compatible con esta dieta`,
    }
  }

  const extraReason = extraCheck?.(ctx)
  if (extraReason) return { reason: extraReason }

  return null
}

function findSubstitution(
  ctx: VariantIngredientContext,
  substitutions: Substitution[],
): Substitution | null {
  const name = normalizedName(ctx.recipeIngredient.ingredient)
  return (
    substitutions.find((s) => findKeyword(name, s.keywords) !== null) ?? null
  )
}

function planExclusion(
  contexts: VariantIngredientContext[],
  rule: ExclusionRule,
  extraCheck?: (ctx: VariantIngredientContext) => string | null,
): ChangePlan[] {
  const plans: ChangePlan[] = []

  for (const ctx of contexts) {
    const violation = isExcluded(ctx, rule, extraCheck)
    if (!violation) continue

    const { recipeIngredient } = ctx
    const substitution = findSubstitution(ctx, rule.substitutions)

    if (substitution) {
      plans.push({
        kind: 'replace',
        recipeIngredientId: recipeIngredient.id,
        ingredientName: recipeIngredient.ingredient.name,
        substituteQuery: substitution.substitute,
        reason: `${violation.reason}. ${substitution.note}`,
      })
    } else {
      plans.push({
        kind: 'remove',
        recipeIngredientId: recipeIngredient.id,
        ingredientName: recipeIngredient.ingredient.name,
        reason: `${violation.reason}. No se encontró un sustituto automático — revisa este ingrediente manualmente.`,
      })
    }
  }

  return plans
}

function ketoExtraCheck(ctx: VariantIngredientContext): string | null {
  const carbs = ctx.recipeIngredient.ingredient.nutrition.carbs_g
  if (carbs !== null && carbs > KETO_CARBS_THRESHOLD_PER_100G) {
    return `Alto en carbohidratos (${carbs}g/100g), por encima del límite keto (${KETO_CARBS_THRESHOLD_PER_100G}g/100g)`
  }
  return null
}

// ─── Alta proteína / Baja calórica: no excluyen, ajustan ──────────────────────

const HIGH_PROTEIN_SUBSTITUTIONS: Substitution[] = [
  {
    keywords: ['pasta'],
    substitute: 'pasta de lentejas',
    note: 'Sustituir por pasta de lentejas, con más proteína.',
  },
  {
    keywords: ['arroz'],
    substitute: 'quinoa',
    note: 'Sustituir por quinoa, con más proteína que el arroz.',
  },
  {
    keywords: ['harina'],
    substitute: 'harina de garbanzo',
    note: 'Sustituir por harina de garbanzo, con más proteína.',
  },
]

const PROTEIN_BOOST_FACTOR = 1.5

const LOW_CALORIE_SUBSTITUTIONS: Substitution[] = [
  {
    keywords: ['mantequilla'],
    substitute: 'margarina light',
    note: 'Sustituir por margarina light.',
  },
  {
    keywords: ['nata', 'crema de leche'],
    substitute: 'leche evaporada desnatada',
    note: 'Sustituir por leche evaporada desnatada.',
  },
  {
    keywords: ['azucar'],
    substitute: 'eritritol',
    note: 'Sustituir por eritritol (sin calorías) en la misma cantidad.',
  },
  {
    keywords: ['queso'],
    substitute: 'queso bajo en grasa',
    note: 'Sustituir por queso bajo en grasa.',
  },
  {
    keywords: ['mayonesa'],
    substitute: 'yogur griego natural',
    note: 'Sustituir por yogur griego natural.',
  },
]

const CALORIE_REDUCTION_FACTOR = 0.7
// Solo se reduce la cantidad del ingrediente más calórico si supera este
// umbral — evita "recortar" ingredientes que ya son ligeros.
const LOW_CALORIE_FALLBACK_THRESHOLD_PER_100G = 200

function planProteinBoost(contexts: VariantIngredientContext[]): ChangePlan[] {
  const replacePlans: ChangePlan[] = []

  for (const ctx of contexts) {
    const substitution = findSubstitution(ctx, HIGH_PROTEIN_SUBSTITUTIONS)
    if (!substitution) continue
    replacePlans.push({
      kind: 'replace',
      recipeIngredientId: ctx.recipeIngredient.id,
      ingredientName: ctx.recipeIngredient.ingredient.name,
      substituteQuery: substitution.substitute,
      reason: substitution.note,
    })
  }

  if (replacePlans.length > 0) return replacePlans

  const candidates = contexts.filter(
    (ctx) => (ctx.recipeIngredient.ingredient.nutrition.protein_g ?? 0) > 0,
  )
  if (candidates.length === 0) return []

  const best = candidates.reduce((a, b) =>
    (b.recipeIngredient.ingredient.nutrition.protein_g ?? 0) >
    (a.recipeIngredient.ingredient.nutrition.protein_g ?? 0)
      ? b
      : a,
  )
  const newQuantity = round(
    best.recipeIngredient.quantity * PROTEIN_BOOST_FACTOR,
  )

  return [
    {
      kind: 'adjust_quantity',
      recipeIngredientId: best.recipeIngredient.id,
      ingredientName: best.recipeIngredient.ingredient.name,
      newQuantity,
      reason:
        `Cantidad aumentada de ${best.recipeIngredient.quantity} a ${newQuantity} ` +
        `${best.recipeIngredient.unit.abbreviation} para incrementar la proteína total.`,
    },
  ]
}

function planCalorieReduction(
  contexts: VariantIngredientContext[],
): ChangePlan[] {
  const replacePlans: ChangePlan[] = []

  for (const ctx of contexts) {
    const substitution = findSubstitution(ctx, LOW_CALORIE_SUBSTITUTIONS)
    if (!substitution) continue
    replacePlans.push({
      kind: 'replace',
      recipeIngredientId: ctx.recipeIngredient.id,
      ingredientName: ctx.recipeIngredient.ingredient.name,
      substituteQuery: substitution.substitute,
      reason: substitution.note,
    })
  }

  if (replacePlans.length > 0) return replacePlans

  const candidates = contexts.filter(
    (ctx) =>
      (ctx.recipeIngredient.ingredient.nutrition.calories_kcal ?? 0) >
      LOW_CALORIE_FALLBACK_THRESHOLD_PER_100G,
  )
  if (candidates.length === 0) return []

  const best = candidates.reduce((a, b) =>
    (b.recipeIngredient.ingredient.nutrition.calories_kcal ?? 0) >
    (a.recipeIngredient.ingredient.nutrition.calories_kcal ?? 0)
      ? b
      : a,
  )
  const newQuantity = round(
    best.recipeIngredient.quantity * CALORIE_REDUCTION_FACTOR,
  )

  return [
    {
      kind: 'adjust_quantity',
      recipeIngredientId: best.recipeIngredient.id,
      ingredientName: best.recipeIngredient.ingredient.name,
      newQuantity,
      reason:
        `Cantidad reducida de ${best.recipeIngredient.quantity} a ${newQuantity} ` +
        `${best.recipeIngredient.unit.abbreviation} para bajar las calorías totales.`,
    },
  ]
}

// ─── API pública ────────────────────────────────────────────────────────────

export const RecipeVariantGenerator = {
  // Devuelve los cambios propuestos para una variante. Array vacío significa
  // "la receta ya cumple con esta dieta" (exclusiones) o "sin datos
  // suficientes para proponer un cambio" (alta proteína / baja calórica) —
  // en ambos casos, el caller no debe crear la variante.
  plan(
    contexts: VariantIngredientContext[],
    variantType: DietVariantType,
  ): ChangePlan[] {
    switch (variantType) {
      case 'gluten_free':
        return planExclusion(contexts, GLUTEN_FREE_RULE)
      case 'dairy_free':
        return planExclusion(contexts, DAIRY_FREE_RULE)
      case 'vegetarian':
        return planExclusion(contexts, VEGETARIAN_RULE)
      case 'vegan':
        return planExclusion(contexts, VEGAN_RULE)
      case 'keto':
        return planExclusion(contexts, KETO_RULE, ketoExtraCheck)
      case 'high_protein':
        return planProteinBoost(contexts)
      case 'low_calorie':
        return planCalorieReduction(contexts)
    }
  },
}
