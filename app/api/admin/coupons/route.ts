import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

async function replaceCouponProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  couponId: string,
  productIds: string[]
) {
  const { error: delErr } = await supabase.from('coupon_products').delete().eq('coupon_id', couponId)
  if (delErr) throw delErr
  if (productIds.length === 0) return
  const { error: insErr } = await supabase.from('coupon_products').insert(
    productIds.map((product_id) => ({ coupon_id: couponId, product_id }))
  )
  if (insErr) throw insErr
}

export async function GET() {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ coupons: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({}))
  const code = String(body.code ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
  if (!code) {
    return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
  }

  const discount_type = String(body.discount_type ?? '')
  if (!['percentage', 'fixed', 'free_delivery'].includes(discount_type)) {
    return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 })
  }

  const apply_to_all = body.apply_to_all !== false
  const product_ids = Array.isArray(body.product_ids)
    ? (body.product_ids as unknown[]).filter((x): x is string => typeof x === 'string')
    : []

  if (!apply_to_all && product_ids.length === 0) {
    return NextResponse.json(
      { error: 'Select at least one product or enable “Apply to all products”' },
      { status: 400 }
    )
  }

  const valid_from =
    body.valid_from != null && String(body.valid_from).trim() !== ''
      ? new Date(String(body.valid_from)).toISOString()
      : new Date().toISOString()
  const valid_until =
    body.valid_until != null && String(body.valid_until).trim() !== ''
      ? new Date(String(body.valid_until)).toISOString()
      : null

  const min_order_amount = Math.max(0, parseInt(String(body.min_order_amount ?? 0), 10) || 0)
  let discount_value = Math.max(0, parseInt(String(body.discount_value ?? 0), 10) || 0)
  if (discount_type === 'percentage' && discount_value > 100) {
    return NextResponse.json({ error: 'Percentage cannot exceed 100' }, { status: 400 })
  }
  if (discount_type === 'free_delivery') {
    discount_value = 0
  }

  const max_discount_amount =
    body.max_discount_amount != null && String(body.max_discount_amount).trim() !== ''
      ? Math.max(0, parseInt(String(body.max_discount_amount), 10) || 0)
      : null

  const max_uses =
    body.max_uses != null && String(body.max_uses).trim() !== ''
      ? Math.max(1, parseInt(String(body.max_uses), 10) || 1)
      : null
  const max_uses_per_user = Math.max(1, parseInt(String(body.max_uses_per_user ?? 1), 10) || 1)

  const row = {
    code,
    description: body.description != null ? String(body.description).trim() || null : null,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    valid_from,
    valid_until,
    max_uses,
    max_uses_per_user,
    is_active: body.is_active !== false,
    is_visible: body.is_visible !== false,
    first_order_only: Boolean(body.first_order_only),
    apply_to_all,
  }

  const { data: created, error: insErr } = await supabase.from('coupons').insert(row).select('id').single()

  if (insErr || !created) {
    return NextResponse.json({ error: insErr?.message ?? 'Insert failed' }, { status: 400 })
  }

  try {
    if (!apply_to_all) {
      await replaceCouponProducts(supabase, created.id, product_ids)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to link products'
    await supabase.from('coupons').delete().eq('id', created.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ id: created.id })
}
