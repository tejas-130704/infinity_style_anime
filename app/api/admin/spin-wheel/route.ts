import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

// GET: Returns all active products AND the currently configured product IDs
export async function GET(_request: Request) {
  try {
    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminDb = createAdminClient()

    // 1. Fetch all active products
    const { data: products, error: productsErr } = await adminDb
      .from('products')
      .select('id, name, image_url, price, original_price, slug')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (productsErr) throw productsErr

    // 2. Fetch the config
    const { data: config, error: configErr } = await adminDb
      .from('spin_wheel_config')
      .select('product_ids')
      .limit(1)
      .maybeSingle()

    // It's okay if configErr happens because table might be empty or missing initially
    const configuredIds = config?.product_ids || []

    return NextResponse.json({
      products: products || [],
      configuredIds
    })
  } catch (error: any) {
    console.error('[admin/spin-wheel] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch spin wheel config' }, { status: 500 })
  }
}

// POST: Updates the spin wheel config
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { productIds } = body

    if (!Array.isArray(productIds)) {
      return NextResponse.json({ error: 'productIds must be an array' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Check if a row exists
    const { data: existing } = await adminDb
      .from('spin_wheel_config')
      .select('id')
      .limit(1)
      .maybeSingle()

    let error;
    if (existing) {
      const res = await adminDb
        .from('spin_wheel_config')
        .update({ product_ids: productIds, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      error = res.error
    } else {
      const res = await adminDb
        .from('spin_wheel_config')
        .insert({ product_ids: productIds })
      error = res.error
    }

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[admin/spin-wheel] POST error:', error)
    return NextResponse.json({ error: 'Failed to update spin wheel config' }, { status: 500 })
  }
}
