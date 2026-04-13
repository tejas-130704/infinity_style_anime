import { NextResponse } from 'next/server'
import { getServerSessionSafe } from '@/lib/auth/safe-get-server-session'
import { findUserById } from '@/lib/auth/user-repo'
import { authLimiter, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/auth/refresh
 * Validates the existing NextAuth JWT session (via HTTP-only cookie) and
 * returns fresh user data from the database.
 *
 * NextAuth automatically handles JWT rotation on each request, so this
 * endpoint's role is to verify session validity and return up-to-date
 * user profile data (role, name, avatar) without requiring a re-login.
 */
export async function POST(req: Request) {
  // Strict rate limit for token refresh: 15 req/min per IP
  const { success, remaining } = authLimiter.check(getClientIp(req))
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before refreshing.' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    )
  }

  // Verify the current session from the HTTP-only cookie
  const session = await getServerSessionSafe()
  if (!session?.user) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 })
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) {
    return NextResponse.json({ error: 'Invalid session: missing user id' }, { status: 401 })
  }

  // Fetch fresh profile from the database
  const dbUser = await findUserById(userId)
  if (!dbUser) {
    return NextResponse.json(
      { error: 'User account not found. Please sign in again.' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    {
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image ?? null,
        role: dbUser.role,
        phone: dbUser.phone ?? null,
        createdAt: dbUser.createdAt,
      },
    },
    {
      headers: {
        'X-RateLimit-Remaining': String(remaining),
      },
    }
  )
}
