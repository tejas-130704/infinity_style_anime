import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser, requireAdminSession, isErrorResponse } from '@/lib/auth/session-guard'

const VALID_CATEGORIES = [
  'posters',
  'action_figures',
  'limited_edition',
  'custom_action_figure',
  'personalized_posters',
  '3d_models',
  'custom_designs',
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const session = await getSessionUser()
  const isAdmin = session?.role === 'admin'
  const supabase = isAdmin ? createAdminClient() : await createClient()

  let q = supabase.from('products').select('*').order('created_at', { ascending: false })

  // Defense-in-depth: even though RLS handles this on the DB side,
  // we also filter explicitly so the intent is clear in code.
  if (!isAdmin) {
    q = q.eq('is_public', true)
  }

  if (category && VALID_CATEGORIES.includes(category)) {
    q = q.eq('category', category)
  }

  const { data, error } = await q
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ products: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireAdminSession()
  if (isErrorResponse(auth)) return auth

  const supabase = createAdminClient()
  const body = await request.json()
  const name = String(body.name ?? '').trim()
  const description = String(body.description ?? '').trim() || null
  const price = parseInt(String(body.price), 10)
  const mrpSource = body.original_price ?? body.mrp
  const originalRaw = mrpSource != null ? parseInt(String(mrpSource), 10) : NaN
  const original_price = Number.isFinite(originalRaw) && originalRaw >= 0 ? originalRaw : null
  const category = body.category as string
  const image_url = String(body.image_url ?? '').trim() || null
  const model_url = String(body.model_url ?? '').trim() || null
  const extra_images = body.extra_images
  const model_name = String(body.model_name ?? '').trim() || null
  const color = String(body.color ?? '').trim() || null
  const is_multi_color = Boolean(body.is_multi_color ?? false)
  const is_spin_reward = Boolean(body.is_spin_reward ?? false)
  const heightRaw = body.height_cm != null ? parseFloat(String(body.height_cm)) : NaN
  const height_cm = Number.isFinite(heightRaw) ? heightRaw : null
  const weightRaw = body.weight_g != null ? parseFloat(String(body.weight_g)) : NaN
  const weight_g = Number.isFinite(weightRaw) ? weightRaw : null
  const sizes = body.sizes
  const ratingRaw = body.rating != null ? parseFloat(String(body.rating)) : NaN
  const rating = Number.isFinite(ratingRaw) ? ratingRaw : null
  const rcRaw = body.rating_count != null ? parseInt(String(body.rating_count), 10) : NaN
  const rating_count = Number.isFinite(rcRaw) ? rcRaw : null

  if (!name || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'Invalid name or price' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

  /** Only persist optional columns when there is real data (requires columns from migration). */
  const insertRow: Record<string, unknown> = {
    name,
    price,
    category,
    slug: `${slugBase}-${Date.now().toString(36)}`,
    is_multi_color,
    is_spin_reward,
  }
  if (description) insertRow.description = description
  if (original_price != null) insertRow.original_price = original_price
  if (image_url) insertRow.image_url = image_url
  if (model_url) insertRow.model_url = model_url
  if (Array.isArray(extra_images) && extra_images.length > 0) {
    insertRow.extra_images = JSON.stringify(extra_images)
  }
  if (model_name) insertRow.model_name = model_name
  if (color) insertRow.color = color
  if (height_cm != null) insertRow.height_cm = height_cm
  if (weight_g != null) insertRow.weight_g = weight_g
  if (Array.isArray(sizes) && sizes.length > 0) {
    insertRow.sizes = JSON.stringify(sizes)
  }
  if (rating != null) insertRow.rating = rating
  if (rating_count != null) insertRow.rating_count = rating_count

  const { data, error } = await supabase.from('products').insert(insertRow).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (data?.id) {
    revalidatePath('/shop')
    revalidatePath('/admin/products')
    revalidatePath(`/product/${data.id}`)
  }
  return NextResponse.json({ product: data })
}
