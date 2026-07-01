export const storageKeys = {
  theme: 'theme-store',
  app: 'app-store',
  supabaseAuth: 'supabase-auth',
} as const

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys]
