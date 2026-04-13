import { createAdminClient } from '@/lib/supabase/admin'
import { buildTimelineSteps } from './tracking'
import type { FulfillmentStatus } from './fulfillment-constants'
import { isFulfillmentStatus } from './fulfillment-constants'

export const ORDER_SELECT = `
  id,
  user_id,
  total_price,
  subtotal,
  delivery_charge,
  discount_amount,
  gst_amount,
  status,
  payment_status,
  razorpay_order_id,
  razorpay_payment_id,
  coupon_id,
  coupon_code,
  created_at,
  fulfillment_status,
  packed_at,
  shipped_at,
  out_for_delivery_at,
  delivered_at,
  addresses (
    name,
    phone1,
    email,
    address,
    city,
    state
  ),
  order_items (
    id,
    quantity,
    price,
    products ( id, name, image_url, category, slug )
  )
`

export type OrderWithTracking = {
  order: Record<string, unknown>
  tracking: ReturnType<typeof buildTimelineSteps> & { fulfillment_status: FulfillmentStatus | null }
}

export async function fetchOrderForViewer(
  orderId: string,
  userId: string,
  options?: { isAdmin?: boolean }
): Promise<OrderWithTracking | null> {
  const admin = createAdminClient()
  let q = admin.from('orders').select(ORDER_SELECT).eq('id', orderId)
  if (!options?.isAdmin) {
    q = q.eq('user_id', userId)
  }
  const { data: order, error } = await q.maybeSingle()

  if (error || !order) return null

  const row = order as {
    payment_status: string
    created_at: string
    fulfillment_status: string | null
    packed_at: string | null
    shipped_at: string | null
    out_for_delivery_at: string | null
    delivered_at: string | null
  }

  let fs: FulfillmentStatus | null = isFulfillmentStatus(row.fulfillment_status)
    ? row.fulfillment_status
    : null
  if (row.payment_status === 'completed' && !fs) {
    fs = 'ordered'
  }

  const tracking = buildTimelineSteps(fs, row.payment_status === 'completed', row.created_at, {
    packed_at: row.packed_at,
    shipped_at: row.shipped_at,
    out_for_delivery_at: row.out_for_delivery_at,
    delivered_at: row.delivered_at,
  })

  return {
    order,
    tracking: { ...tracking, fulfillment_status: fs },
  }
}
