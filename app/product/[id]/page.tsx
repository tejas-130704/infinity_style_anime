import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddToCartButton } from '@/components/shop/AddToCartButton'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: product, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()

  if (error || !product) {
    notFound()
  }

  const img = product.image_url || '/placeholder.svg'

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        <Link
          href="/shop"
          className="mb-8 inline-flex font-sans text-sm font-medium text-mugen-gold hover:text-white"
        >
          ← Back to shop
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-mugen-dark">
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
              unoptimized={img.startsWith('http')}
            />
          </div>

          <div className="flex flex-col">
            <p className="font-sans text-sm uppercase tracking-widest text-white/50">
              {String(product.category).replace('_', ' ')}
            </p>
            <h1 className="mt-2 font-cinzel text-3xl font-bold text-white md:text-4xl">{product.name}</h1>
            <p className="mt-4 font-sans text-2xl font-semibold text-mugen-gold">{formatPrice(product.price)}</p>
            {product.description && (
              <p className="mt-6 font-sans leading-relaxed text-white/80">{product.description}</p>
            )}
            <div className="mt-10">
              <AddToCartButton productId={product.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
