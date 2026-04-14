import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Columns that exist on every products table variant we support */
const MINIMAL =
  'id, name, price, original_price, image_url, category, slug'

type Row = Record<string, unknown>

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: currentProduct, error: productErr } = await supabase
    .from('products')
    .select('id, category')
    .eq('id', productId)
    .maybeSingle()

  if (productErr || !currentProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const category = currentProduct.category as string

  async function runSimilarQuery(
    select: string,
    order: { column: string; ascending?: boolean }
  ): Promise<{ data: Row[] | null; error: { message: string } | null }> {
    return supabase
      .from('products')
      .select(select)
      .eq('is_public', true)   // never surface hidden products
      .eq('category', category)
      .neq('id', productId)
      .order(order.column, { ascending: order.ascending ?? false })
      .limit(6)
  }

  // Prefer rating-based order when columns exist; fall back to created_at or id
  const attempts: Array<{ select: string; order: { column: string; ascending?: boolean } }> = [
    { select: `${MINIMAL}, rating, rating_count, stock_quantity`, order: { column: 'rating_count', ascending: false } },
    { select: `${MINIMAL}, stock_quantity, created_at`, order: { column: 'created_at', ascending: false } },
    { select: MINIMAL, order: { column: 'id', ascending: false } },
  ]

  let similar: Row[] = []
  let lastErr: string | null = null

  for (const a of attempts) {
    const { data, error } = await runSimilarQuery(a.select, a.order)
    if (error) {
      lastErr = error.message
      continue
    }
    similar = data ?? []
    if (similar.length > 0) break
  }

  if (similar.length === 0) {
    const { data, error } = await runSimilarQuery(MINIMAL, { column: 'id', ascending: false })
    if (error) {
      return NextResponse.json(
        { error: lastErr || error.message || 'Similar products query failed', products: [] },
        { status: 500 }
      )
    }
    similar = data ?? []
  }

  let products = similar as Row[]
  if (products.length < 4) {
    const exclude = new Set<string>([productId, ...products.map((p) => String(p.id))])
    const { data: pool, error: poolErr } = await supabase
      .from('products')
      .select(MINIMAL)
      .eq('is_public', true)   // never surface hidden products in pool
      .order('id', { ascending: false })
      .limit(40)

    if (!poolErr && pool) {
      for (const p of pool) {
        if (products.length >= 6) break
        const pid = String(p.id)
        if (!exclude.has(pid)) {
          products.push(p)
          exclude.add(pid)
        }
      }
    }
  }

  const normalized = products.slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    original_price: p.original_price ?? null,
    image_url: p.image_url ?? null,
    category: p.category,
    slug: p.slug ?? null,
    rating: typeof p.rating === 'number' ? p.rating : null,
    rating_count: typeof p.rating_count === 'number' ? p.rating_count : null,
    stock_quantity: typeof p.stock_quantity === 'number' ? p.stock_quantity : null,
  }))

  return NextResponse.json({ products: normalized })
}
