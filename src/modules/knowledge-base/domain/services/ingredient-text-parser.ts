// ─── IngredientTextParser ─────────────────────────────────────────────────────
// Convierte una línea de receta en lenguaje natural ("2 tomates grandes picados")
// en sus componentes: cantidad, unidad, preparación y un nombre limpio listo para
// buscar en el catálogo (ver IngredientMatcher, que usa match_ingredients() en DB).
//
// Puro — no accede a la base de datos ni conoce el catálogo de ingredientes.
// ADR-015: Exportable para uso en otros módulos (ej. AI, al procesar una receta
// importada antes de guardarla).
//
// Limitaciones conocidas (documentadas a propósito, no son bugs):
//   - Solo reconoce rangos con "-" (ej. "2-3"), no "2 a 3".
//   - No interpreta cantidades idiomáticas como "un poco de" o "al gusto" como
//     null explícito; "un poco de sal" deja "poco" como ruido en el nombre.
//   - La singularización (ver singularizeWord más abajo) es una heurística sin
//     diccionario: distingue "tomate→tomates" (+s) de "limón→limones" (+es)
//     asumiendo que los plurales en "-es" cuyo singular termina en consonante
//     n/l/r (limón, frijol, col) son el grupo común que toma "+es", y todo lo
//     demás pluraliza con "+s". No es perfecta, pero la búsqueda difusa en DB
//     (trigram + unaccent) compensa los casos que se le escapan: se verificó
//     empíricamente que incluso un plural sin tocar como "limones" vs "Limón"
//     da similarity ≈ 0.56 (confianza media), suficiente para no perder el match.

export type ParsedIngredientLine = {
  originalText: string
  quantity: number | null
  unit: string | null
  preparation: string | null
  cleanedName: string
}

// ─── Unidades reconocidas (deben coincidir con units.abbreviation en DB) ──────
// Orden: entradas más específicas/largas primero para evitar que un prefijo
// corto capture de más (ej. "onza líquida" antes que "onza").

const UNIT_DEFINITIONS: { abbreviation: string; pattern: RegExp }[] = [
  {
    abbreviation: 'fl oz',
    pattern: /^(?:onzas?\s+l[ií]quidas?|fl\.?\s?oz)\b\.?/i,
  },
  { abbreviation: 'cdta', pattern: /^(?:cdtas?|cucharaditas?)\b\.?/i },
  { abbreviation: 'cda', pattern: /^(?:cdas?|cucharadas?)\b\.?/i },
  { abbreviation: 'kg', pattern: /^(?:kgs?|kilo(?:gramo)?s?)\b\.?/i },
  { abbreviation: 'mg', pattern: /^(?:mgs?|miligramos?)\b\.?/i },
  { abbreviation: 'g', pattern: /^(?:grs?\.?|gramos?|g)\b\.?/i },
  { abbreviation: 'lb', pattern: /^(?:lbs?|libras?)\b\.?/i },
  { abbreviation: 'oz', pattern: /^(?:oz|onzas?)\b\.?/i },
  { abbreviation: 'l', pattern: /^(?:lt|litros?|l)\b\.?/i },
  { abbreviation: 'ml', pattern: /^(?:mls?|mililitros?)\b\.?/i },
  { abbreviation: 'taza', pattern: /^tazas?\b\.?/i },
  { abbreviation: 'reb', pattern: /^(?:rebs?|rebanadas?)\b\.?/i },
  { abbreviation: 'pizca', pattern: /^pizcas?\b\.?/i },
  { abbreviation: 'diente', pattern: /^dientes?\b\.?/i },
  { abbreviation: 'hoja', pattern: /^hojas?\b\.?/i },
  { abbreviation: 'ud', pattern: /^(?:uds?|unidades?)\b\.?/i },
]

// ─── Preparaciones reconocidas ─────────────────────────────────────────────────
// Orden: frases más largas/específicas primero (ej. "finamente picado" antes
// que "picado") para que se capture la frase completa.

const PREPARATION_DEFINITIONS: { key: string; pattern: RegExp }[] = [
  { key: 'picado', pattern: /\bfinamente\s+picad[oa]s?\b/i },
  { key: 'picado', pattern: /\bpicad[oa]s?\b/i },
  { key: 'rallado', pattern: /\brallad[oa]s?\b/i },
  { key: 'cocido', pattern: /\bcocid[oa]s?\b/i },
  { key: 'hervido', pattern: /\bhervid[oa]s?\b/i },
  { key: 'en cubos', pattern: /\ben\s+(?:cubos|dados)\b/i },
  { key: 'troceado', pattern: /\btrocead[oa]s?\b/i },
  { key: 'en rodajas', pattern: /\ben\s+rodajas\b/i },
  { key: 'en juliana', pattern: /\ben\s+juliana\b/i },
  { key: 'machacado', pattern: /\bmachacad[oa]s?\b/i },
  { key: 'triturado', pattern: /\btriturad[oa]s?\b/i },
  { key: 'molido', pattern: /\b(?:molid[oa]s?|en\s+polvo)\b/i },
  { key: 'asado', pattern: /\basad[oa]s?\b/i },
  { key: 'frito', pattern: /\bfrit[oa]s?\b/i },
  { key: 'pelado', pattern: /\bpelad[oa]s?\b/i },
  { key: 'sin piel', pattern: /\bsin\s+piel\b/i },
  { key: 'sin semillas', pattern: /\bsin\s+(?:semillas|pepitas)\b/i },
  { key: 'congelado', pattern: /\bcongelad[oa]s?\b/i },
  { key: 'al gusto', pattern: /\bal\s+gusto\b/i },
]

