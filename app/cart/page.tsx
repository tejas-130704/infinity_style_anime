'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/GlowButton'
import { Trash2 } from 'lucide-react'

type CartRow = {
  id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    image_url: string | null
    slug: string | null
  } | null
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/cart')
      return
    }
    setAuthChecked(true)
    const res = await fetch('/api/cart')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const json = await res.json()
    setItems(json.items ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onUpd = () => load()
    window.addEventListener('cart:updated', onUpd)
    return () => window.removeEventListener('cart:updated', onUpd)
  }, [load])

  async function updateQty(id: string, quantity: number) {
    if (quantity < 1) return
    await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity }),
    })
    load()
  }

  async function remove(id: string) {
    await fetch(`/api/cart?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    load()
  }

  const subtotal = items.reduce((acc, row) => {
    const p = row.products
    if (!p) return acc
    return acc + p.price * row.quantity
  }, 0)

  if (!authChecked && loading) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto px-4 text-white/70">Loading cart…</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-8">
        <h1 className="font-cinzel text-3xl font-bold text-white">Your cart</h1>

        {loading ? (
          <p className="mt-8 text-white/60">Loading…</p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-white/10 bg-mugen-dark/50 p-10 text-center">
            <p className="text-white/70">Your cart is empty.</p>
            <Link href="/shop" className="mt-4 inline-block font-semibold text-mugen-gold hover:text-white">
              Browse shop
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((row) => {
              const p = row.products
              if (!p) return null
              const img = p.image_url || '/placeholder.svg'
              return (
                <div
                  key={row.id}
                  className="flex gap-4 rounded-xl border border-white/10 bg-mugen-dark/40 p-4"
                >
                  <Link href={`/product/${p.id}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-mugen-black">
                    <Image src={img} alt={p.name} fill className="object-cover" unoptimized={img.startsWith('http')} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${p.id}`} className="font-semibold text-white hover:text-mugen-gold">
                      {p.name}
                    </Link>
                    <p className="mt-1 text-mugen-gold">{formatPrice(p.price)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        Qty
                        <input
                          type="number"
                          min={1}
                          className="w-16 rounded border border-mugen-gray bg-mugen-black/50 px-2 py-1 text-white"
                          value={row.quantity}
                          onChange={(e) => updateQty(row.id, parseInt(e.target.value, 10) || 1)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-cinzel text-xl text-white">
                Subtotal <span className="text-mugen-gold">{formatPrice(subtotal)}</span>
              </p>
              <GlowButton size="lg" onClick={() => router.push('/checkout')}>
                Checkout
              </GlowButton>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
