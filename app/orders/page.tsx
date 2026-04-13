'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronRight, Loader2, ShoppingBag, AlertCircle, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing-utils'
import { useUserMe } from '@/hooks/useUserMe'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: { id: string; name: string; image_url: string | null } | null
}

interface Order {
  id: string
  total_price: number
  status: string
  payment_status: string
  created_at: string
  order_items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-gray-400', icon: Clock, bg: 'bg-gray-500/20 border-gray-500/30' },
  pending:         { label: 'Pending',          color: 'text-yellow-400', icon: Clock, bg: 'bg-yellow-500/20 border-yellow-500/30' },
  processing:      { label: 'Processing',       color: 'text-blue-400',   icon: Package, bg: 'bg-blue-500/20 border-blue-500/30' },
  shipped:         { label: 'Shipped',          color: 'text-purple-400', icon: Truck, bg: 'bg-purple-500/20 border-purple-500/30' },
  delivered:       { label: 'Delivered',        color: 'text-emerald-400',icon: CheckCircle2, bg: 'bg-emerald-500/20 border-emerald-500/30' },
  cancelled:       { label: 'Cancelled',        color: 'text-red-400',    icon: XCircle, bg: 'bg-red-500/20 border-red-500/30' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-white/60', icon: Clock, bg: 'bg-white/10 border-white/20' }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}

export default function OrdersPage() {
  const { user, isLoading: meLoading } = useUserMe()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (meLoading || !user) {
      if (!meLoading && !user) {
        setOrders([])
        setError(null)
      }
      return
    }
    setOrdersLoading(true)
    setError(null)
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
          return
        }
        setOrders(d.orders ?? [])
      })
      .catch(() => setError('Failed to load orders'))
      .finally(() => setOrdersLoading(false))
  }, [meLoading, user])

  const loading = meLoading || (user ? ordersLoading : false)

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-white">My Orders</h1>
          <p className="mt-2 text-white/50">Track and manage your orders</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-mugen-crimson" />
          </div>
        )}

        {/* Guest — no /api/orders until signed in */}
        {!meLoading && !user && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-16 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-white/20" />
            <h2 className="mt-4 font-cinzel text-xl font-bold text-white">Sign in to see your orders</h2>
            <p className="mt-2 text-white/50">Your order history is available after you log in.</p>
            <Link
              href="/login?next=/orders"
              className="mt-6 inline-block rounded-xl bg-mugen-crimson px-6 py-3 font-bold text-white transition-all hover:bg-mugen-crimson/90"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Error */}
        {!loading && user && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-3 text-red-300">{error}</p>
            {error === 'Unauthorized' && (
              <Link href="/login?next=/orders" className="mt-4 inline-block text-sm text-mugen-gold hover:text-white">
                Login to view orders →
              </Link>
            )}
          </div>
        )}

        {/* Empty */}
        {!loading && user && !error && orders.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-16 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-white/20" />
            <h2 className="mt-4 font-cinzel text-xl font-bold text-white">No orders yet</h2>
            <p className="mt-2 text-white/50">When you place an order, it'll appear here.</p>
            <Link href="/shop" className="mt-6 inline-block rounded-xl bg-mugen-crimson px-6 py-3 font-bold text-white hover:bg-mugen-crimson/90 transition-all">
              Start Shopping
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && user && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const previewItems = order.order_items?.slice(0, 3) ?? []
              const more = (order.order_items?.length ?? 0) - 3

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:border-mugen-crimson/40 hover:bg-white/8"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Top Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.status} />
                        <span className="text-xs text-white/30">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Order ID */}
                      <p className="mt-1 font-mono text-[10px] text-white/25">#{order.id}</p>

                      {/* Item Previews */}
                      <div className="mt-3 flex items-center gap-2">
                        {previewItems.map((item) =>
                          item.products?.image_url ? (
                            <div key={item.id} className="relative h-10 w-10 overflow-hidden rounded-md bg-white/10 flex-shrink-0">
                              <Image src={item.products.image_url} alt={item.products.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div key={item.id} className="h-10 w-10 rounded-md bg-white/10 flex-shrink-0" />
                          )
                        )}
                        {more > 0 && (
                          <span className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-md bg-white/10 text-xs text-white/50">+{more}</span>
                        )}
                        <span className="ml-1 text-sm text-white/60">
                          {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Right: total + arrow */}
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                      <p className="font-cinzel text-xl font-bold text-mugen-gold">
                        {formatCurrency(order.total_price)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-white/40 group-hover:text-mugen-crimson transition-colors">
                        <span>View Details</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
