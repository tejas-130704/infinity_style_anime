'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  FULFILLMENT_STATUSES,
  type FulfillmentStatus,
} from '@/lib/order/fulfillment-constants'

const FULFILLMENT = ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const PAYMENT = ['pending', 'completed', 'failed', 'refunded'] as const

export async function updateOrderStatusAction(input: { orderId: string; status: string }) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    throw new Error(auth.error)
  }

  if (!FULFILLMENT.includes(input.status as (typeof FULFILLMENT)[number])) {
    throw new Error('Invalid status')
  }

  const { error } = await supabase.from('orders').update({ status: input.status }).eq('id', input.orderId)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
}

export async function updateFulfillmentStatusAction(input: { orderId: string; fulfillment_status: FulfillmentStatus }) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    throw new Error(auth.error)
  }

  if (!(FULFILLMENT_STATUSES as readonly string[]).includes(input.fulfillment_status)) {
    throw new Error('Invalid fulfillment status')
  }

  const fs = input.fulfillment_status
  const now = new Date().toISOString()

  const patch: Record<string, unknown> = { fulfillment_status: fs }

  if (fs === 'packed') patch.packed_at = now
  if (fs === 'shipped') patch.shipped_at = now
  if (fs === 'out_for_delivery') patch.out_for_delivery_at = now
  if (fs === 'delivered') {
    patch.delivered_at = now
    patch.status = 'delivered'
  } else if (fs === 'shipped' || fs === 'out_for_delivery') {
    patch.status = 'shipped'
  } else if (fs === 'ordered' || fs === 'packed') {
    patch.status = 'processing'
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', input.orderId)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
  revalidatePath('/orders')
  revalidatePath(`/orders/${input.orderId}`)
}

export type UpdateOrderAdminInput = {
  orderId: string
  userId: string
  status: string
  payment_status: string
  order_notes: string
  /** Total in paise. Omit to leave unchanged. */
  total_price_paise?: number
}

export async function updateOrderAdminAction(input: UpdateOrderAdminInput) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    throw new Error(auth.error)
  }

  if (!FULFILLMENT.includes(input.status as (typeof FULFILLMENT)[number])) {
    throw new Error('Invalid fulfillment status')
  }
  if (!PAYMENT.includes(input.payment_status as (typeof PAYMENT)[number])) {
    throw new Error('Invalid payment status')
  }

  const patch: Record<string, unknown> = {
    status: input.status,
    payment_status: input.payment_status,
    order_notes: input.order_notes.trim() || null,
  }

  if (typeof input.total_price_paise === 'number') {
    const n = Math.round(input.total_price_paise)
    if (!Number.isFinite(n) || n < 0) {
      throw new Error('Invalid total amount')
    }
    patch.total_price = n
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', input.orderId)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/users/${input.userId}`)
}

export async function deleteOrderAction(input: { orderId: string; userId: string }) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    throw new Error(auth.error)
  }

  // Use service role for destructive admin ops; avoids RLS silently blocking.
  const admin = createAdminClient()

  const { data: itemsDeleted, error: itemsErr } = await admin
    .from('order_items')
    .delete()
    .eq('order_id', input.orderId)
    .select('id')
  if (itemsErr) {
    throw new Error(itemsErr.message)
  }

  const { data: ordersDeleted, error } = await admin.from('orders').delete().eq('id', input.orderId).select('id')
  if (error) {
    throw new Error(error.message)
  }
  if (!ordersDeleted || ordersDeleted.length === 0) {
    throw new Error(
      `Order was not deleted (no rows affected). Possible causes: invalid id, DB constraint, or missing admin key. Deleted items: ${(itemsDeleted ?? []).length}.`
    )
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/users/${input.userId}`)
}