// Adjetivos que no cambian la identidad del ingrediente para efectos de matching.
// Deliberadamente NO incluye colores (rojo, verde...) porque sí distinguen
// ingredientes distintos en el catálogo (ej. pimiento rojo vs pimiento verde).
const REMOVABLE_ADJECTIVES = [
  'grande',
  'grandes',
  'pequeño',
  'pequeña',
  'pequeños',
  'pequeñas',
  'mediano',
  'mediana',
  'medianos',
  'medianas',
  'fresco',
  'fresca',
  'frescos',
  'frescas',
  'maduro',
  'madura',
  'maduros',
  'maduras',
  'organico',
  'organica',
  'organicos',
  'organicas',
  'ecologico',
  'ecologica',
  'ecologicos',
  'ecologicas',
  'natural',
  'naturales',
  'entero',
  'entera',
  'enteros',
  'enteras',
  'bueno',
  'buena',
  'buenos',
  'buenas',
  'fino',
  'fina',
  'finos',
  'finas',
]

// Lista curada y NO exhaustiva de marcas comunes en recetas en español.
// Best-effort: no existe catálogo de marcas en el dominio (Supermarket no
// existe todavía), así que esto es una heurística, no una fuente de verdad.
const REMOVABLE_BRANDS = [
  'nestle',
  'knorr',
  'maggi',
  'hellmanns',
  'mccormick',
  'lala',
  'alpina',
  'bonafont',
  'coca-cola',
  'heinz',
  'barilla',
  'kraft',
  'philadelphia',
  'danone',
  'activia',
  'yoplait',
  'quaker',
  'hacendado',
  'mercadona',
]

const VULGAR_FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
}

const VULGAR_FRACTION_CHARS = Object.keys(VULGAR_FRACTIONS).join('')

function round(value: number, decimals = 4): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// ─── Limpieza de texto ──────────────────────────────────────────────────────
// Dos etapas separadas a propósito: la cantidad necesita "." y "," intactos
// (separador decimal) y "/" intacto (fracciones), así que la puntuación solo
// se elimina DESPUÉS de extraer cantidad/unidad/preparación, sobre lo que
// queda del nombre.

function normalizeForParsing(raw: string): string {
  return raw.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim()
}

function stripPunctuation(text: string): string {
  return text
    .replace(/[.,;:!?()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Cantidad ───────────────────────────────────────────────────────────────

function extractQuantity(text: string): {
  quantity: number | null
  rest: string
} {
  const trimmed = text.trim()

  // Rango simple "2-3" → promedio de los dos extremos.
  const rangeMatch = trimmed.match(
    /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)(\s+|$)/,
  )
  if (rangeMatch) {
    const a = Number.parseFloat(rangeMatch[1].replace(',', '.'))
    const b = Number.parseFloat(rangeMatch[2].replace(',', '.'))
    return {
      quantity: round((a + b) / 2),
      rest: trimmed.slice(rangeMatch[0].length),
    }
  }

  // Número mixto "1 1/2" → 1.5
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)(\s+|$)/)
  if (mixedMatch) {
    const whole = Number.parseInt(mixedMatch[1], 10)
    const num = Number.parseInt(mixedMatch[2], 10)
    const den = Number.parseInt(mixedMatch[3], 10)
    return {
      quantity: round(whole + num / den),
      rest: trimmed.slice(mixedMatch[0].length),
    }
  }

  // Dígito pegado a fracción unicode "1½" → 1.5
  const digitPlusVulgarMatch = trimmed.match(
    new RegExp(`^(\\d+)([${VULGAR_FRACTION_CHARS}])(\\s+|$)`),
  )
  if (digitPlusVulgarMatch) {
    const whole = Number.parseInt(digitPlusVulgarMatch[1], 10)
    return {
      quantity: round(whole + VULGAR_FRACTIONS[digitPlusVulgarMatch[2]]),
      rest: trimmed.slice(digitPlusVulgarMatch[0].length),
    }
  }

  // Fracción vulgar unicode sola "½" → 0.5
  const vulgarMatch = trimmed.match(
    new RegExp(`^([${VULGAR_FRACTION_CHARS}])(\\s+|$)`),
  )
  if (vulgarMatch) {
    return {
      quantity: VULGAR_FRACTIONS[vulgarMatch[1]],
      rest: trimmed.slice(vulgarMatch[0].length),
    }
  }

  // Fracción simple "1/2"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)(\s+|$)/)
  if (fractionMatch) {
    const num = Number.parseInt(fractionMatch[1], 10)
    const den = Number.parseInt(fractionMatch[2], 10)
    if (den !== 0) {
      return {
        quantity: round(num / den),
        rest: trimmed.slice(fractionMatch[0].length),
      }
    }
  }

  // Decimal o entero, con coma o punto como separador decimal
  const decimalMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)(\s+|$)/)
  if (decimalMatch) {
    return {
      quantity: Number.parseFloat(decimalMatch[1].replace(',', '.')),
      rest: trimmed.slice(decimalMatch[0].length),
    }
  }

  // Artículo indefinido singular como cantidad 1 ("un diente de ajo")
  const articleMatch = trimmed.match(/^(?:un|una)(\s+|$)/)
  if (articleMatch) {
    return { quantity: 1, rest: trimmed.slice(articleMatch[0].length) }
  }

  return { quantity: null, rest: trimmed }
}

