import { NextResponse } from 'next/server'
import { getCartContext } from '@/lib/cart/get-cart-context'
import { validateCouponForCart } from '@/lib/coupon/validate'
import { parseSingleCouponFromBody } from '@/lib/coupon/single-coupon-input'
import { DELIVERY_CHARGE } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DirectPurchaseItem } from '@/lib/types'

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

  // ── Detect checkout type ─────────────────────────────────────────────────
  // `direct_purchase` is present ⟹ Buy Now flow (single product, no cart DB).
  // Absent ⟹ normal cart checkout (reads cart_items from DB).
  const directPurchaseRaw = body.direct_purchase as DirectPurchaseItem | undefined
  const isDirectPurchase =
    Boolean(directPurchaseRaw?.product_id) && Number(directPurchaseRaw?.price) > 0

  // ── Normalised order line items ──────────────────────────────────────────
  type OrderLine = { product_id: string; quantity: number; price: number }
  let orderLines: OrderLine[] = []
  let itemTotalPaisa = 0

  if (isDirectPurchase) {
    // ── Buy Now path ─────────────────────────────────────────────────────
    const qty = Math.max(1, Number(directPurchaseRaw!.quantity) || 1)
    const unitPrice = Math.round(Number(directPurchaseRaw!.price))
    orderLines = [
      {
        product_id: directPurchaseRaw!.product_id,
        quantity: qty,
        price: unitPrice,
      },
    ]
    itemTotalPaisa = unitPrice * qty
  } else {
    // ── Cart path: load rows from DB ─────────────────────────────────────
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

    for (const row of cartRows) {
      const p = row.products as unknown as {
        id: string
        name: string
        price: number
        image_url: string | null
      }
      if (!p) continue
      orderLines.push({ product_id: p.id, quantity: row.quantity, price: p.price })
      itemTotalPaisa += p.price * row.quantity
    }
  }

  if (itemTotalPaisa === 0) {
    return NextResponse.json({ error: 'Invalid order — no items or zero value' }, { status: 400 })
  }

  // ── Save delivery address ────────────────────────────────────────────────
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

  // ── Coupon validation ────────────────────────────────────────────────────
  const deliveryChargePaisa = DELIVERY_CHARGE * 100
  const discountBasePaisa = itemTotalPaisa + deliveryChargePaisa
  const productIdsForCoupon = orderLines.map((l) => l.product_id)

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

  // ── Create order record ──────────────────────────────────────────────────
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

  // ── Insert order items ───────────────────────────────────────────────────
  for (const line of orderLines) {
    await db.from('order_items').insert({
      order_id: order.id,
      product_id: line.product_id,
      quantity: line.quantity,
      price: line.price,
    })
  }

  // ── Student reward product (price = 0) ────────────────────────────
  const rewardProductId = typeof body.reward_product_id === 'string'
    ? body.reward_product_id
    : null

  if (rewardProductId) {
    // Server-side guard: confirm user actually won this product
    const adminDb = createAdminClient()
    const { data: profile } = await adminDb
      .from('profiles')
      .select('student_verified, spin_used, reward_item_id')
      .eq('id', userId)
      .single()

    const isValidReward =
      profile?.student_verified === true &&
      profile?.spin_used === true &&
      profile?.reward_item_id === rewardProductId

    if (isValidReward) {
      const { data: rewardProd } = await adminDb
        .from('products')
        .select('id, name, image_url')
        .eq('id', rewardProductId)
        .eq('is_active', true)
        .single()

      if (rewardProd) {
        await db.from('order_items').insert({
          order_id: order.id,
          product_id: rewardProd.id,
          product_name: rewardProd.name,
          product_image_url: rewardProd.image_url,
          quantity: 1,
          price: 0,           // FREE — student reward
          variant: { is_reward: true, reward_type: 'student_spin' },
        })
      }
    }
  }

  return NextResponse.json({
    success: true,
    order_id: order.id,
    amount: finalTotal,
    currency: 'INR',
  })
}
