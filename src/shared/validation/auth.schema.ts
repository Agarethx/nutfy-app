import { z } from 'zod'

// Supabase Auth exige mínimo 6 caracteres por defecto (ver config.toml
// [auth].minimum_password_length si se cambia en el futuro).
const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')

const emailSchema = z.string().email('Correo inválido')

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

// ─── Registro ─────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

// ─── Recuperar contraseña ─────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// ─── Nueva contraseña (tras el link de recuperación) ──────────────────────────

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
