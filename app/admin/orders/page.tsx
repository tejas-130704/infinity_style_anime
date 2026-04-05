'use client'

import { useCallback, useEffect, useState } from 'react'

type OrderRow = {
  id: string
  user_id: string
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

const STATUS_OPTIONS = [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function label(s: string) {
  return s.replace(/_/g, ' ')
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/admin/orders')
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(j.error || 'Failed to load orders')
      return
    }
    setOrders(j.orders ?? [])
  }, [])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error || 'Update failed')
        return
      }
      await load()
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <h1 className="font-cinzel text-3xl font-bold text-white">Orders</h1>
      <p className="mt-2 text-white/60">Update fulfillment status. Customers see changes on their order history.</p>

      {error && (
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      {loading ? (
        <p className="mt-10 text-white/60">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 rounded-xl border border-white/10 bg-mugen-dark/40 px-6 py-10 text-center text-white/60">
          No orders yet. They appear here after checkout.
        </p>
      ) : (
        <div className="mt-10 space-y-6">
          {orders.map((o) => (
            <div
              key={o.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-mugen-dark/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                <div>
                  <p className="font-mono text-xs text-white/50">{o.id}</p>
                  <p className="text-sm text-white/60">
                    {new Date(o.created_at).toLocaleString()} · user {o.user_id.slice(0, 8)}…
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-mugen-gold">{formatPrice(o.total_price)}</span>
                  <span className="text-xs text-white/50">{o.payment_status}</span>
                  <select
                    className="rounded-lg border border-mugen-gray bg-mugen-black/80 px-3 py-1.5 text-sm text-white"
                    value={o.status}
                    disabled={updating === o.id}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ul className="divide-y divide-white/5">
                {(o.order_items ?? []).map((line) => (
                  <li key={line.id} className="px-4 py-2 text-sm text-white/80 sm:px-5">
                    {line.products?.name ?? 'Product'} × {line.quantity} @ {formatPrice(line.price)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
