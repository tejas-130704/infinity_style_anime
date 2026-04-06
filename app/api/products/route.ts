import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const supabase = await createClient()
  let q = supabase.from('products').select('*').order('created_at', { ascending: false })
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = String(body.name ?? '').trim()
  const description = body.description ? String(body.description) : null
  const price = parseInt(String(body.price), 10)
  const original_price = body.original_price != null ? parseInt(String(body.original_price), 10) : null
  const category = body.category as string
  const image_url = body.image_url ? String(body.image_url) : null
  const model_url = body.model_url ? String(body.model_url) : null
  const extra_images = body.extra_images ?? null   // JSON string array
  const model_name = body.model_name ? String(body.model_name) : null
  const color = body.color ? String(body.color) : null
  const is_multi_color = Boolean(body.is_multi_color ?? false)
  const height_cm = body.height_cm != null ? parseFloat(String(body.height_cm)) : null
  const weight_g = body.weight_g != null ? parseFloat(String(body.weight_g)) : null
  const sizes = body.sizes ?? null                 // JSON string array e.g. '["A4","A3"]'
  const rating = body.rating != null ? parseFloat(String(body.rating)) : null
  const rating_count = body.rating_count != null ? parseInt(String(body.rating_count), 10) : null

  if (!name || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'Invalid name or price' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      description,
      price,
      original_price,
      category,
      image_url,
      model_url,
      extra_images: extra_images ? JSON.stringify(extra_images) : null,
      model_name,
      color,
      is_multi_color,
      height_cm: height_cm && Number.isFinite(height_cm) ? height_cm : null,
      weight_g: weight_g && Number.isFinite(weight_g) ? weight_g : null,
      sizes: sizes ? JSON.stringify(sizes) : null,
      rating: rating && Number.isFinite(rating) ? rating : null,
      rating_count: rating_count && Number.isFinite(rating_count) ? rating_count : null,
      slug: `${slug}-${Date.now().toString(36)}`,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ product: data })
}
