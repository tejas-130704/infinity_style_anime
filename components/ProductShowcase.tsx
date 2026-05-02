'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductCard, type ProductRow } from '@/components/shop/ProductCard'
import { SectionTitle } from '@/components/SectionTitle'

function SkeletonCard() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-mugen-dark/50 animate-pulse">
      <div className="aspect-[3/4] w-full bg-white/5" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-3 w-16 rounded bg-white/8" />
        <div className="h-4 w-3/4 rounded bg-white/8" />
        <div className="mt-2 h-5 w-1/2 rounded bg-white/8" />
      </div>
    </div>
  )
}

export function ProductShowcase() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(48)

        if (cancelled) return

        const pool = (data ?? []) as ProductRow[]
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[pool[i], pool[j]] = [pool[j], pool[i]]
        }

        setProducts(pool.slice(0, 8))
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'error') return null

  return (
    <section className="relative py-20 md:py-28 lg:py-36 bg-mugen-black overflow-hidden">

      <div className="relative z-10 mx-auto max-w-7xl px-4">

        {/* HEADER */}
        <div className="mb-12 flex flex-col sm:flex-row sm:justify-between gap-5">
          <SectionTitle
            title="Featured Products"
            japaneseSubtitle="フィーチャード プロダクト"
            subtitle="Handpicked anime merch — crafted for fans who live the story"
          />

          <Link href="/shop" className="hidden sm:flex items-center gap-2 text-mugen-magenta">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {/* LOADING */}
        {status === 'loading' ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? null : (
          <>
            {/* 🔥 MOBILE CAROUSEL */}
            <div className="md:hidden relative pt-6">

              <div
                className="
                  flex gap-4 overflow-x-auto
                  snap-x snap-mandatory scroll-smooth
                  no-scrollbar
                  pt-4 px-[5%]
                "
                style={{ scrollPaddingInline: '5%' }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="
                      snap-center shrink-0
                      w-[90%] max-w-[340px]
                      border border-white/50 rounded-2xl
                    "
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* DOT INDICATOR */}
              <div className="mt-5 flex justify-center gap-2">
                {products.map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/30" />
                ))}
              </div>
            </div>

            {/* ✅ DESKTOP GRID (UNCHANGED) */}
            <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        {status === 'ready' && (
          <div className="mt-16 flex justify-center">
            <Link href="/shop" className="border px-6 py-3 rounded-full">
              Explore Full Shop
            </Link>
          </div>
        )}
      </div>

      {/* SCROLLBAR FIX */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}