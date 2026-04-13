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

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsed = parseSingleCouponFromBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ valid: false, error: parsed.error }, { status: 400 })
  }
  const coupon_code = parsed.code

  const { userId, db } = ctx

  const { data: cartRows, error: cartError } = await db
    .from('cart_items')
    .select(
      `
      quantity,
      products (
        id,
        price
      )
    `
    )
    .eq('user_id', userId)

  if (cartError || !cartRows?.length) {
    return NextResponse.json({ valid: false, error: 'Your cart is empty' }, { status: 400 })
  }

  let itemSubtotalPaisa = 0
  const productIds: string[] = []
  for (const row of cartRows) {
    const p = row.products as unknown as { id: string; price: number } | null
    if (!p?.id) continue
    productIds.push(p.id)
    itemSubtotalPaisa += p.price * row.quantity
  }

  if (itemSubtotalPaisa <= 0) {
    return NextResponse.json({ valid: false, error: 'Invalid cart' }, { status: 400 })
  }

  const deliveryChargePaisa = DELIVERY_CHARGE * 100
  const discountBasePaisa = itemSubtotalPaisa + deliveryChargePaisa

  const result = await validateCouponForCart({
    couponCode: coupon_code,
    userId,
    itemSubtotalPaisa,
    discountBasePaisa,
    deliveryChargePaisa,
    productIds,
  })

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error })
  }

  return NextResponse.json({
    valid: true,
    coupon_id: result.coupon_id,
    discount_amount: result.discount_amount,
    discount_type: result.discount_type,
    description: result.description,
    code: result.code,
  })
}
