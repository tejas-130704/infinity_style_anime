import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { FULFILLMENT_STATUSES, type FulfillmentStatus } from '@/lib/order/fulfillment-constants'

/**
 * PATCH /api/order/:id/status — admin only. Body: { fulfillment_status }
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({}))
  const next = body.fulfillment_status as string | undefined
  if (!next || !(FULFILLMENT_STATUSES as readonly string[]).includes(next)) {
    return NextResponse.json({ error: 'Invalid fulfillment_status' }, { status: 400 })
  }

  const fs = next as FulfillmentStatus
  const now = new Date().toISOString()

  const patch: Record<string, unknown> = { fulfillment_status: fs }

  if (fs === 'packed') {
    patch.packed_at = now
  }
  if (fs === 'shipped') {
    patch.shipped_at = now
  }
  if (fs === 'out_for_delivery') {
    patch.out_for_delivery_at = now
  }
  if (fs === 'delivered') {
    patch.delivered_at = now
    patch.status = 'delivered'
  } else if (fs === 'shipped' || fs === 'out_for_delivery') {
    patch.status = 'shipped'
  } else if (fs === 'ordered' || fs === 'packed') {
    patch.status = 'processing'
  }

  const { data, error } = await supabase.from('orders').update(patch).eq('id', id).select('id, fulfillment_status, status').single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/admin/orders')
  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)

  return NextResponse.json({ order: data })
}
