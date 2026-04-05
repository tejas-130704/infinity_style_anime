'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingBag, ArrowRight } from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{ productCount: number; orderCount: number; pendingCount: number } | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/admin/stats')
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(j.error || 'Could not load stats')
      return
    }
    setStats({
      productCount: j.productCount ?? 0,
      orderCount: j.orderCount ?? 0,
      pendingCount: j.pendingCount ?? 0,
    })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const cards = [
    {
      label: 'Products',
      value: stats?.productCount ?? '—',
      href: '/admin/products',
      icon: Package,
      hint: 'Catalog items',
    },
    {
      label: 'Orders',
      value: stats?.orderCount ?? '—',
      href: '/admin/orders',
      icon: ShoppingBag,
      hint: 'All time',
    },
    {
      label: 'Action needed',
      value: stats?.pendingCount ?? '—',
      href: '/admin/orders',
      icon: LayoutDashboard,
      hint: 'Pending payment or processing',
    },
  ]

  return (
    <div>
      <h1 className="font-cinzel text-3xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Overview of your store. Run <code className="text-mugen-gold">seed_dummy_data.sql</code> in Supabase if the
        shop looks empty.
      </p>

      {error && (
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
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
            <p className="mt-1 font-cinzel text-3xl font-bold text-white">{c.value}</p>
            <p className="mt-1 text-sm font-semibold text-white/80">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-white/10 bg-mugen-dark/30 p-6">
        <h2 className="font-cinzel text-lg text-white">Quick links</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li>
            <Link href="/admin/products" className="text-mugen-gold hover:text-white">
              Manage products →
            </Link>
          </li>
          <li>
            <Link href="/admin/orders" className="text-mugen-gold hover:text-white">
              View & update order status →
            </Link>
          </li>
          <li>
            <Link href="/shop" className="text-white/70 hover:text-white">
              Open storefront →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
