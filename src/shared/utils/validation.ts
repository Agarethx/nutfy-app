import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const slugSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be kebab-case ASCII')

export const positiveNumberSchema = z.number().positive()

export const emailSchema = z.string().email().toLowerCase()

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function sanitizeString(input: string, maxLength: number = 500): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}
