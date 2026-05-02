'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { shouldOptimizeImageSrc } from '@/lib/image-allowlist'
import { useSearchParams } from 'next/navigation'
import { Loader2, Package, ShoppingBag, Home, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing-utils'
import { BRAND_LOGO_PNG_SRC } from '@/lib/constants'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: { id: string; name: string; image_url: string | null; category: string } | null
}

interface Order {
  id: string
  total_price: number
  subtotal: number
  delivery_charge: number
  discount_amount: number
  gst_amount: number
  status: string
  payment_status: string
  created_at: string
  razorpay_payment_id?: string | null
  razorpay_order_id?: string | null
  coupon_code?: string | null
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

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const paymentIdFromUrl = searchParams.get('payment_id')
  const devPreview = process.env.NODE_ENV === 'development' && searchParams.get('dev') === '1'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (devPreview) {
      setLoading(false)
      return
    }
    if (!orderId) {
      setLoading(false)
      return
    }
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) setOrder(d.order)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Clear spin wheel reward since checkout was successful
    localStorage.removeItem('spinReward')
    localStorage.removeItem('spinUsed')
  }, [orderId, devPreview])

  const transactionId =
    paymentIdFromUrl || order?.razorpay_payment_id || (devPreview ? 'pay_DevPreview00' : '—')

  const trackHref = orderId ? `/orders/${orderId}` : '/orders'
  const items = order?.order_items ?? []

  return (
    <main className="min-h-screen bg-black pt-24 pb-24 text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4">
        <div className="group relative w-full max-w-lg" style={{ perspective: '1200px' }}>
          <div
            className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-400/35 via-sky-500/25 to-cyan-600/40 opacity-90 blur-[1.5px]"
            aria-hidden
          />
          <div
            className="relative overflow-hidden rounded-2xl border border-cyan-500/45 bg-gradient-to-b from-cyan-950/55 via-[#151820]/95 to-[#07080c] p-8 shadow-[0_0_52px_-10px_rgba(6,182,212,0.42)] backdrop-blur-2xl transition-all duration-500 md:group-hover:-translate-y-1 md:group-hover:shadow-[0_0_72px_-8px_rgba(6,182,212,0.55)]"
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-sky-900/20 opacity-70 md:group-hover:opacity-100 transition-opacity duration-500" />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-2/5 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-all duration-700 ease-out md:group-hover:translate-x-[320%] md:group-hover:opacity-100"
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_-15%,rgba(6,182,212,0.22),transparent_60%)]" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <Image
                src={BRAND_LOGO_PNG_SRC}
                alt=""
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded-full object-contain object-center ring-2 ring-cyan-400/30 drop-shadow-[0_0_24px_rgba(6,182,212,0.5)]"
                priority
              />
              <h1 className="mt-7 font-cinzel text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Payment Successful
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-cyan-100/65">
                Thank you — your payment went through and your order is confirmed.
              </p>

              <div className="mt-8 w-full rounded-xl border border-cyan-500/25 bg-black/45 px-4 py-3 text-left shadow-inner shadow-cyan-950/40">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/95">
                  Transaction ID
                </p>
                <p className="mt-1.5 break-all font-mono text-xs text-white/90 sm:text-sm">{transactionId}</p>
                {orderId && !devPreview && (
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-white/40">
                    Order{' '}
                    <span className="font-mono text-cyan-400/85">{orderId.slice(0, 8)}…</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={trackHref}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-8 py-4 text-center text-base font-bold text-white shadow-[0_0_32px_-4px_rgba(6,182,212,0.55)] transition hover:from-cyan-500 hover:to-sky-500 hover:shadow-[0_0_44px_-2px_rgba(6,182,212,0.7)]"
          >
            <Package className="h-5 w-5 shrink-0" />
            Let&apos;s Track It
          </Link>
          <Link
            href="/shop"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-center font-semibold text-white/90 transition hover:bg-white/10"
          >
            <ShoppingBag className="h-5 w-5 shrink-0" />
            Continue Shopping
          </Link>
        </div>

        {devPreview && (
          <p className="mt-8 text-center text-xs text-amber-400/90">
            Development preview — mock data only (no order loaded).
          </p>
        )}

        {!orderId && !devPreview && !loading && (
          <p className="mt-10 text-center text-sm text-white/50">
            No order reference in this link. Open success from checkout after payment, or use the dev preview below.
          </p>
        )}

        {loading && !devPreview && orderId && (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/35" />
          </div>
        )}

        {!loading && !devPreview && order && orderId && (
          <div className="mt-14 w-full max-w-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-4 py-3">
              <span className="text-sm text-white/60">Invoice (HTML, print-friendly)</span>
              <a
                href={`/api/orders/${orderId}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
              >
                <FileText className="h-4 w-4" />
                Open invoice
              </a>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="mb-4 font-cinzel text-lg font-bold text-white">Order Items</h2>
              <div className="space-y-4">
                {items.map((item) => (
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
                      <p className="text-xs text-white/50">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-white">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h2 className="mb-4 font-cinzel text-lg font-bold text-white">Price Breakdown</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Item Total</span>
                  <span>{formatCurrency(order.subtotal)}</span>
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
                <div className="flex justify-between border-t border-white/5 pt-2 text-xs text-white/50">
                  <span>Subtotal (items + delivery)</span>
                  <span>{formatCurrency(order.subtotal + order.delivery_charge)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon discount</span>
                    <span>−{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.gst_amount > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>GST</span>
                    <span>{formatCurrency(order.gst_amount)}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                  <span>Total Paid</span>
                  <span className="text-mugen-gold">{formatCurrency(order.total_price)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <p className="pt-2 text-center text-xs font-medium text-emerald-400/90">
                    You saved {formatCurrency(order.discount_amount)} on this order
                  </p>
                )}
              </div>
            </div>

            {order.addresses && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <h2 className="mb-3 font-cinzel text-lg font-bold text-white">Delivering To</h2>
                <p className="text-sm font-semibold text-white">{order.addresses.name}</p>
                <p className="mt-1 text-sm text-white/60">{order.addresses.address}</p>
                <p className="text-sm text-white/60">
                  {order.addresses.city}, {order.addresses.state}
                </p>
                <p className="text-sm text-white/50">{order.addresses.phone1}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            <Home className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>

    </main>
  )
}
