import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(cents / 100)
}

function pct(final: number, original: number) {
  return Math.round(((original - final) / original) * 100)
}

export function ProductCard({ product, className }: { product: ProductRow; className?: string }) {
  const img          = product.image_url || '/placeholder.svg'
  const isActionFig  = product.category === 'action_figures'
  const hasDeal      = product.original_price != null && product.original_price > product.price
  const discount     = hasDeal ? pct(product.price, product.original_price!) : 0

  return (
    <Link
      href={`/product/${product.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'border border-white/8 bg-mugen-dark/50',
        'transition-all duration-300 ease-out',
        'hover:border-mugen-magenta/40',
        'hover:shadow-[0_8px_40px_rgba(184,77,122,0.18),0_0_0_1px_rgba(184,77,122,0.15)]',
        'hover:-translate-y-0.5',
        className,
      )}
    >
      {/* Image wrapper */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-mugen-dark to-mugen-black">
        <Image
          src={img}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized={img.startsWith('http')}
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-mugen-black/60 via-transparent to-transparent
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Discount badge */}
        {hasDeal && (
          <span
            className="absolute top-2 left-2 rounded-md bg-mugen-crimson px-2 py-0.5
                       font-sans text-[10px] font-extrabold text-white shadow-md"
          >
            -{discount}%
          </span>
        )}

        {/* 3D badge for action figures */}
        {isActionFig && (
          <span
            className="absolute top-2 right-2 flex items-center gap-1 rounded-full
                       border border-mugen-magenta/30 bg-mugen-black/80 px-2 py-0.5
                       font-sans text-[9px] font-bold uppercase tracking-widest text-mugen-magenta/80
                       backdrop-blur-sm"
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
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-mugen-magenta/70">
          {product.category.replace(/_/g, ' ')}
        </p>
        <h3 className="font-cinzel text-sm font-bold leading-snug text-white line-clamp-2">
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1.5">
          <span className="font-cinzel text-base font-bold text-white">
            {fmt(product.price)}
          </span>
          {hasDeal && (
            <span className="font-sans text-xs text-white/30 line-through">
              {fmt(product.original_price!)}
            </span>
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
}
