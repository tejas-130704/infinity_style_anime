import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    const paymentIntent = session.payment_intent
    const piId =
      typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id ?? null

    if (orderId) {
      const admin = createAdminClient()
      await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          stripe_payment_intent_id: piId,
        })
        .eq('id', orderId)
    }
  }

  return NextResponse.json({ received: true })
}
