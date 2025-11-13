import crypto from 'crypto'

/**
 * Generate a cryptographically secure random token
 * Uses 32 bytes (256 bits) of randomness, resulting in a 64-character hex string
 * @returns A secure random token string
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Check if a token has expired based on its expiration date
 * @param expiresAt - ISO 8601 timestamp string or null
 * @returns true if the token is expired, false otherwise
 */
export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

/**
 * Generate a token expiration date
 * @param daysFromNow - Number of days until expiration (default: 30)
 * @returns ISO 8601 timestamp string for the expiration date
 */
export function generateTokenExpiration(daysFromNow: number = 30): string {
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + daysFromNow)
  return expirationDate.toISOString()
}

/**
 * Validate a token's existence and expiration status
 * @param token - The token string to validate
 * @param expiresAt - The token's expiration date
 * @returns Object with isValid boolean and optional error message
 */
export function validateToken(
  token: string | null,
  expiresAt: string | null
): { isValid: boolean; error?: string } {
  if (!token) {
    return { isValid: false, error: 'Token not found' }
  }

  if (isTokenExpired(expiresAt)) {
    return { isValid: false, error: 'Token has expired' }
  }

  return { isValid: true }
}

/**
 * Generate a shareable URL for a proposal
 * @param token - The proposal's access token
 * @param baseUrl - The base URL of the application (optional, uses relative path if not provided)
 * @returns The full shareable URL
 */
export function generateShareableUrl(token: string, baseUrl?: string): string {
  const path = `/p/${token}`
  return baseUrl ? `${baseUrl}${path}` : path
}

