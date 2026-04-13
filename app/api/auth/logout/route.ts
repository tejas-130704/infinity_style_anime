import { NextResponse } from 'next/server'
import { getServerSessionSafe } from '@/lib/auth/safe-get-server-session'
import { authLimiter, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/auth/logout
 * Clears the NextAuth session cookie and Supabase session.
 * Frontend should call this, then call signOut() from next-auth/react for full cleanup.
 */
export async function POST(req: Request) {
  // Rate limit: 15 req/min per IP
  const { success } = authLimiter.check(getClientIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await getServerSessionSafe()
  if (!session) {
    // Already logged out — idempotent
    return NextResponse.json({ success: true, message: 'Already logged out' })
  }

  // Build response that clears the NextAuth session cookies
  const res = NextResponse.json({ success: true, message: 'Logged out' })

  // Clear all NextAuth cookies
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'google_auth_intent',
  ]

  for (const name of cookieNames) {
    res.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })
  }

  return res
}
