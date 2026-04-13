'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Mail, Loader2, AlertCircle, XCircle, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing-utils'
import { shouldOptimizeImageSrc } from '@/lib/image-allowlist'
import { useUserMe } from '@/hooks/useUserMe'
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline'
import type { TimelineStep } from '@/lib/order/tracking'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: { id: string; name: string; image_url: string | null; category: string; slug: string | null } | null
}

interface OrderPayload {
  id: string
  total_price: number
  subtotal: number
  delivery_charge: number
  discount_amount: number
  gst_amount: number
  status: string
  payment_status: string
  razorpay_order_id: string | null
  created_at: string
  addresses: {
    name: string
    phone1: string
    email: string
    address: string
    city: string
    state: string
  } | null
  order_items: OrderItem[]
}

type TrackingPayload = {
  steps: TimelineStep[]
  message: string
  deliveryExpectedLine: string
  fulfillment_status: string | null
}

export default function OrderDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { user, isLoading: meLoading } = useUserMe()

  const [order, setOrder] = useState<OrderPayload | null>(null)
  const [tracking, setTracking] = useState<TrackingPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    if (meLoading) return
    if (!user) {
      setOrder(null)
      setTracking(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/order/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
          setOrder(null)
          setTracking(null)
        } else {
          setOrder(d.order)
          setTracking(d.tracking ?? null)
          setError(null)
        }
      })
      .catch(() => {
        setError('Failed to load order')
        setOrder(null)
        setTracking(null)
      })
      .finally(() => setLoading(false))
  }, [id, meLoading, user])

  if (loading) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-mugen-crimson" />
        </div>
      </main>
    )
  }

  if (!meLoading && !user) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <Package className="mx-auto h-12 w-12 text-white/30" />
          <p className="mt-4 text-white/80">Sign in to view this order.</p>
          <Link
            href={`/login?next=/orders/${encodeURIComponent(id)}`}
            className="mt-6 inline-block rounded-xl bg-mugen-crimson px-6 py-3 text-sm font-bold text-white hover:bg-mugen-crimson/90"
          >
            Sign in
          </Link>
          <div className="mt-4">
            <Link href="/orders" className="text-sm text-mugen-gold hover:text-white">
              ← Back to Orders
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 text-red-300">{error || 'Order not found'}</p>
          <Link href="/orders" className="mt-6 inline-block text-sm text-mugen-gold hover:text-white">
            ← Back to Orders
          </Link>
        </div>
      </main>
    )
  }

  const isCancelled = order.status === 'cancelled'

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-2xl px-4">
        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>

        <div className="mb-8">
          <h1 className="font-cinzel text-3xl font-bold text-white">Order Details</h1>
          <p className="mt-1 font-mono text-xs text-white/30">#{order.id}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isCancelled
                  ? 'border-red-500/30 bg-red-500/20 text-red-400'
                  : order.payment_status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                    : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
              }`}
            >
              Payment: {order.payment_status === 'completed' ? 'Paid' : order.payment_status}
            </span>
            <span className="text-xs text-white/40">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {!isCancelled && tracking && order.payment_status === 'completed' && (
            <OrderTrackingTimeline
              steps={tracking.steps}
              message={tracking.message}
              deliveryExpectedLine={tracking.deliveryExpectedLine}
            />
          )}

          {!isCancelled && order.payment_status !== 'completed' && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Tracking will be available after your payment is confirmed.
            </div>
          )}

          {isCancelled && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
              <XCircle className="mx-auto h-8 w-8 text-red-400" />
              <p className="mt-2 font-semibold text-red-300">This order has been cancelled</p>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h2 className="mb-4 font-cinzel text-lg font-bold text-white">Items ({order.order_items.length})</h2>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.products?.image_url ? (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                      <Image
                        src={item.products.image_url}
                        alt={item.products.name}
                        fill
                        className="object-cover"
                        unoptimized={!shouldOptimizeImageSrc(item.products.image_url)}
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.products?.name ?? 'Product'}</p>
                    <p className="text-xs capitalize text-white/50">
                      {item.products?.category?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatCurrency(item.price * item.quantity)}</p>
                    <p className="text-xs text-white/40">{formatCurrency(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h2 className="mb-4 font-cinzel text-lg font-bold text-white">Price Breakdown</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Original Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>−{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/70">
                <span>GST (18%)</span>
                <span>{formatCurrency(order.gst_amount)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Delivery</span>
                <span>
                  {order.delivery_charge === 0 ? (
                    <span className="text-emerald-400">FREE</span>
                  ) : (
                    formatCurrency(order.delivery_charge)
                  )}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                <span>Total Paid</span>
                <span className="text-mugen-gold">{formatCurrency(order.total_price)}</span>
              </div>
            </div>
          </div>

          {order.addresses && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="mb-4 font-cinzel text-lg font-bold text-white">Delivery Address</h2>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-mugen-crimson" />
                  <div>
                    <p className="font-semibold text-white">{order.addresses.name}</p>
                    <p className="text-white/60">{order.addresses.address}</p>
                    <p className="text-white/60">
                      {order.addresses.city}, {order.addresses.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Phone className="h-4 w-4 flex-shrink-0 text-white/30" />
                  <span>{order.addresses.phone1}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Mail className="h-4 w-4 flex-shrink-0 text-white/30" />
                  <span>{order.addresses.email}</span>
                </div>
              </div>
            </div>
          )}

          {order.razorpay_order_id && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs text-white/30">
                Razorpay Ref:{' '}
                <span className="font-mono text-white/40">{order.razorpay_order_id}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
