import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSessionSafe } from '@/lib/auth/safe-get-server-session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/pricing-utils'

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

function paymentLabel(payment: string) {
  const map: Record<string, string> = {
    pending: 'Payment pending',
    completed: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  }
  return map[payment] ?? payment
}

type ProductRow = { id: string; name: string; image_url: string | null }

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const session = await getServerSessionSafe()
  const nextUid = (session?.user as { id?: string } | undefined)?.id
  const userId = user?.id ?? nextUid
  if (!userId) {
    redirect('/login?next=/account/orders')
  }

  const db = createAdminClient()
  const { data: orders } = await db
    .from('orders')
    .select(
      `
      id,
      total_price,
      status,
      payment_status,
      created_at,
      order_items (
        id,
        quantity,
        price,
        products ( id, name, image_url )
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const list = orders ?? []

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-cinzel text-3xl font-bold text-white">Orders</h1>
          <Link href="/account" className="text-sm font-semibold text-mugen-gold hover:text-white">
            Account
          </Link>
        </div>

        {list.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-mugen-dark/40 px-6 py-10 text-center text-white/70">
            No orders yet.{' '}
            <Link href="/shop" className="font-semibold text-mugen-gold hover:text-white">
              Browse the shop
            </Link>
          </p>
        ) : (
          <ul className="space-y-6">
            {list.map((order) => (
              <li
                key={order.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-mugen-dark/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-white/50">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 font-sans text-sm text-white/80">
                      <span className="text-white/50">Order </span>
                      <span className="font-mono text-xs text-white/90">{order.id.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-mugen-gold">{formatCurrency(order.total_price)}</p>
                    <p className="text-sm text-white/70">{statusLabel(order.status)}</p>
                    <p className="text-xs text-white/50">{paymentLabel(order.payment_status)}</p>
                    {order.payment_status === 'completed' && (
                      <Link
                        href={`/orders/${order.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-mugen-gold hover:text-white"
                      >
                        Track order →
                      </Link>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-white/5">
                  {(order.order_items as Array<{
                    id: string
                    quantity: number
                    price: number
                    products: ProductRow | null
                  }> | null)?.map((line) => {
                    const p = line.products
                    const img = p?.image_url || '/placeholder.svg'
                    return (
                      <li key={line.id} className="flex gap-3 px-4 py-3 sm:px-5">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mugen-black">
                          <Image
                            src={img}
                            alt={p?.name ?? 'Product'}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized={img.startsWith('http')}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-sans font-medium text-white">
                            {p?.name ?? 'Product'}
                          </p>
                          <p className="text-sm text-white/60">
                            Qty {line.quantity} · {formatCurrency(line.price)} each
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