// ─── Unidad ─────────────────────────────────────────────────────────────────

function extractUnit(text: string): { unit: string | null; rest: string } {
  const trimmed = text.trim()

  for (const { abbreviation, pattern } of UNIT_DEFINITIONS) {
    const match = trimmed.match(pattern)
    if (match) {
      let rest = trimmed.slice(match[0].length).trim()
      // "2 tazas de arroz" → tras consumir la unidad, quitar el conector "de".
      rest = rest.replace(/^(?:de\s+|del\s+|de\s+la\s+|de\s+los\s+)/, '')
      return { unit: abbreviation, rest }
    }
  }

  return { unit: null, rest: trimmed }
}

// ─── Preparación ────────────────────────────────────────────────────────────

function extractPreparation(text: string): {
  preparation: string | null
  rest: string
} {
  for (const { key, pattern } of PREPARATION_DEFINITIONS) {
    const match = text.match(pattern)
    if (match) {
      const rest = (
        text.slice(0, match.index) + text.slice(match.index! + match[0].length)
      )
        .replace(/\s+/g, ' ')
        .trim()
      return { preparation: key, rest }
    }
  }

  return { preparation: null, rest: text }
}

// ─── Adjetivos y marcas ──────────────────────────────────────────────────────

function stripWordList(text: string, words: string[]): string {
  if (words.length === 0) return text
  const pattern = new RegExp(`\\b(?:${words.join('|')})\\b`, 'gi')
  return text.replace(pattern, ' ').replace(/\s+/g, ' ').trim()
}

// ─── Singularización conservadora ────────────────────────────────────────────
// Ver limitaciones documentadas al inicio del archivo. Resumen de las 3 reglas
// (en orden, la primera que aplica gana):
//   1. "-ces"             → "-z"   (nueces→nuez, peces→pez)
//   2. vocal+"n/l/r"+"es" → strip "es" (limones→limon, frijoles→frijol,
//      panes→pan, coles→col) — cubre el grupo más común de sustantivos
//      españoles que pluralizan con "-es" porque el singular termina en
//      consonante (n/l/r).
//   3. vocal+"s"          → strip "s" (tomates→tomate, papas→papa) — el caso
//      regular, también cubre singulares que YA terminan en vocal (tomate)
//      y por tanto pluralizan solo con "+s", aunque la cadena final también
//      contenga "...es" (tomate+s = tomates).
// Cualquier otro plural en "-es" que no encaje en la regla 2 (raro en
// vocabulario de cocina) se deja intacto; la búsqueda difusa en DB compensa.
function singularizeWord(word: string): string {
  if (word.length <= 3) return word
  if (/ces$/i.test(word)) return `${word.slice(0, -3)}z`
  if (/[aeiouáéíóúü][nlr]es$/i.test(word)) return word.slice(0, -2)
  if (/[aeiouáéíóúü]s$/i.test(word)) return word.slice(0, -1)
  return word
}

function singularizeName(name: string): string {
  return name.split(' ').filter(Boolean).map(singularizeWord).join(' ')
}

export const IngredientTextParser = {
  parse(rawText: string): ParsedIngredientLine {
    const normalized = normalizeForParsing(rawText)

    const { quantity, rest: afterQuantity } = extractQuantity(normalized)
    const { unit, rest: afterUnit } = extractUnit(afterQuantity)
    const { preparation, rest: afterPreparation } =
      extractPreparation(afterUnit)

    let name = stripPunctuation(afterPreparation)
    name = stripWordList(name, REMOVABLE_ADJECTIVES)
    name = stripWordList(name, REMOVABLE_BRANDS)
    name = singularizeName(name)

    return {
      originalText: rawText,
      quantity,
      unit,
      preparation,
      cleanedName: name.trim(),
    }
  },
}
