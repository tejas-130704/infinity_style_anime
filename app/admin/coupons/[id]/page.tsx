import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { CouponForm, type CouponFormInitial } from '@/components/admin/CouponForm'
import { DeactivateCouponButton } from '@/components/admin/DeactivateCouponButton'
import { formatMoneyINRFromPaise, formatOrderDateTime } from '@/lib/admin/format'

export default async function AdminCouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-red-200">{auth.error}</div>
    )
  }

  const { data: coupon } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle()
  if (!coupon) notFound()

  const { data: cpRows } = await supabase.from('coupon_products').select('product_id').eq('coupon_id', id)
  const product_ids = (cpRows ?? []).map((r) => r.product_id as string)

  const { data: usages } = await supabase
    .from('coupon_usage')
    .select('id, user_id, order_id, discount_amount, used_at')
    .eq('coupon_id', id)
    .order('used_at', { ascending: false })

  const usageList = usages ?? []
  const userIds = [...new Set(usageList.map((u) => u.user_id))]
  let profiles: { id: string; email: string | null; name: string | null }[] = []
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('id, email, name').in('id', userIds)
    profiles = profs ?? []
  }

  const orderIds = usageList.map((u) => u.order_id).filter(Boolean) as string[]
  let orderNumbers: Record<string, string> = {}
  if (orderIds.length) {
    const { data: ord } = await supabase.from('orders').select('id, order_number').in('id', orderIds)
    orderNumbers = Object.fromEntries((ord ?? []).map((o) => [o.id as string, String(o.order_number ?? '')]))
  }

  const total_discount_given = usageList.reduce((s, u) => s + (u.discount_amount ?? 0), 0)

  const initial: CouponFormInitial = {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type as CouponFormInitial['discount_type'],
    discount_value: coupon.discount_value,
    min_order_amount: coupon.min_order_amount,
    max_discount_amount: coupon.max_discount_amount,
    valid_from: coupon.valid_from,
    valid_until: coupon.valid_until,
    max_uses: coupon.max_uses,
    max_uses_per_user: coupon.max_uses_per_user ?? 1,
    is_active: coupon.is_active,
    is_visible: coupon.is_visible !== false,
    first_order_only: Boolean(coupon.first_order_only),
    apply_to_all: coupon.apply_to_all !== false,
    product_ids,
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/coupons" className="text-sm text-mugen-gold hover:underline">
            ← All coupons
          </Link>
          <h1 className="font-cinzel mt-2 text-3xl font-bold text-white">{coupon.code}</h1>
          <p className="mt-2 text-white/60">Edit rules, review analytics, and inspect each redemption.</p>
        </div>
        <DeactivateCouponButton couponId={id} />
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CouponForm mode="edit" initial={initial} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-cinzel text-lg font-semibold text-white">Analytics</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-white/70">
              <dt>Total redemptions</dt>
              <dd className="text-white">{usageList.length}</dd>
            </div>
            <div className="flex justify-between gap-4 text-white/70">
              <dt>Unique users</dt>
              <dd className="text-white">{userIds.length}</dd>
            </div>
            <div className="flex justify-between gap-4 text-white/70">
              <dt>Total discount given</dt>
              <dd className="text-white">{formatMoneyINRFromPaise(total_discount_given)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-white/70">
              <dt>Counter (times_used)</dt>
              <dd className="text-white">{coupon.times_used ?? 0}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-14">
        <h2 className="font-cinzel text-xl font-bold text-white">Usage history</h2>
        <p className="mt-1 text-sm text-white/50">Users, orders, and discount applied per completed payment.</p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm text-white/85">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Discount</th>
              </tr>
            </thead>
            <tbody>
              {usageList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-white/45">
                    No redemptions yet.
                  </td>
                </tr>
              ) : (
                usageList.map((u) => {
                  const prof = profiles.find((p) => p.id === u.user_id)
                  const label = prof?.email ?? prof?.name ?? `${u.user_id.slice(0, 8)}…`
                  return (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-white/70">{formatOrderDateTime(u.used_at)}</td>
                      <td className="px-4 py-3">{label}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white/80">
                        {u.order_id ? orderNumbers[u.order_id] ?? u.order_id.slice(0, 8) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoneyINRFromPaise(u.discount_amount)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
