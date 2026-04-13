import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { formatMoneyINRFromPaise, formatOrderDateTime } from '@/lib/admin/format'
import { getLoginHistory } from '@/lib/auth/login-activity'
import UserProfileCharts from '@/components/admin/UserProfileCharts'
import {
  buildMonthlySpendSeries,
  buildPaymentStatusSlices,
  buildFulfillmentStatusSlices,
} from '@/lib/admin/user-profile-stats'
import { ShieldCheck, User2, Globe, Smartphone, Monitor, Mail, Phone, Fingerprint } from 'lucide-react'

type AdminUserOrderRow = {
  id: string
  total_price: number
  status: string
  payment_status: string
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    price: number
    products: { id: string; name: string; image_url: string | null } | null
  }> | null
}

function daysBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
}

async function getPaidSpendAggregate(
  supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('orders')
    .select('total_price.sum()', { head: false })
    .eq('user_id', userId)
    .eq('payment_status', 'completed')
  if (error) return null
  const sum = (data as unknown as Array<{ sum: number | null }> | null)?.[0]?.sum ?? null
  return typeof sum === 'number' ? sum : null
}

function deviceIcon(ua: string | null) {
  if (!ua) return <Globe className="h-3.5 w-3.5 text-white/30" />
  const lower = ua.toLowerCase()
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone'))
    return <Smartphone className="h-3.5 w-3.5 text-blue-400" />
  return <Monitor className="h-3.5 w-3.5 text-white/50" />
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type LoadedProfile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  auth_provider: string | null
  is_admin: boolean
  created_at: string | null
  last_sign_in_at: string | null
}

/**
 * Load profile row; if missing (or select fails on columns), fall back to Auth user
 * so we never 404 for a valid Supabase user id.
 */
