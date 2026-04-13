import { NextResponse } from 'next/server'
import { getServerSessionSafe } from '@/lib/auth/safe-get-server-session'
import { createClient } from '@/lib/supabase/server'
import { findUserById } from '@/lib/auth/user-repo'

export type SessionUser = {
  id: string
  name: string | null
  email: string
  image?: string | null
  role: 'admin' | 'user'
  phone: string | null
  createdAt: string
}

// ── Type-safe session helpers ─────────────────────────────────────────────────

/**
 * Returns the current user: NextAuth JWT (e.g. Google) or Supabase cookie session (email/password).
 * Always resolves profile from DB when using Supabase auth.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSessionSafe()
  if (session?.user?.id) {
    const u = session.user
    return {
      id: u.id,
      name: u.name ?? null,
      email: u.email ?? '',
      image: u.image ?? null,
      role: u.role ?? 'user',
      phone: u.phone ?? null,
      createdAt: u.createdAt ?? '',
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user?.id) return null

    const dbUser = await findUserById(user.id)
    if (!dbUser) return null

    return {
      id: dbUser.id,
      name: dbUser.name ?? null,
      email: dbUser.email ?? '',
      image: dbUser.image ?? null,
      role: dbUser.role,
      phone: dbUser.phone ?? null,
      createdAt: dbUser.createdAt ?? '',
    }
  } catch {
    return null
  }
}

/**
 * Requires authentication. Returns 401 JSON Response if not authenticated.
 * Use at the top of API route handlers.
 */
export async function requireSession(): Promise<
  { user: SessionUser } | NextResponse
> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { user }
}

/**
 * Requires admin role. Returns 401/403 JSON Response if not authorized.
 */
export async function requireAdminSession(): Promise<
  { user: SessionUser } | NextResponse
> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { user }
}

/**
 * Type-guard: checks if the result is an error NextResponse.
 * Usage: if (isErrorResponse(result)) return result
 */
export function isErrorResponse(
  result: { user: SessionUser } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse
}
