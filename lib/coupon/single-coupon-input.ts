/**
 * Enforce one coupon per order on the server: reject arrays, multiple delimited codes,
 * or extra payload keys that imply stacking.
 */
export type SingleCouponParseResult = { ok: true; code: string } | { ok: false; error: string }

export function parseSingleCouponFromBody(body: Record<string, unknown>): SingleCouponParseResult {
  if (body.coupon_codes != null || body.coupons != null || body.secondary_coupon != null) {
    return {
      ok: false,
      error: 'Only one coupon is allowed per order. Use a single coupon_code field.',
    }
  }

  const raw = body.coupon_code
  if (raw == null || raw === '') {
    return { ok: true, code: '' }
  }
  if (Array.isArray(raw)) {
    return { ok: false, error: 'Only one coupon code is allowed per order.' }
  }

  const s = String(raw).trim()
  if (!s) {
    return { ok: true, code: '' }
  }

  const segments = s
    .split(/[,;|]/)
    .map((x) => x.trim())
    .filter(Boolean)
  if (segments.length > 1) {
    return { ok: false, error: 'Only one coupon code is allowed per order.' }
  }

  return { ok: true, code: segments[0] ?? s }
}
