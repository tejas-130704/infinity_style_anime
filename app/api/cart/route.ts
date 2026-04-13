import { NextResponse } from 'next/server'
import { getCartContext } from '@/lib/cart/get-cart-context'

export async function GET() {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await ctx.db
    .from('cart_items')
    .select(
      `
      id,
      quantity,
      selected_variant,
      products (
        id,
        name,
        price,
        original_price,
        image_url,
        category,
        slug
      )
    `
    )
    .eq('user_id', ctx.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const productId = body.product_id as string
  const qty = Math.max(1, parseInt(String(body.quantity ?? 1), 10) || 1)
  const selectedVariant: Record<string, string> = {}
  if (body.selected_variant?.color) selectedVariant.color = String(body.selected_variant.color)
  if (body.selected_variant?.size) selectedVariant.size = String(body.selected_variant.size)

  if (!productId) {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  }

  const { data: existing } = await ctx.db
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', ctx.userId)
    .eq('product_id', productId)
    .eq('selected_variant', JSON.stringify(selectedVariant))
    .maybeSingle()

  if (existing) {
    const { error } = await ctx.db
      .from('cart_items')
      .update({ quantity: existing.quantity + qty })
      .eq('id', existing.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await ctx.db.from('cart_items').insert({
      user_id: ctx.userId,
      product_id: productId,
      quantity: qty,
      selected_variant: selectedVariant,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const id = body.id as string
  const quantity = parseInt(String(body.quantity), 10)
  if (!id || !Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ error: 'Invalid id or quantity' }, { status: 400 })
  }

  const { error } = await ctx.db
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)
    .eq('user_id', ctx.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await ctx.db.from('cart_items').delete().eq('id', id).eq('user_id', ctx.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
