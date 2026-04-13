import { NextResponse } from 'next/server'
import { getCartContext } from '@/lib/cart/get-cart-context'

type Body = {
  order_db_id?: string
  reason?: 'gateway_failed' | 'user_dismissed' | 'sdk_error'
  message?: string
}

/**
 * Marks an unpaid order as failed/cancelled after Razorpay reports failure, user closes the modal,
 * or the checkout SDK could not open. Do not use for signature verification failures (payment may have succeeded).
 */
export async function POST(request: Request) {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const orderId = body.order_db_id?.trim()
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_db_id' }, { status: 400 })
  }

  const { data: row, error: fetchErr } = await ctx.db
    .from('orders')
    .select('id, user_id, payment_status')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (row.user_id !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (row.payment_status !== 'pending') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { error: updErr } = await ctx.db
    .from('orders')
    .update({
      payment_status: 'failed',
      status: 'cancelled',
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending')

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
