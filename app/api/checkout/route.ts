import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    name,
    phone1,
    phone2,
    email,
    address,
    city,
    state,
  } = body as Record<string, string>

  if (!name || !phone1 || !email || !address || !city || !state) {
    return NextResponse.json({ error: 'Missing address fields' }, { status: 400 })
  }

  const { data: cartRows, error: cartError } = await supabase
    .from('cart_items')
    .select(
      `
      id,
      quantity,
      products (
        id,
        name,
        price,
        image_url
      )
    `
    )
    .eq('user_id', user.id)

  if (cartError || !cartRows?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const { data: addr, error: addrErr } = await supabase
    .from('addresses')
    .insert({
      user_id: user.id,
      name,
      phone1,
      phone2: phone2 || null,
      email,
      address,
      city,
      state,
    })
    .select('id')
    .single()

  if (addrErr || !addr) {
    return NextResponse.json({ error: addrErr?.message ?? 'Address failed' }, { status: 500 })
  }

  let total = 0
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  for (const row of cartRows) {
    const p = row.products as unknown as {
      id: string
      name: string
      price: number
      image_url: string | null
    }
    if (!p) continue
    const line = p.price * row.quantity
    total += line
    lineItems.push({
      quantity: row.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: p.price,
        product_data: {
          name: p.name,
          images: p.image_url ? [p.image_url] : [],
        },
      },
    })
  }

  if (!lineItems.length) {
    return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      address_id: addr.id,
      total_price: total,
      status: 'pending_payment',
      payment_status: 'pending',
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: orderErr?.message ?? 'Order failed' }, { status: 500 })
  }

  for (const row of cartRows) {
    const p = row.products as unknown as { id: string; price: number }
    if (!p) continue
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: p.id,
      quantity: row.quantity,
      price: p.price,
    })
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: lineItems,
    success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/checkout/cancel`,
    metadata: {
      order_id: order.id,
      user_id: user.id,
    },
  })

  await supabase
    .from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id)

  await supabase.from('cart_items').delete().eq('user_id', user.id)

  return NextResponse.json({ url: session.url })
}
