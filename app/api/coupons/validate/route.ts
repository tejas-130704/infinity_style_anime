import { NextResponse } from 'next/server'
import { getCartContext } from '@/lib/cart/get-cart-context'
import { validateCouponForCart } from '@/lib/coupon/validate'
import { parseSingleCouponFromBody } from '@/lib/coupon/single-coupon-input'
import { DELIVERY_CHARGE } from '@/lib/constants'

/**
 * Inline item shape sent directly from the checkout page.
 * When present, the API skips the cart DB entirely and uses these.
 */
type InlineItem = {
  product_id: string
  price: number   // paisa
  quantity: number
}

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

  // ── Resolve items ────────────────────────────────────────────────────────
  // Primary: use `inline_items` sent from the checkout page (the items already
  // displayed to the user). This works for BOTH cart and Buy Now flows without
  // needing a separate cart DB query.
  // Fallback: query cart_items from DB (legacy / non-checkout-page callers).

  let itemSubtotalPaisa = 0
  let productIds: string[] = []

  const inlineRaw = body.inline_items
  const inlineItems = Array.isArray(inlineRaw)
    ? (inlineRaw as InlineItem[]).filter(
        (i) => i?.product_id && Number(i.price) > 0 && Number(i.quantity) > 0
      )
    : []

  if (inlineItems.length > 0) {
    // ── Use the items already on screen — no cart DB needed ──────────────
    for (const item of inlineItems) {
      const qty = Math.max(1, Math.round(Number(item.quantity)))
      const price = Math.round(Number(item.price))
      itemSubtotalPaisa += price * qty
      productIds.push(item.product_id)
    }
  } else {
    // ── Fallback: read from cart DB ────────────────────────────────────────
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

    for (const row of cartRows) {
      const p = row.products as unknown as { id: string; price: number } | null
      if (!p?.id) continue
      productIds.push(p.id)
      itemSubtotalPaisa += p.price * row.quantity
    }

    if (itemSubtotalPaisa <= 0) {
      return NextResponse.json({ valid: false, error: 'Invalid cart' }, { status: 400 })
    }
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
