import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Package, ShoppingBag, ArrowRight, Users, TrendingUp, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminDashboardKpis } from '@/lib/admin/dashboard-stats'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-red-200">
        {auth.error}
      </div>
    )
  }

  const {
    productCount,
    orderCount,
    pendingCount,
    totalUsers,
    newUsersToday,
    newUsersWeek,
    recentSignups,
  } = await getAdminDashboardKpis(supabase)

  const statCards = [
    { label: 'Products', value: productCount ?? 0, href: '/admin/products', icon: Package, hint: 'Catalog items' },
    { label: 'Orders', value: orderCount ?? 0, href: '/admin/orders', icon: ShoppingBag, hint: 'All time' },
    { label: 'Action Needed', value: pendingCount ?? 0, href: '/admin/orders', icon: LayoutDashboard, hint: 'Pending or processing' },
    { label: 'Total Users', value: totalUsers ?? 0, href: '/admin/users', icon: Users, hint: 'Registered accounts' },
    { label: 'New Today', value: newUsersToday ?? 0, href: '/admin/users', icon: UserPlus, hint: 'Signups today' },
    { label: 'New This Week', value: newUsersWeek ?? 0, href: '/admin/users', icon: TrendingUp, hint: 'Signups (7 days)' },
  ]

  return (
    <div>
      <h1 className="font-cinzel text-3xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Store overview and user activity at a glance.
      </p>

      {/* KPI Grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group rounded-xl border border-white/10 bg-mugen-dark/50 p-5 transition-colors hover:border-mugen-glow/40"
          >
            <div className="flex items-start justify-between gap-2">
              <c.icon className="h-8 w-8 text-mugen-gold/90" />
              <ArrowRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-mugen-gold" />
            </div>
            <p className="mt-4 font-sans text-xs uppercase tracking-wider text-white/50">{c.hint}</p>
            <p className="mt-1 font-cinzel text-3xl font-bold text-white">{c.value.toLocaleString()}</p>
            <p className="mt-1 text-sm font-semibold text-white/80">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Signups */}
      <div className="mt-12 rounded-xl border border-white/10 bg-mugen-dark/30 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel text-lg text-white">Recent Signups</h2>
          <Link href="/admin/users" className="text-xs font-semibold text-mugen-gold hover:text-white">
            View all →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {(recentSignups ?? []).map((u: any) => (
            <li key={u.id} className="flex items-center gap-3 py-3">
              {u.avatar_url ? (
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  <Image src={u.avatar_url} alt={u.name ?? 'User'} fill className="object-cover" />
                </span>
              ) : (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mugen-crimson/20 text-xs font-bold text-mugen-crimson">
                  {(u.name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/85">{u.name ?? '—'}</p>
                <p className="truncate text-xs text-white/40">{u.email ?? u.id.slice(0, 12) + '…'}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs text-white/40">
                  {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
                <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
                  {u.auth_provider ?? 'email'}
                </span>
              </div>
              <Link
                href={`/admin/users/${u.id}`}
                className="ml-2 shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-white/50 hover:border-mugen-gold/30 hover:text-mugen-gold"
              >
                View
              </Link>
            </li>
          ))}
          {(recentSignups ?? []).length === 0 && (
            <li className="py-6 text-center text-sm text-white/30">No users yet.</li>
          )}
        </ul>
      </div>

      {/* Quick links */}
      <div className="mt-6 rounded-xl border border-white/10 bg-mugen-dark/30 p-6">
        <h2 className="font-cinzel text-lg text-white">Quick Links</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li><Link href="/admin/products" className="text-mugen-gold hover:text-white">Manage products →</Link></li>
          <li><Link href="/admin/orders" className="text-mugen-gold hover:text-white">View & update order status →</Link></li>
          <li><Link href="/admin/analytics" className="text-mugen-gold hover:text-white">Analytics & revenue charts →</Link></li>
          <li><Link href="/shop" className="text-white/70 hover:text-white">Open storefront →</Link></li>
        </ul>
      </div>
    </div>
  )
}
