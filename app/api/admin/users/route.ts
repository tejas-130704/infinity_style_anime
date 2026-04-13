import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminSession, isErrorResponse } from '@/lib/auth/session-guard'
import { apiLimiter, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const QuerySchema = z.object({
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

/**
 * GET /api/admin/users
 * JSON API for admin users list with pagination, search, avatar, last login.
 * Admin-only route.
 */
export async function GET(req: Request) {
  const { success } = apiLimiter.check(getClientIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const result = await requireAdminSession()
  if (isErrorResponse(result)) return result

  // Parse + validate query params
  const { searchParams } = new URL(req.url)
  const parseResult = QuerySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 50,
  })

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parseResult.error.flatten() },
      { status: 400 }
    )
  }

  const { q, page, limit } = parseResult.data
  const from = (page - 1) * limit
  const to = from + limit - 1

  const admin = createAdminClient()

  let query = admin
    .from('profiles')
    .select(
      'id, name, email, avatar_url, is_admin, auth_provider, created_at, last_sign_in_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q && q.length > 0) {
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,id.eq.${q.length === 36 ? q : '00000000-0000-0000-0000-000000000000'}`
    )
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/admin/users] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / limit))

  return NextResponse.json({
    users: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  })
}
