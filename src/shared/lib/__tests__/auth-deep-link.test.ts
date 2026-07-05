import { parseRecoveryTokensFromUrl } from '../auth-deep-link'

describe('parseRecoveryTokensFromUrl', () => {
  it('extrae access_token y refresh_token de un link de recuperación válido', () => {
    const url =
      'nutrition-ai://reset-password#access_token=abc123&refresh_token=def456&type=recovery&expires_in=3600'
    expect(parseRecoveryTokensFromUrl(url)).toEqual({
      access_token: 'abc123',
      refresh_token: 'def456',
    })
  })

  it('devuelve null si la URL no tiene fragmento', () => {
    expect(parseRecoveryTokensFromUrl('nutrition-ai://reset-password')).toBeNull()
  })

  it('devuelve null si falta access_token', () => {
    const url = 'nutrition-ai://reset-password#refresh_token=def456&type=recovery'
    expect(parseRecoveryTokensFromUrl(url)).toBeNull()
  })

  it('devuelve null si falta refresh_token', () => {
    const url = 'nutrition-ai://reset-password#access_token=abc123&type=recovery'
    expect(parseRecoveryTokensFromUrl(url)).toBeNull()
  })

  it('devuelve null si type no es "recovery"', () => {
    const url =
      'nutrition-ai://reset-password#access_token=abc123&refresh_token=def456&type=signup'
    expect(parseRecoveryTokensFromUrl(url)).toBeNull()
  })

  it('devuelve null si falta el parámetro type', () => {
    const url = 'nutrition-ai://reset-password#access_token=abc123&refresh_token=def456'
    expect(parseRecoveryTokensFromUrl(url)).toBeNull()
  })

  it('devuelve null si el link trae un error (ej. expirado)', () => {
    const url =
      'nutrition-ai://reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    expect(parseRecoveryTokensFromUrl(url)).toBeNull()
  })
})
