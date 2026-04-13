'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'
import { Package, IndianRupee, CalendarDays, Loader2, LayoutDashboard } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing-utils'
import { createClient } from '@/lib/supabase/client'
import { useUserMe } from '@/hooks/useUserMe'
import type { MonthlyPoint } from './AccountSpendChart'

const AccountSpendChart = dynamic(
  () => import('./AccountSpendChart').then((m) => m.AccountSpendChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-white/5" /> }
)

type Summary = {
  stats: { orderCount: number; paidOrderCount: number; totalSpendPaisa: number }
  monthly: MonthlyPoint[]
  recentOrders: Array<{
    id: string
    total_price: number
    status: string
    payment_status: string
    created_at: string
  }>
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending_payment: 'Pending payment',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

export function AccountDashboard() {
  const { status: nextAuthStatus } = useSession()
  const { user: meUser, isLoading: meLoading } = useUserMe()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const sessionReady = nextAuthStatus !== 'loading'
  const authed = !!meUser

  useEffect(() => {
    if (!authed) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/account/summary')
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || 'Could not load dashboard')
        }
        const data = (await res.json()) as Summary
        if (!cancelled) setSummary(data)
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authed])

  if (!sessionReady || meLoading) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto max-w-5xl px-4 text-white/70">Loading account…</div>
      </main>
    )
  }

  if (!meUser) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="rounded-xl border border-white/10 bg-mugen-dark/40 p-8 text-center">
            <p className="text-white/70">You are not signed in.</p>
            <Link href="/login?next=/account" className="mt-4 inline-block font-semibold text-mugen-gold hover:text-white">
              Go to login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const user = meUser

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-cinzel text-3xl font-bold text-white md:text-4xl">Your dashboard</h1>
            <p className="mt-1 text-white/55">
              Welcome back{user.name ? `, ${user.name}` : ''} — orders, spending, and activity at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border border-mugen-gold/50 bg-mugen-gold/15 px-4 py-2 text-sm font-semibold text-mugen-gold hover:bg-mugen-gold/25"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Dashboard
              </Link>
            )}
            <Link
              href="/account/orders"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              All orders
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                } catch {
                  // non-fatal
                }
                await signOut({ callbackUrl: '/login' })
                toast.success('Signed out')
              }}
              className="rounded-lg border border-red-500/35 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/45"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-mugen-dark/40 p-6 lg:col-span-2">
            <h2 className="font-cinzel text-lg font-semibold text-white">Profile</h2>
            <p className="mt-1 text-xs text-white/45">
              {nextAuthStatus === 'authenticated' ? 'Signed in with Google' : 'Signed in'}
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-white/50">Name</dt>
                <dd className="text-white">{user.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-white/50">Email</dt>
                <dd className="text-white">{user.email}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-white/50">Phone</dt>
                <dd className="text-white">{user.phone ?? 'Add in checkout'}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-white/50">Role</dt>
                <dd className="capitalize text-white">{user.role}</dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-white/50">Member since</dt>
                <dd className="text-white/90">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>
            <Link href="/shop" className="mt-6 inline-flex rounded-lg border border-mugen-gold/40 bg-mugen-gold/10 px-4 py-2 text-sm font-semibold text-mugen-gold hover:bg-mugen-gold/20">
              Continue shopping
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-mugen-dark/80 to-mugen-black/60 p-5">
              <div className="flex items-center gap-2 text-white/55">
                <Package className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Orders</span>
              </div>
              <p className="mt-2 font-cinzel text-3xl font-bold text-white">
                {summary ? summary.stats.orderCount : '—'}
              </p>
              <p className="mt-1 text-xs text-white/40">All time</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-mugen-dark/80 to-mugen-black/60 p-5">
              <div className="flex items-center gap-2 text-white/55">
                <IndianRupee className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Total spent</span>
              </div>
              <p className="mt-2 font-cinzel text-3xl font-bold text-mugen-gold">
                {summary ? formatCurrency(summary.stats.totalSpendPaisa) : '—'}
              </p>
              <p className="mt-1 text-xs text-white/40">Paid orders only</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-mugen-dark/80 to-mugen-black/60 p-5">
              <div className="flex items-center gap-2 text-white/55">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Paid orders</span>
              </div>
              <p className="mt-2 font-cinzel text-3xl font-bold text-white">
                {summary ? summary.stats.paidOrderCount : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-mugen-dark/40 p-6">
            <h2 className="font-cinzel text-lg font-semibold text-white">Spending (last 6 months)</h2>
            <p className="mt-1 text-xs text-white/45">Based on completed payments</p>
            {loadError && <p className="mt-4 text-sm text-red-400/90">{loadError}</p>}
            {!summary && !loadError && authed && (
              <div className="mt-12 flex justify-center text-white/40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {summary && <div className="mt-6"><AccountSpendChart data={summary.monthly} /></div>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-mugen-dark/40 p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-cinzel text-lg font-semibold text-white">Recent orders</h2>
              <Link href="/account/orders" className="text-xs font-semibold text-mugen-gold hover:text-white">
                View all
              </Link>
            </div>
            {!summary?.recentOrders?.length ? (
              <p className="mt-8 text-center text-sm text-white/50">
                No orders yet.{' '}
                <Link href="/shop" className="font-semibold text-mugen-gold hover:text-white">
                  Browse the shop
                </Link>
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {summary.recentOrders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                    <div>
                      <p className="font-mono text-xs text-white/50">{o.id.slice(0, 8)}…</p>
                      <p className="text-xs text-white/40">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-mugen-gold">{formatCurrency(o.total_price)}</p>
                      <p className="text-xs text-white/55">{statusLabel(o.status)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