async function loadProfileOrAuth(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ profile: LoadedProfile; source: 'profiles' | 'auth_only' } | null> {
  const full =
    'id, name, email, avatar_url, auth_provider, is_admin, created_at, last_sign_in_at'
  let res = await admin.from('profiles').select(full).eq('id', userId).maybeSingle()

  if (res.error && /column.*does not exist/i.test(res.error.message)) {
    res = await admin
      .from('profiles')
      .select('id, name, email, is_admin, created_at')
      .eq('id', userId)
      .maybeSingle()
  } else if (res.error) {
    console.error('[admin/users/[userId]] profiles:', res.error.message)
  }

  const row = res.data as LoadedProfile | null
  if (row?.id) {
    return {
      profile: {
        ...row,
        avatar_url: row.avatar_url ?? null,
        auth_provider: row.auth_provider ?? 'email',
        last_sign_in_at: row.last_sign_in_at ?? null,
      },
      source: 'profiles',
    }
  }

  const { data: aud, error: authErr } = await admin.auth.admin.getUserById(userId)
  if (authErr || !aud?.user) {
    return null
  }
  const u = aud.user
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  const nameFromMeta =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    null
  const avatarFromMeta =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null

  return {
    profile: {
      id: userId,
      name: nameFromMeta ?? u.email?.split('@')[0] ?? 'User',
      email: u.email ?? null,
      avatar_url: avatarFromMeta,
      auth_provider: (u.app_metadata?.provider as string) ?? 'email',
      is_admin: false,
      created_at: u.created_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
    },
    source: 'auth_only',
  }
}

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: rawId } = await params
  const userId = rawId.trim()
  if (!UUID_RE.test(userId)) {
    notFound()
  }

  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-red-200">
        {auth.error}
      </div>
    )
  }

  // Service role bypasses RLS so admins can open any customer's profile and orders.
  const admin = createAdminClient()

  const loaded = await loadProfileOrAuth(admin, userId)
  if (!loaded) {
    notFound()
  }
  const profile = loaded.profile
  const profileRowSource = loaded.source

  // Fetch orders
  const { data: orders, error: ordersErr } = await admin
    .from('orders')
    .select(
      `id, total_price, status, payment_status, created_at,
       order_items ( id, quantity, price, products ( id, name, image_url ) )`
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500)

  // Fetch login history (from login_activity table)
  const loginHistory = await getLoginHistory(userId, 20)

  // Supabase Auth record (email confirmation, phone)
  let authEmail: string | null = null
  let authPhone: string | null = null
  let emailConfirmedAt: string | null = null
  let authCreatedAt: string | null = null
  {
    const { data: authUserData, error: authLookupErr } = await admin.auth.admin.getUserById(userId)
    if (!authLookupErr && authUserData?.user) {
      const u = authUserData.user
      authEmail = u.email ?? null
      authPhone = u.phone ?? null
      emailConfirmedAt = u.email_confirmed_at ?? null
      authCreatedAt = u.created_at ?? null
    }
  }

  if (ordersErr) {
    return (
      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-cinzel text-3xl font-bold text-white">User</h1>
          <Link href="/admin/users" className="text-sm font-semibold text-white/70 hover:text-mugen-gold">
            ← Back
          </Link>
        </div>
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {ordersErr.message}
        </p>
      </div>
    )
  }

  const list = (orders ?? []) as unknown as AdminUserOrderRow[]
  const paid = list.filter((o) => o.payment_status === 'completed')
  const paidSpendAgg = await getPaidSpendAggregate(admin, userId)
  const totalSpend = paidSpendAgg ?? paid.reduce((s, o) => s + (o.total_price ?? 0), 0)

  const orderCount = list.length
  const firstOrder = list.length ? new Date(list[list.length - 1].created_at) : null
  const lastOrder = list.length ? new Date(list[0].created_at) : null
  const avgDaysBetween =
    orderCount >= 2 && firstOrder && lastOrder ? daysBetween(firstOrder, lastOrder) / (orderCount - 1) : null

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const ordersLast30d = list.filter((o) => new Date(o.created_at) >= thirtyDaysAgo).length

  const monthlyChart = buildMonthlySpendSeries(list)
  const paymentChart = buildPaymentStatusSlices(list)
  const fulfillmentChart = buildFulfillmentStatusSlices(list)

  const p = profile as LoadedProfile
  const profileEmail = p.email ?? null
  const displayEmail = profileEmail || authEmail

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {p.avatar_url ? (
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-mugen-gold/30">
              <Image src={p.avatar_url} alt={p.name ?? 'User'} fill className="object-cover" />
            </span>
          ) : (
            <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-mugen-crimson/20 text-xl font-bold text-mugen-crimson ring-2 ring-mugen-crimson/30">
              {(p.name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="font-cinzel text-3xl font-bold text-white">{p.name ?? 'Unknown User'}</h1>
            <p className="mt-1 text-sm text-white/50">{displayEmail ?? '—'}</p>
            <div className="mt-2 flex items-center gap-2">
              {p.is_admin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-mugen-gold/30 bg-mugen-gold/10 px-3 py-1 text-xs font-semibold text-mugen-gold">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">
                  <User2 className="h-3 w-3" /> Customer
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {p.auth_provider ?? 'email'}
              </span>
            </div>
          </div>
        </div>
        <Link href="/admin/users" className="text-sm font-semibold text-white/70 hover:text-mugen-gold">
          ← Back to users
        </Link>
      </div>

      {profileRowSource === 'auth_only' && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No row in <code className="text-amber-200">profiles</code> for this user — showing data from{' '}
          <strong>Supabase Auth</strong> only. Add a profile row (e.g. signup trigger) for full sync.
        </div>
      )}

      {/* Complete profile (DB + Auth) */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-mugen-dark/30 p-6">
        <h2 className="font-cinzel text-lg font-bold text-white">Complete profile</h2>
        <p className="mt-1 text-xs text-white/40">Stored in <code className="text-mugen-gold/90">profiles</code> plus Supabase Auth</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="flex gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <Fingerprint className="h-4 w-4 shrink-0 text-white/35 mt-0.5" />
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/35">User ID</dt>
              <dd className="font-mono text-xs text-white/80 break-all">{userId}</dd>
            </div>
          </div>
          <div className="flex gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <Mail className="h-4 w-4 shrink-0 text-white/35 mt-0.5" />
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Email</dt>
              <dd className="text-xs text-white/80">{displayEmail ?? '—'}</dd>
              {profileEmail && authEmail && profileEmail !== authEmail && (
                <p className="text-[10px] text-white/40 mt-1">Auth: {authEmail}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <Phone className="h-4 w-4 shrink-0 text-white/35 mt-0.5" />
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Phone</dt>
              <dd className="text-xs text-white/80">{authPhone ?? '—'}</dd>
            </div>
          </div>
          <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Email confirmed</dt>
            <dd className="text-xs text-white/80">
              {emailConfirmedAt ? new Date(emailConfirmedAt).toLocaleString('en-IN') : 'Not confirmed'}
            </dd>
          </div>
          <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Profile created</dt>
            <dd className="text-xs text-white/80">
              {p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '—'}
            </dd>
          </div>
          <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Auth account created</dt>
            <dd className="text-xs text-white/80">
              {authCreatedAt ? new Date(authCreatedAt).toLocaleString('en-IN') : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* KPI cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-mugen-dark/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Total Spend</p>
          <p className="mt-2 font-cinzel text-2xl font-bold text-mugen-gold">
            {formatMoneyINRFromPaise(totalSpend)}
          </p>
          <p className="mt-1 text-xs text-white/50">Paid orders: {paid.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-mugen-dark/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Orders</p>
          <p className="mt-2 font-cinzel text-2xl font-bold text-white">{orderCount}</p>
          <p className="mt-1 text-xs text-white/50">Last 30d: {ordersLast30d}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-mugen-dark/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Avg Days/Order</p>
          <p className="mt-2 font-cinzel text-2xl font-bold text-white">
            {avgDaysBetween == null ? '—' : avgDaysBetween.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {lastOrder ? `Last: ${lastOrder.toLocaleDateString('en-IN')}` : 'No orders'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-mugen-dark/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Joined</p>
          <p className="mt-2 font-cinzel text-2xl font-bold text-white">
            {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
          </p>
          <p className="mt-1 text-xs text-white/50">
            Last login:{' '}
            {p.last_sign_in_at
              ? new Date(p.last_sign_in_at).toLocaleDateString('en-IN')
              : '—'}
          </p>
        </div>
      </div>

      {/* Charts: spend / status */}
      <div className="mt-10">
        <h2 className="font-cinzel text-xl font-bold text-white">Activity & orders</h2>
        <p className="mt-1 text-sm text-white/45">Spend by month (paid orders) and status mix</p>
        <div className="mt-4">
          <UserProfileCharts
            monthly={monthlyChart}
            paymentStatus={paymentChart}
            fulfillmentStatus={fulfillmentChart}
          />
        </div>
      </div>

      {/* Login History */}
      <div className="mt-10">
        <h2 className="font-cinzel text-xl font-bold text-white">Login History</h2>
        <p className="mt-1 text-sm text-white/40">Last {loginHistory.length} sign-ins</p>

        {loginHistory.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-mugen-dark/30 px-6 py-8 text-center text-sm text-white/40">
            No login history yet.{' '}
            <span className="text-xs">
              (Run the <code className="text-mugen-gold">login_activity.sql</code> migration if the table is missing.)
            </span>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-mugen-dark/30">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loginHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs text-white/70">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                        {log.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/50">
                      {log.ip_address ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" title={log.user_agent ?? ''}>
                        {deviceIcon(log.user_agent)}
                        <span className="max-w-[240px] truncate text-xs text-white/40">
                          {log.user_agent ?? '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-white">Orders</h2>
            <p className="mt-1 text-sm text-white/50">Latest {list.length} orders (newest first)</p>
          </div>
          <Link
            href="/admin/orders"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            All orders →
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-mugen-dark/30 px-6 py-10 text-center text-white/50">
            No orders for this user.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {list.map((o) => (
              <div key={o.id} className="overflow-hidden rounded-xl border border-white/10 bg-mugen-dark/30">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="font-mono text-xs text-white/50">{o.id}</p>
                    <p className="mt-1 text-xs text-white/60">{formatOrderDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      Payment: {o.payment_status}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      Fulfillment: {o.status}
                    </span>
                    <span className="font-cinzel text-lg font-bold text-mugen-gold">
                      {formatMoneyINRFromPaise(o.total_price)}
                    </span>
                  </div>
                </div>
                <ul className="divide-y divide-white/5">
                  {(o.order_items ?? []).map((line) => (
                    <li key={line.id} className="px-4 py-2 text-sm text-white/80">
                      <span className="font-semibold text-white/90">{line.products?.name ?? 'Product'}</span>{' '}
                      <span className="text-white/60">× {line.quantity}</span>
                      <span className="text-white/40"> @ {formatMoneyINRFromPaise(line.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
