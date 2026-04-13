import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminSession, isErrorResponse } from '@/lib/auth/session-guard'

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
  const auth = await requireAdminSession()
  if (isErrorResponse(auth)) return auth

  const supabase = createAdminClient()
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name != null) updates.name = String(body.name).trim()
  if (body.description !== undefined) {
    updates.description = body.description == null ? null : String(body.description).trim() || null
  }
  if (body.price != null) updates.price = parseInt(String(body.price), 10)
  const mrpBody = body.original_price !== undefined ? body.original_price : body.mrp
  if (body.original_price !== undefined || body.mrp !== undefined) {
    if (mrpBody === '' || mrpBody == null) {
      updates.original_price = null
    } else {
      const v = parseInt(String(mrpBody), 10)
      updates.original_price = Number.isFinite(v) ? v : null
    }
  }
  if (body.category != null && VALID_CATEGORIES.includes(body.category)) updates.category = body.category
  if (body.image_url !== undefined) {
    updates.image_url = body.image_url == null || body.image_url === '' ? null : String(body.image_url).trim()
  }
  if (body.model_url !== undefined) {
    updates.model_url = body.model_url == null || body.model_url === '' ? null : String(body.model_url).trim()
  }
  if (body.extra_images !== undefined) {
    updates.extra_images =
      body.extra_images == null || (Array.isArray(body.extra_images) && body.extra_images.length === 0)
        ? null
        : JSON.stringify(body.extra_images)
  }
  if (body.model_name !== undefined) {
    updates.model_name = body.model_name == null ? null : String(body.model_name).trim() || null
  }
  if (body.color !== undefined) {
    updates.color = body.color == null ? null : String(body.color).trim() || null
  }
  if (body.is_multi_color != null) updates.is_multi_color = Boolean(body.is_multi_color)
  if (body.height_cm !== undefined) {
    updates.height_cm =
      body.height_cm === '' || body.height_cm == null ? null : parseFloat(String(body.height_cm))
  }
  if (body.weight_g !== undefined) {
    updates.weight_g =
      body.weight_g === '' || body.weight_g == null ? null : parseFloat(String(body.weight_g))
  }
  if (body.sizes !== undefined) {
    updates.sizes =
      body.sizes == null || (Array.isArray(body.sizes) && body.sizes.length === 0)
        ? null
        : JSON.stringify(body.sizes)
  }
  if (body.rating !== undefined) {
    updates.rating =
      body.rating === '' || body.rating == null ? null : parseFloat(String(body.rating))
  }
  if (body.rating_count !== undefined) {
    updates.rating_count =
      body.rating_count === '' || body.rating_count == null ? null : parseInt(String(body.rating_count), 10)
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  revalidatePath('/shop')
  revalidatePath('/admin/products')
  revalidatePath(`/product/${id}`)
  return NextResponse.json({ product: data })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const auth = await requireAdminSession()
  if (isErrorResponse(auth)) return auth

  const supabase = createAdminClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  revalidatePath('/shop')
  revalidatePath('/admin/products')
  revalidatePath(`/product/${id}`)
  return NextResponse.json({ ok: true })
}
