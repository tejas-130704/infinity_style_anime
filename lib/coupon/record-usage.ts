import { createAdminClient } from '@/lib/supabase/admin'

/**
 * After payment succeeds: one row in coupon_usage + bump coupons.times_used.
 * Idempotent per order (unique on order_id when set).
 */
export async function recordCouponUsageForCompletedOrder(orderId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, user_id, coupon_id, discount_amount, payment_status')
    .eq('id', orderId)
    .maybeSingle()

  if (orderErr || !order || order.payment_status !== 'completed') return
  if (!order.coupon_id || !order.user_id) return

  const { data: existing } = await admin.from('coupon_usage').select('id').eq('order_id', orderId).maybeSingle()
  if (existing) return

  const discount_amount = Math.max(0, order.discount_amount ?? 0)

  const { error: insErr } = await admin.from('coupon_usage').insert({
    coupon_id: order.coupon_id,
    user_id: order.user_id,
    order_id: orderId,
    discount_amount,
  })

  if (insErr) {
    console.error('[coupon_usage]', insErr)
    return
  }

  const { data: row } = await admin.from('coupons').select('times_used').eq('id', order.coupon_id).maybeSingle()
  const next = (row?.times_used ?? 0) + 1
  await admin.from('coupons').update({ times_used: next }).eq('id', order.coupon_id)
}
