import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const supabase = await createClient()
  let q = supabase.from('products').select('*').order('created_at', { ascending: false })
  if (category && ['posters', '3d_models', 'custom_designs'].includes(category)) {
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
  const category = body.category as string
  const image_url = body.image_url ? String(body.image_url) : null
  const model_url = body.model_url ? String(body.model_url) : null

  if (!name || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'Invalid name or price' }, { status: 400 })
  }
  if (!['posters', '3d_models', 'custom_designs'].includes(category)) {
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
      category,
      image_url,
      model_url,
      slug: `${slug}-${Date.now().toString(36)}`,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ product: data })
}
