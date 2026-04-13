import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/auth'

/** Stale session cookie or rotated NEXTAUTH_SECRET — treat as signed out. */
function isSessionDecryptFailure(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const o = err as { code?: string; name?: string; message?: string }
  const msg = (o.message ?? '').toLowerCase()
  return (
    o.code === 'ERR_JWE_DECRYPTION_FAILED' ||
    o.name === 'JWEDecryptionFailed' ||
    msg.includes('jwt_session_error') ||
    msg.includes('decryption') ||
    msg.includes('jwe')
  )
}

/**
 * Same as getServerSession(authOptions) but never throws on bad/legacy cookies.
 * Returns null so callers can fall back to Supabase session or show login.
 */
export async function getServerSessionSafe(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions)
  } catch (err) {
    if (isSessionDecryptFailure(err)) {
      return null
    }
    throw err
  }
}
