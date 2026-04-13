/**
 * Single source for the NextAuth JWT signing secret.
 * Trims whitespace/quotes from .env mistakes; supports AUTH_SECRET (Auth.js / some hosts).
 */
export function getNextAuthSecret(): string | undefined {
  const raw = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (!raw) return undefined
  const s = raw.trim().replace(/^["']|["']$/g, '')
  return s.length > 0 ? s : undefined
}
