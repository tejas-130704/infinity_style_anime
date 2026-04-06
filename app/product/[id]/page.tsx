import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductDetailClient, type ProductFull } from '@/components/shop/ProductDetailClient'
import type { Metadata } from 'next'

/* ── Dynamic SEO metadata ──────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name, description').eq('id', id).maybeSingle()
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
  const { id } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !product) notFound()

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

      <main className="min-h-screen bg-mugen-black pt-24 pb-20">
        {/* Ambient gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/2 h-[600px] w-[700px] -translate-x-1/2 rounded-full bg-mugen-magenta/5 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-mugen-crimson/6 blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 md:px-8">
          {/* ── Breadcrumb / back link ── */}
          <nav className="mb-8 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
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
            <span className="max-w-[220px] truncate font-sans text-white/70" aria-current="page">
              {product.name}
            </span>
          </nav>

          {/* ── Product detail grid ── */}
          <div className="animate-fade-up">
            <ProductDetailClient product={product as ProductFull} />
          </div>

          {/* ── Divider ── */}
          <hr className="my-16 border-none h-px bg-gradient-to-r from-transparent via-mugen-magenta/20 to-transparent" />

          {/* ── "You might also like" placeholder ── */}
          <section aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="mb-6 font-cinzel text-xl font-bold text-white"
            >
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-xl border border-white/6 bg-white/3"
                />
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-white/20">
              Related products coming soon
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
