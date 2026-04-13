import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCartContext } from '@/lib/cart/get-cart-context'

/** Total likes for a product (RLS hides others’ rows from the anon/user client). */
async function countLikesForProduct(productId: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('product_likes')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
  if (error) return 0
  return count ?? 0
}

export async function GET(request: Request) {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const { userId, db } = ctx

  const [{ data }, likeCount] = await Promise.all([
    db
      .from('product_likes')
      .select('product_id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle(),
    countLikesForProduct(productId),
  ])

  return NextResponse.json({ liked: !!data, likeCount })
}

export async function POST(request: Request) {
  const ctx = await getCartContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const productId = body.productId as string | undefined
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const { userId, db } = ctx

  const { data: existing } = await db
    .from('product_likes')
    .select('product_id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await db.from('product_likes').delete().eq('product_id', productId).eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await db.from('product_likes').insert({ product_id: productId, user_id: userId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const likeCount = await countLikesForProduct(productId)

  return NextResponse.json({ liked: !existing, likeCount })
}
