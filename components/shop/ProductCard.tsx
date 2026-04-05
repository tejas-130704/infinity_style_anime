import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ProductRow = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  slug: string | null
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100
  )
}

export function ProductCard({ product, className }: { product: ProductRow; className?: string }) {
  const img = product.image_url || '/placeholder.svg'
  return (
    <Link
      href={`/product/${product.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-mugen-dark/40 transition-all duration-300',
        'hover:border-mugen-glow/50 hover:shadow-[0_0_24px_rgba(255,211,77,0.15)]',
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-mugen-black">
        <Image
          src={img}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized={img.startsWith('http')}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="font-sans text-xs uppercase tracking-wider text-white/50">
          {product.category.replace('_', ' ')}
        </p>
        <h3 className="font-cinzel text-lg font-bold text-white line-clamp-2">{product.name}</h3>
        <p className="mt-auto font-sans text-lg font-semibold text-mugen-gold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
