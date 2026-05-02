import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSession, isErrorResponse } from '@/lib/auth/session-guard'

/** Server-side random pick — never trust the frontend */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST(_request: Request) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const sessionResult = await requireSession()
  if (isErrorResponse(sessionResult)) return sessionResult
  const userId = sessionResult.user.id

  const db = createAdminClient()

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .select('student_verified')
    .eq('id', userId)
    .single()

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // ── Guard: must be verified ────────────────────────────────────────────────
  if (!profile.student_verified) {
    return NextResponse.json(
      { error: 'Student verification required before spinning' },
      { status: 403 }
    )
  }


  // ── Fetch reward-eligible products ────────────────────────────────────────
  // Strategy: read from spin_wheel_config. If empty, fall back to cheapest active products.
  const { data: config } = await db
    .from('spin_wheel_config')
    .select('product_ids')
    .limit(1)
    .maybeSingle()

  let rewardProducts = []

  if (config?.product_ids && Array.isArray(config.product_ids) && config.product_ids.length > 0) {
    const { data: configuredProducts } = await db
      .from('products')
      .select('id, name, image_url, price, original_price, slug, product_images(image_url)')
      .in('id', config.product_ids)
      .eq('is_active', true)
    
    if (configuredProducts && configuredProducts.length > 0) {
      rewardProducts = configuredProducts
    }
  }

  if (rewardProducts.length === 0) {
    const { data: fallbackProducts } = await db
      .from('products')
      .select('id, name, image_url, price, original_price, slug, product_images(image_url)')
      .eq('is_active', true)
      .order('price', { ascending: true })
      .limit(6)
    
    rewardProducts = fallbackProducts || []
  }

  if (!rewardProducts || rewardProducts.length === 0) {
    return NextResponse.json(
      { error: 'No reward products available right now' },
      { status: 503 }
    )
  }

  // Limit to max 6 to keep wheel manageable — show first 3 in UI
  const poolSize = Math.min(rewardProducts.length, 6)
  rewardProducts = rewardProducts.slice(0, poolSize)

  // Transform the response to include a flattened images array
  const transformedProducts = rewardProducts.map((p) => {
    let images = p.image_url ? [p.image_url] : []
    if (p.product_images && Array.isArray(p.product_images)) {
      const extraImages = p.product_images.map((pi: any) => pi.image_url)
      images = [...new Set([...images, ...extraImages])].filter(Boolean)
    }
    // Remove the raw relation to avoid confusing the frontend
    const { product_images, ...rest } = p
    return { ...rest, images }
  })

  // ── Server-side pick ───────────────────────────────────────────────────────
  const chosen = pickRandom(transformedProducts)


  return NextResponse.json({
    alreadySpun: false,
    reward: chosen,
    // Send full pool so frontend can render all segments of the wheel
    wheelSegments: transformedProducts,
    // Tell the frontend which index was chosen (for animation purposes)
    chosenIndex: transformedProducts.findIndex((p) => p.id === chosen.id),
  })
}
