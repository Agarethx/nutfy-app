export type RecoveryTokens = {
  access_token: string
  refresh_token: string
}

// Extrae access_token/refresh_token del fragmento (#...) de un deep link de
// recuperación de contraseña de Supabase Auth. GoTrueClient usa flowType
// 'implicit' por defecto, así que los tokens llegan en el fragmento de la URL
// (nutrition-ai://reset-password#access_token=...&refresh_token=...&type=recovery),
// no como query params — por eso no se puede usar `useLocalSearchParams` de
// expo-router directamente. Pura: no depende de React ni del cliente de Supabase.
export function parseRecoveryTokensFromUrl(url: string): RecoveryTokens | null {
  const fragmentStart = url.indexOf('#')
  if (fragmentStart === -1) return null

  const fragment = url.slice(fragmentStart + 1)
  const params = new URLSearchParams(fragment)

  if (params.get('type') !== 'recovery') return null

  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return null

  return { access_token, refresh_token }
}
