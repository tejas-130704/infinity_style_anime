import { createAdminClient } from '@/lib/supabase/admin'

export type CouponRow = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed' | 'free_delivery'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  valid_from: string
  valid_until: string | null
  max_uses: number | null
  max_uses_per_user: number | null
  times_used: number | null
  is_active: boolean
  first_order_only: boolean
  applicable_products: string[] | null
  apply_to_all: boolean | null
}

export type ValidateCouponInput = {
  couponCode: string
  userId: string
  /** Cart merchandise only (paisa) — min order & eligibility */
  itemSubtotalPaisa: number
  /** item + delivery (paisa) — base for % / fixed / free-delivery discount */
  discountBasePaisa: number
  /** Actual delivery fee in paisa; free_delivery discount is 0 if this is 0 */
  deliveryChargePaisa: number
  productIds: string[]
}

export type ValidateCouponResult =
  | {
      valid: true
      coupon_id: string
      discount_amount: number
      discount_type: string
      description: string | null
      code: string
      discount_value: number
      max_discount_amount: number | null
      min_order_amount: number
    }
  | { valid: false; error: string }

async function isFirstTimeBuyer(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('payment_status', 'completed')
  if (error) return true
  return (count ?? 0) === 0
}

async function userCouponUseCount(couponId: string, userId: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('coupon_usage')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', couponId)
    .eq('user_id', userId)
  if (error) return 999999
  return count ?? 0
}

async function loadCouponProductIds(couponId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('coupon_products').select('product_id').eq('coupon_id', couponId)
  if (error || !data) return []
  return data.map((r) => r.product_id as string)
}

function cartMatchesProducts(
  cartProductIds: string[],
  applyAll: boolean,
  applicableProducts: string[] | null,
  junctionIds: string[]
): boolean {
  if (applyAll) return true
  const fromArray = applicableProducts ?? []
  const allowed = new Set([...fromArray, ...junctionIds])
  if (allowed.size === 0) return false
  return cartProductIds.some((id) => allowed.has(id))
}

function computeDiscount(c: CouponRow, discountBasePaisa: number, deliveryChargePaisa: number): number {
  if (discountBasePaisa <= 0) return 0
  if (c.discount_type === 'percentage') {
    let d = Math.floor((discountBasePaisa * c.discount_value) / 100)
    if (c.max_discount_amount != null) d = Math.min(d, c.max_discount_amount)
    return Math.min(d, discountBasePaisa)
  }
  if (c.discount_type === 'fixed') {
    return Math.min(c.discount_value, discountBasePaisa)
  }
  if (c.discount_type === 'free_delivery') {
    if (deliveryChargePaisa <= 0) return 0
    return Math.min(deliveryChargePaisa, discountBasePaisa)
  }
  return 0
}

/**
 * Full server-side coupon validation (cart products, limits, dates).
 * Amounts are in paisa.
 */
export async function validateCouponForCart(input: ValidateCouponInput): Promise<ValidateCouponResult> {
  const code = input.couponCode.trim().toUpperCase()
  if (!code) return { valid: false, error: 'Enter a coupon code' }

  const admin = createAdminClient()
  const { data: row, error } = await admin.from('coupons').select('*').eq('code', code).maybeSingle()

  if (error || !row) return { valid: false, error: 'Invalid or inactive coupon code' }

  const c = row as unknown as CouponRow
  if (!c.is_active) return { valid: false, error: 'This coupon is not active' }

  const now = new Date()
  if (c.valid_from && new Date(c.valid_from) > now) {
    return { valid: false, error: 'This coupon is not valid yet' }
  }
  if (c.valid_until && new Date(c.valid_until) < now) {
    return { valid: false, error: 'This coupon has expired' }
  }

  if (c.max_uses != null && (c.times_used ?? 0) >= c.max_uses) {
    return { valid: false, error: 'Coupon usage limit reached' }
  }

  const perUser = c.max_uses_per_user ?? 1
  const used = await userCouponUseCount(c.id, input.userId)
  if (used >= perUser) {
    return { valid: false, error: 'You have already used this coupon the maximum number of times' }
  }

  if (c.first_order_only && !(await isFirstTimeBuyer(input.userId))) {
    return { valid: false, error: 'This coupon is only for first-time orders' }
  }

  if (input.itemSubtotalPaisa < c.min_order_amount) {
    const minRupee = Math.ceil(c.min_order_amount / 100)
    return { valid: false, error: `Minimum order value is ₹${minRupee.toLocaleString('en-IN')}` }
  }

  const applyAll = c.apply_to_all ?? true
  const junctionIds = await loadCouponProductIds(c.id)
  const eligible = cartMatchesProducts(
    input.productIds,
    applyAll,
    c.applicable_products,
    junctionIds
  )
  if (!eligible) {
    return { valid: false, error: 'This coupon does not apply to items in your cart' }
  }

  const discount_amount = computeDiscount(c, input.discountBasePaisa, input.deliveryChargePaisa)

  return {
    valid: true,
    coupon_id: c.id,
    discount_amount,
    discount_type: c.discount_type,
    description: c.description,
    code: c.code,
    discount_value: c.discount_value,
    max_discount_amount: c.max_discount_amount,
    min_order_amount: c.min_order_amount,
  }
}
