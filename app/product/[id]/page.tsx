import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCartContext } from '@/lib/cart/get-cart-context'
import { ProductDetailClient, type ProductFull } from '@/components/shop/ProductDetailClient'
import { SimilarProducts } from '@/components/shop/SimilarProducts'
import { normalizeProductPriceFields } from '@/lib/pricing-utils'
import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Always read fresh prices/MRP from DB after admin edits (avoid stale ISR cache). */
export const dynamic = 'force-dynamic'

/** Route param is either a UUID (`/product/uuid`) or a slug (`/product/my-item-slug`). */
function isUuidParam(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

async function getProductByRouteSegment(
  supabase: SupabaseClient,
  segment: string
) {
  if (isUuidParam(segment)) {
    return supabase
      .from('products')
      .select('*')
      .eq('id', segment)
      .eq('is_public', true) // hidden products are inaccessible to public users
      .maybeSingle()
  }
  return supabase
    .from('products')
    .select('*')
    .eq('slug', segment)
    .eq('is_public', true) // hidden products are inaccessible to public users
    .maybeSingle()
}

/* ── Dynamic SEO metadata ──────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id: segment } = await params
  const supabase = await createClient()
  const { data } = await getProductByRouteSegment(supabase, segment)
  return {
    title: data?.name ? `${data.name} | Mugen Drip` : 'Product | Mugen Drip',
    description: data?.description ?? 'Premium anime collectibles — action figures & posters.',
  }
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: segment } = await params
  const supabase = await createClient()
  const ctx = await getCartContext()

  const { data: product, error } = await getProductByRouteSegment(supabase, segment)

  if (error || !product) notFound()

  const productId = product.id as string

  const { price, original_price } = normalizeProductPriceFields(product as { price: unknown; original_price?: unknown; mrp?: unknown })
  const productForClient = { ...product, price, original_price }

  const admin = createAdminClient()
  const [{ count: likeCount }, { data: likedRow }] = await Promise.all([
    admin.from('product_likes').select('*', { count: 'exact', head: true }).eq('product_id', productId),
    ctx
      ? ctx.db
          .from('product_likes')
          .select('product_id')
          .eq('product_id', productId)
          .eq('user_id', ctx.userId)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: { product_id: string } | null }),
  ])

  return (
    <>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.45s ease both; }

        @keyframes glow-in {
          from { box-shadow: 0 0 0 rgba(184,77,122,0); }
          to   { box-shadow: 0 0 28px rgba(184,77,122,0.18); }
        }
      `}</style>

      <main className="min-h-screen bg-mugen-black pt-20 md:pt-24 pb-20">
        {/* Ambient gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/2 h-[600px] w-[700px] -translate-x-1/2 rounded-full bg-mugen-magenta/5 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-mugen-crimson/6 blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          {/* ── Breadcrumb / back link ── */}
          <nav className="mb-5 md:mb-8 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 font-sans font-medium text-white/45 transition hover:text-mugen-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Shop
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href={`/shop?category=${product.category}`}
              className="font-sans text-white/45 capitalize transition hover:text-mugen-gold"
            >
              {String(product.category).replace(/_/g, ' ')}
            </Link>
            <span className="text-white/20">/</span>
            <span className="max-w-[140px] sm:max-w-[260px] truncate font-sans text-white/70" aria-current="page">
              {product.name}
            </span>
          </nav>

          {/* ── Product detail grid ── */}
          <div className="animate-fade-up">
            <ProductDetailClient
              product={
                {
                  ...(productForClient as object),
                  __liked: !!likedRow,
                  __likeCount: likeCount ?? 0,
                } as ProductFull
              }
            />
          </div>

          {/* ── Divider ── */}
          <hr className="my-8 md:my-16 border-none h-px bg-gradient-to-r from-transparent via-mugen-magenta/20 to-transparent" />

          {/* ── Similar Products ── */}
          <SimilarProducts productId={productId} />
        </div>
      </main>
    </>
  )
}
