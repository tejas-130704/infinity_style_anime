import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

/** Fulfillment still in progress (excludes shipped/delivered/cancelled). */
const ACTION_NEEDED_STATUSES = ['pending_payment', 'pending', 'processing'] as const

export type AdminDashboardKpis = {
  productCount: number
  orderCount: number
  pendingCount: number
  totalUsers: number
  newUsersToday: number
  newUsersWeek: number
  recentSignups: Array<{
    id: string
    name: string | null
    email: string | null
    avatar_url: string | null
    created_at: string
    auth_provider: string | null
  }>
}

function startOfLocalDayIso(now: Date): string {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

/**
 * Aggregates for the admin dashboard. Prefers the service-role client so counts
 * match the database even if RLS + count/head queries behave inconsistently.
 * Falls back to the user-scoped client when `SUPABASE_SERVICE_ROLE_KEY` is missing (dev).
 */
export async function getAdminDashboardKpis(userScoped: SupabaseClient): Promise<AdminDashboardKpis> {
  let db: SupabaseClient
  try {
    db = createAdminClient()
  } catch {
    db = userScoped
  }

  const now = new Date()
  const todayStart = startOfLocalDayIso(now)
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    productRes,
    orderRes,
    pendingRes,
    usersRes,
    todayRes,
    weekRes,
    recentRes,
  ] = await Promise.all([
    db.from('products').select('*', { count: 'exact', head: true }),
    db.from('orders').select('*', { count: 'exact', head: true }),
    db.from('orders').select('*', { count: 'exact', head: true }).in('status', [...ACTION_NEEDED_STATUSES]),
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
    db
      .from('profiles')
      .select('id, name, email, avatar_url, created_at, auth_provider')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const pickCount = (res: { count: number | null; error: { message: string } | null }, label: string) => {
    if (res.error && process.env.NODE_ENV === 'development') {
      console.warn(`[admin/dashboard] ${label}:`, res.error.message)
    }
    return res.count ?? 0
  }

  if (recentRes.error && process.env.NODE_ENV === 'development') {
    console.warn('[admin/dashboard] recent signups:', recentRes.error.message)
  }

  return {
    productCount: pickCount(productRes, 'products'),
    orderCount: pickCount(orderRes, 'orders'),
    pendingCount: pickCount(pendingRes, 'pending orders'),
    totalUsers: pickCount(usersRes, 'profiles'),
    newUsersToday: pickCount(todayRes, 'signups today'),
    newUsersWeek: pickCount(weekRes, 'signups week'),
    recentSignups: (recentRes.data ?? []) as AdminDashboardKpis['recentSignups'],
  }
}
