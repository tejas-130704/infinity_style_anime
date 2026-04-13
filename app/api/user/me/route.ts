import { NextResponse } from 'next/server'
import { requireSession, isErrorResponse } from '@/lib/auth/session-guard'
import { findUserById } from '@/lib/auth/user-repo'
import { apiLimiter, getClientIp } from '@/lib/rate-limit'

/**
 * GET /api/user/me
 * Returns the authenticated user's full profile from the database.
 * Always reads from DB — never trusts the JWT payload alone.
 */
export async function GET(req: Request) {
  // Rate limit: 60 req/min per IP
  const { success } = apiLimiter.check(getClientIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const result = await requireSession()
  if (isErrorResponse(result)) return result

  const dbUser = await findUserById(result.user.id)
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Return only safe, non-sensitive fields
  return NextResponse.json({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image ?? null,
    role: dbUser.role,
    phone: dbUser.phone ?? null,
    createdAt: dbUser.createdAt,
  })
}
