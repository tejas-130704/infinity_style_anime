import { NextResponse } from 'next/server'
import { getCartContext } from '@/lib/cart/get-cart-context'
import { validateCouponForCart } from '@/lib/coupon/validate'
import { parseSingleCouponFromBody } from '@/lib/coupon/single-coupon-input'
import { DELIVERY_CHARGE } from '@/lib/constants'

export async function POST(request: Request) {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, db } = ctx

  const body = (await request.json()) as Record<string, unknown>
  const parsedCoupon = parseSingleCouponFromBody(body)
  if (!parsedCoupon.ok) {
    return NextResponse.json({ error: parsedCoupon.error }, { status: 400 })
  }
  const coupon_code = parsedCoupon.code

  const { name, phone1, phone2, email, address, city, state } = body as Record<string, unknown>

  if (!name || !phone1 || !email || !address || !city || !state) {
    return NextResponse.json({ error: 'Missing address fields' }, { status: 400 })
  }

  const { data: cartRows, error: cartError } = await db
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
    .eq('user_id', userId)

  if (cartError || !cartRows?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const { data: addr, error: addrErr } = await db
    .from('addresses')
    .insert({
      user_id: userId,
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

  let itemTotalPaisa = 0
  for (const row of cartRows) {
    const p = row.products as unknown as {
      id: string
      name: string
      price: number
      image_url: string | null
    }
    if (!p) continue
    const line = p.price * row.quantity
    itemTotalPaisa += line
  }

  if (itemTotalPaisa === 0) {
    return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })
  }

  const deliveryChargePaisa = DELIVERY_CHARGE * 100
  const discountBasePaisa = itemTotalPaisa + deliveryChargePaisa

  const productIdsForCoupon = cartRows
    .map((row) => (row.products as unknown as { id: string } | null)?.id)
    .filter(Boolean) as string[]

  let coupon_id: string | null = null
  let clampedDiscount = 0
  let coupon_snapshot: Record<string, unknown> | null = null
  let coupon_code_saved: string | null = null

  if (coupon_code) {
    const v = await validateCouponForCart({
      couponCode: coupon_code,
      userId,
      itemSubtotalPaisa: itemTotalPaisa,
      discountBasePaisa,
      deliveryChargePaisa,
      productIds: productIdsForCoupon,
    })
    if (!v.valid) {
      return NextResponse.json({ error: v.error ?? 'Invalid coupon' }, { status: 400 })
    }
    coupon_id = v.coupon_id
    clampedDiscount = Math.min(v.discount_amount, discountBasePaisa)
    coupon_code_saved = v.code
    coupon_snapshot = {
      code: v.code,
      coupon_id: v.coupon_id,
      discount_type: v.discount_type,
      discount_amount: clampedDiscount,
      discount_base_paisa: discountBasePaisa,
      discount_value: v.discount_value,
      max_discount_amount: v.max_discount_amount,
      min_order_amount: v.min_order_amount,
      applied_at: new Date().toISOString(),
    }
  }

  const finalTotal = Math.max(0, discountBasePaisa - clampedDiscount)
  const gstCalc = 0

  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert({
      user_id: userId,
      address_id: addr.id,
      total_price: finalTotal,
      subtotal: itemTotalPaisa,
      delivery_charge: deliveryChargePaisa,
      discount_amount: clampedDiscount,
      gst_amount: gstCalc,
      coupon_id,
      coupon_code: coupon_code_saved,
      coupon_snapshot,
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
    await db.from('order_items').insert({
      order_id: order.id,
      product_id: p.id,
      quantity: row.quantity,
      price: p.price,
    })
  }

  return NextResponse.json({
    success: true,
    order_id: order.id,
    amount: finalTotal,
    currency: 'INR',
  })
}
