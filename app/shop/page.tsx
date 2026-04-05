import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/ProductCard'

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'posters', label: 'Posters' },
  { id: '3d_models', label: '3D Models' },
  { id: 'custom_designs', label: 'Custom Designs' },
] as const

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  let q = supabase.from('products').select('*').order('created_at', { ascending: false })
  if (category && ['posters', '3d_models', 'custom_designs'].includes(category)) {
    q = q.eq('category', category)
  }
  const { data: products, error } = await q

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-16">
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10">
          <h1 className="font-cinzel text-3xl font-bold text-white md:text-4xl">Shop</h1>
          <p className="mt-2 max-w-2xl font-sans text-white/70">
            Premium anime posters, 3D collectibles, and custom designs — Infinity Castle inspired curation.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const href = c.id ? `/shop?category=${c.id}` : '/shop'
            const active = (category || '') === c.id
            return (
              <Link
                key={c.id || 'all'}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-mugen-crimson/80 text-white ring-1 ring-mugen-glow/40'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                {c.label}
              </Link>
            )
          })}
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
            Could not load products. Configure Supabase in <code className="text-white">.env</code> and run{' '}
            <code className="text-white">supabase/schema.sql</code>.
          </p>
        )}

        {!error && (!products || products.length === 0) && (
          <p className="text-white/60">No products yet. Add items in Admin or run the seed SQL.</p>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {products?.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </main>
  )
}
