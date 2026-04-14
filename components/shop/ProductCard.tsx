import Image from 'next/image'
import Link from 'next/link'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import { getRetailPricing } from '@/lib/pricing-utils'
import { productDetailPath } from '@/lib/product-path'
import { shouldOptimizeImageSrc } from '@/lib/image-allowlist'
import { Box, Star } from 'lucide-react'

export type ProductRow = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  slug: string | null
  original_price?: number | null
  rating?: number | null
  rating_count?: number | null
  /** Visibility flag — false means hidden from public shop */
  is_public?: boolean
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(cents / 100)
}

export const ProductCard = memo(function ProductCard({
  product,
  className,
}: {
  product: ProductRow
  className?: string
}) {
  const img          = product.image_url || '/placeholder.svg'
  const isActionFig  = product.category === 'action_figures'
  const retail       = getRetailPricing(product as unknown as Record<string, unknown>)
  const { mrpPaisa, hasDeal, discountPct: discount } = retail
  const optimizeImg  = shouldOptimizeImageSrc(img)

  return (
    <Link
      href={productDetailPath(product)}
      className={cn(
        'group relative flex flex-col overflow-visible rounded-2xl touch-manipulation',
        'border border-white/8 bg-mugen-dark/50',
        'transition-all duration-300 ease-out',
        'active:scale-[0.99] md:active:scale-100',
        'md:hover:border-mugen-magenta/40',
        'md:hover:shadow-[0_8px_40px_rgba(184,77,122,0.18),0_0_0_1px_rgba(184,77,122,0.15)]',
        'md:hover:-translate-y-0.5',
        className,
      )}
    >
      {/* Circular discount badge — sits above card edge (parent is overflow-visible) */}
      {hasDeal && (
        <span
          className="pointer-events-none absolute -left-1.5 -top-1.5 z-30 flex h-[3.25rem] w-[3.25rem] -rotate-12
                     items-center justify-center rounded-full border-[3px] border-white
                     bg-gradient-to-br from-orange-500 via-red-600 to-red-800
                     text-[0.8125rem] font-black tabular-nums leading-none text-white shadow-[0_10px_28px_rgba(220,38,38,0.55),0_4px_12px_rgba(0,0,0,0.35)]
                     sm:-left-2 sm:-top-2 sm:h-[3.75rem] sm:w-[3.75rem] sm:text-[0.9375rem]"
          aria-label={`${discount} percent off`}
        >
          -{discount}%
        </span>
      )}

      {/* Image wrapper — only this region clips the photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl bg-gradient-to-b from-mugen-dark to-mugen-black">
        <Image
          src={img}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-out md:group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 24vw"
          unoptimized={!optimizeImg}
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-mugen-black/60 via-transparent to-transparent
                     opacity-0 transition-opacity duration-300 md:group-hover:opacity-100"
        />

        {/* 3D badge for action figures — keep clear of discount badge */}
        {isActionFig && (
          <span
            className={cn(
              'absolute right-2 z-10 flex items-center gap-1 rounded-full',
              'border border-mugen-magenta/30 bg-mugen-black/80 px-2 py-0.5',
              'font-sans text-[9px] font-bold uppercase tracking-widest text-mugen-magenta/80 backdrop-blur-sm',
              hasDeal ? 'top-10 sm:top-11' : 'top-2',
            )}
          >
            <Box className="h-2.5 w-2.5" />
            3D
          </span>
        )}

        {/* Rating pill on hover */}
        {product.rating != null && product.rating > 0 && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-1
                       rounded-full border border-white/10 bg-mugen-black/80
                       px-2 py-0.5 backdrop-blur-sm
                       opacity-0 transition-opacity duration-200 md:group-hover:opacity-100"
          >
            <Star className="h-2.5 w-2.5 fill-mugen-gold text-mugen-gold" />
            <span className="font-sans text-[10px] font-bold text-mugen-gold">
              {product.rating.toFixed(1)}
            </span>
            {product.rating_count != null && (
              <span className="font-sans text-[9px] text-white/30">
                ({product.rating_count.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col gap-1.5 rounded-b-2xl p-3.5">
        <p
          className="inline-flex w-fit max-w-full items-center rounded-md border border-white/35 bg-white/[0.04]
                     px-2 py-0.5 font-sans text-[10px] font-extrabold uppercase tracking-widest text-white/90"
        >
          {product.category.replace(/_/g, ' ')}
        </p>
        <h3 className="font-cinzel text-sm font-bold leading-snug text-white line-clamp-2">
          {product.name}
        </h3>

        {/* Pricing — sale price dominant; MRP subdued; savings line when on deal */}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2 sm:gap-x-3">
            <span
              className="font-cinzel text-lg font-extrabold tabular-nums leading-none tracking-tight text-white
                         sm:text-[1.375rem]"
            >
              {fmt(retail.salePaisa)}
            </span>
            {hasDeal && mrpPaisa != null && (
              <span className="font-sans text-[0.75rem] tabular-nums text-white/45 line-through sm:text-sm">
                {fmt(mrpPaisa)}
              </span>
            )}
          </div>
          {hasDeal && mrpPaisa != null && mrpPaisa > retail.salePaisa && (
            <p className="font-sans text-[11px] font-semibold tabular-nums text-emerald-400/95 sm:text-xs">
              Save {fmt(mrpPaisa - retail.salePaisa)}
              <span className="mx-1.5 text-white/20" aria-hidden>
                ·
              </span>
              {discount}% OFF
            </p>
          )}
        </div>
      </div>

      {/* Bottom reveal bar on hover */}
      <div
        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r
                   from-mugen-magenta/0 via-mugen-magenta to-mugen-magenta/0
                   scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
      />
    </Link>
  )
})
