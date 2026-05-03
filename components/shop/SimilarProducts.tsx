'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Flame, Star } from 'lucide-react'
import { getRetailPricing, formatCurrency } from '@/lib/pricing-utils'
import { shouldOptimizeImageSrc } from '@/lib/image-allowlist'
import { productDetailPath } from '@/lib/product-path'

interface Product {
  id: string
  name: string
  price: number
  original_price: number | null
  image_url: string | null
  category: string
  slug: string | null
  rating: number | null
  rating_count: number | null
}

interface Props {
  productId: string
  className?: string
}

export function SimilarProducts({ productId, className = '' }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    fetch(`/api/products/similar?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [productId])

  if (!loading && products.length === 0) return null

  return (
    <section className={`mt-10 md:mt-16 ${className}`}>
      <div className="mb-6 flex items-center gap-3">
        <Flame className="h-5 w-5 text-mugen-crimson" />
        <h2 className="font-cinzel text-2xl font-bold text-white">You Might Also Like</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-mugen-crimson/60" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <SimilarProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

function SimilarProductCard({ product }: { product: Product }) {
  const href = productDetailPath(product)
  const retail = getRetailPricing(product as unknown as Record<string, unknown>)
  const { mrpPaisa, hasDeal: hasDiscount, discountPct } = retail
  const salePaisa = retail.salePaisa
  const img = product.image_url || '/placeholder.svg'
  const hasRating =
    product.rating != null && product.rating > 0 && (product.rating_count ?? 0) > 0

  return (
    <Link
      href={href}
      className="group relative block aspect-[3/4] w-full overflow-visible rounded-2xl border border-white/10 bg-mugen-black shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/5 transition-[border-color,box-shadow,transform] duration-300 ease-out hover:border-mugen-magenta/35 hover:shadow-[0_20px_48px_rgba(184,77,122,0.18)] active:scale-[0.99] md:hover:-translate-y-0.5"
    >
      {/* Circular discount badge — identical to home page ProductCard, floats at top-left corner */}
      {hasDiscount && (
        <span
          className="pointer-events-none absolute -left-1.5 -top-1.5 z-30 flex h-[2.75rem] w-[2.75rem] -rotate-12
                     items-center justify-center rounded-full border-[3px] border-white
                     bg-gradient-to-br from-orange-500 via-red-600 to-red-800
                     text-[0.7rem] font-black tabular-nums leading-none text-white
                     shadow-[0_10px_28px_rgba(220,38,38,0.55),0_4px_12px_rgba(0,0,0,0.35)]
                     sm:-left-2 sm:-top-2 sm:h-[3.25rem] sm:w-[3.25rem] sm:text-[0.8125rem]"
          aria-label={`${discountPct} percent off`}
        >
          -{discountPct}%
        </span>
      )}

      {/* Full-bleed image + hover overlay — both clipped inside this div */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {product.image_url ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
            className="object-cover transition-transform duration-[380ms] ease-out will-change-transform group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
            unoptimized={!shouldOptimizeImageSrc(product.image_url)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mugen-dark to-mugen-black text-4xl opacity-40">
            🎭
          </div>
        )}

        {/* Hover-reveal overlay — clipped by parent, hidden by default via translate */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-full border-t border-white/10 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 pb-3.5 pt-3 backdrop-blur-md transition-transform duration-[360ms] ease-out group-hover:translate-y-0">
          {/* Product name */}
          <p className="mb-2 line-clamp-2 font-sans text-[11px] font-semibold leading-snug tracking-tight text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] sm:text-xs">
            {product.name}
          </p>

          {/* Pricing + rating row */}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="font-sans text-base font-bold tabular-nums leading-none text-mugen-gold sm:text-xl">
                {formatCurrency(salePaisa)}
              </p>
              {hasDiscount && mrpPaisa != null && (
                <p className="mt-0.5 font-sans text-[11px] tabular-nums text-white/45 line-through sm:mt-1">
                  {formatCurrency(mrpPaisa)}
                </p>
              )}
            </div>
            {hasRating && (
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                <div className="flex items-center gap-1 text-mugen-gold">
                  <Star className="h-3 w-3 fill-mugen-gold text-mugen-gold sm:h-3.5 sm:w-3.5" aria-hidden />
                  <span className="font-sans text-xs font-bold tabular-nums sm:text-sm">
                    {Number(product.rating).toFixed(1)}
                  </span>
                </div>
                {product.rating_count != null && (
                  <span className="font-sans text-[10px] text-white/40">
                    {product.rating_count.toLocaleString()} ratings
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
