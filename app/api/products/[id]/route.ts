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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ product: data })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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
  const updates: Record<string, unknown> = {}

  if (body.name != null)          updates.name          = String(body.name).trim()
  if (body.description != null)   updates.description   = body.description || null
  if (body.price != null)         updates.price         = parseInt(String(body.price), 10)
  if (body.original_price != null) updates.original_price = body.original_price === '' ? null : parseInt(String(body.original_price), 10)
  if (body.category != null && VALID_CATEGORIES.includes(body.category)) updates.category = body.category
  if (body.image_url != null)     updates.image_url     = body.image_url || null
  if (body.model_url != null)     updates.model_url     = body.model_url || null
  if (body.extra_images != null)  updates.extra_images  = body.extra_images ? JSON.stringify(body.extra_images) : null
  if (body.model_name != null)    updates.model_name    = body.model_name || null
  if (body.color != null)         updates.color         = body.color || null
  if (body.is_multi_color != null) updates.is_multi_color = Boolean(body.is_multi_color)
  if (body.height_cm != null)     updates.height_cm     = body.height_cm === '' ? null : parseFloat(String(body.height_cm))
  if (body.weight_g != null)      updates.weight_g      = body.weight_g === '' ? null : parseFloat(String(body.weight_g))
  if (body.sizes != null)         updates.sizes         = body.sizes ? JSON.stringify(body.sizes) : null
  if (body.rating != null)        updates.rating        = body.rating === '' ? null : parseFloat(String(body.rating))
  if (body.rating_count != null)  updates.rating_count  = body.rating_count === '' ? null : parseInt(String(body.rating_count), 10)

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ product: data })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
