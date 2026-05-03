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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: coupon, error: cErr } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle()
  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500 })
  }
  if (!coupon) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: cpRows } = await supabase.from('coupon_products').select('product_id').eq('coupon_id', id)
  const product_ids = (cpRows ?? []).map((r) => r.product_id as string)

  const { data: usages } = await supabase
    .from('coupon_usage')
    .select('id, user_id, order_id, discount_amount, used_at')
    .eq('coupon_id', id)
    .order('used_at', { ascending: false })

  const usageList = usages ?? []
  const total_discount_given = usageList.reduce((s, u) => s + (u.discount_amount ?? 0), 0)
  const userIds = [...new Set(usageList.map((u) => u.user_id))]
  let profiles: { id: string; email: string | null; name: string | null }[] = []
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('id, email, name').in('id', userIds)
    profiles = profs ?? []
  }

  const orderIds = usageList.map((u) => u.order_id).filter(Boolean) as string[]
  let orderNumbers: Record<string, string> = {}
  if (orderIds.length) {
    const { data: ord } = await supabase.from('orders').select('id, order_number').in('id', orderIds)
    orderNumbers = Object.fromEntries((ord ?? []).map((o) => [o.id as string, String(o.order_number ?? '')]))
  }

  const enriched = usageList.map((u) => ({
    ...u,
    user_email: profiles.find((p) => p.id === u.user_id)?.email ?? null,
    user_name: profiles.find((p) => p.id === u.user_id)?.name ?? null,
    order_number: u.order_id ? orderNumbers[u.order_id] ?? null : null,
  }))

  return NextResponse.json({
    coupon,
    product_ids,
    analytics: {
      total_uses: usageList.length,
      total_discount_given,
      unique_users: userIds.length,
    },
    usages: enriched,
  })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
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

  const { error: upErr } = await supabase.from('coupons').update(row).eq('id', id)
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 })
  }

  try {
    if (apply_to_all) {
      await supabase.from('coupon_products').delete().eq('coupon_id', id)
    } else {
      await replaceCouponProducts(supabase, id, product_ids)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to sync products'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { error } = await supabase.from('coupons').update({ is_active: false }).eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
