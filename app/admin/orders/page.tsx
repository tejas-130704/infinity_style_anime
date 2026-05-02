import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'
import { FulfillmentStatusSelect } from '@/components/admin/FulfillmentStatusSelect'
import { ConfirmDeliveryButton } from '@/components/admin/ConfirmDeliveryButton'
import { OrderAdminControls } from '@/components/admin/OrderAdminControls'
import { formatMoneyINRFromPaise, formatOrderDateTime } from '@/lib/admin/format'

type AdminOrderRow = {
  id: string
  user_id: string
  total_price: number
  status: string
  payment_status: string
  fulfillment_status: string | null
  order_notes: string | null
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    price: number
    products: { id: string; name: string; image_url: string | null } | null
  }> | null
  // joined via address_id FK — primary source of customer info
  addresses: { name: string; email: string; phone1: string } | { name: string; email: string; phone1: string }[] | null
}

export default async function AdminOrdersPage() {
  // Auth check uses the session-aware client
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    // AdminLayout already redirects, but keep this safe for direct rendering.
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-red-200">
        {auth.error}
      </div>
    )
  }

  // Data queries use the service-role client to bypass RLS on addresses
  const db = createAdminClient()

  const { data: orders, error } = await db
    .from('orders')
    .select(
      `
      id,
      user_id,
      total_price,
      status,
      payment_status,
      fulfillment_status,
      order_notes,
      created_at,
      order_items (
        id,
        quantity,
        price,
        products ( id, name, image_url )
      ),
      addresses ( name, email, phone1 )
    `
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <div>
        <h1 className="font-cinzel text-3xl font-bold text-white">Orders</h1>
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error.message}
        </p>
      </div>
    )
  }

  const rows = (orders ?? []) as unknown as AdminOrderRow[]

  // --- Batch-fetch profiles as fallback for orders where addresses join returned null ---
  const missingProfileIds = [
    ...new Set(
      rows.filter((o) => {
        const addrObj = Array.isArray(o.addresses) ? o.addresses[0] : o.addresses
        return !addrObj?.name
      }).map((o) => o.user_id)
    ),
  ]
  const profileMap: Record<string, { name: string | null; email: string | null }> = {}
  if (missingProfileIds.length > 0) {
    const { data: profs } = await db
      .from('profiles')
      .select('id, name, email')
      .in('id', missingProfileIds)
    for (const p of profs ?? []) {
      const row = p as { id: string; name: string | null; email: string | null }
      profileMap[row.id] = { name: row.name, email: row.email }
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-white">Orders</h1>
          <p className="mt-2 text-white/60">
            View customer info, items, payment status, and update fulfillment.
          </p>
        </div>
        <p className="text-xs text-white/40">Showing latest {rows.length} orders</p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-xl border border-white/10 bg-mugen-dark/40 px-6 py-10 text-center text-white/60">
          No orders yet. They appear here after checkout.
        </p>
      ) : (
        <div className="mt-10 space-y-6">
          {rows.map((o) => {
            // Primary: address snapshot saved at checkout. Fallback: profile row.
            const prof = profileMap[o.user_id]
            const addrObj = Array.isArray(o.addresses) ? o.addresses[0] : o.addresses
            const customerName = addrObj?.name || prof?.name || '—'
            const customerEmail = addrObj?.email || prof?.email || '—'
            const customerPhone = addrObj?.phone1 || '—'
            const isPaid = o.payment_status === 'completed'

            return (
              <div
                key={o.id}
                className={`overflow-hidden rounded-xl border bg-mugen-dark/40 transition-all ${
                  isPaid
                    ? 'border-yellow-400/60 shadow-[0_0_0_1px_rgba(250,204,21,0.25),0_0_18px_rgba(250,204,21,0.12)]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-white/50">{o.id}</p>
                      <p className="mt-1 text-sm text-white/60">{formatOrderDateTime(o.created_at)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-cinzel text-lg font-bold text-mugen-gold">
                        {formatMoneyINRFromPaise(o.total_price)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                        Payment: {o.payment_status}
                      </span>
                      <OrderStatusSelect orderId={o.id} value={o.status} />
                      <FulfillmentStatusSelect
                        orderId={o.id}
                        value={o.fulfillment_status}
                        paymentCompleted={o.payment_status === 'completed'}
                      />
                      {o.payment_status === 'completed' &&
                        o.fulfillment_status === 'out_for_delivery' && (
                          <ConfirmDeliveryButton orderId={o.id} />
                        )}
                      <OrderAdminControls
                        orderId={o.id}
                        userId={o.user_id}
                        initial={{
                          status: o.status,
                          payment_status: o.payment_status,
                          order_notes: o.order_notes,
                          total_price: o.total_price,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Customer</p>
                      <p className="mt-1 text-sm font-semibold text-white/80">{customerName}</p>
                      <p className="mt-1 text-xs text-white/60">{customerEmail}</p>
                      <p className="mt-1 text-xs text-white/60">{customerPhone}</p>
                    </div>

                    <div className="sm:col-span-2 rounded-lg border border-white/10 bg-black/10 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Items</p>
                        <Link
                          href={`/admin/users/${o.user_id}`}
                          className="rounded-lg border border-mugen-glow/30 bg-white/5 px-3 py-1.5 text-xs font-semibold text-mugen-gold hover:bg-white/10"
                        >
                          View Details →
                        </Link>
                      </div>
                      <ul className="mt-2 divide-y divide-white/5">
                        {(o.order_items ?? []).map((line) => (
                          <li key={line.id} className="py-2 text-sm text-white/80">
                            <span className="font-semibold text-white/90">{line.products?.name ?? 'Product'}</span>{' '}
                            <span className="text-white/60">× {line.quantity}</span>
                            <span className="text-white/40">
                              {' '}
                              @ {formatMoneyINRFromPaise(line.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
