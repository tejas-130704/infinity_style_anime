'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { GlowButton } from '@/components/GlowButton'
import { useUserMe } from '@/hooks/useUserMe'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing-utils'
import { productDetailPath } from '@/lib/product-path'

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

export default function CartPage() {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const { user: meUser, isLoading: meLoading } = useUserMe()
  const sessionAuthed = sessionStatus === 'authenticated'
  const [items, setItems] = useState<CartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  /** While typing qty, keep local string so empty/partial input doesn't fight the server */
  const [qtyDraftByLine, setQtyDraftByLine] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const json = await res.json()
    setItems(json.items ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (sessionStatus === 'loading' || meLoading) return
    if (!meUser && !sessionAuthed) {
      router.push('/login?next=/cart')
      return
    }
    setLoading(true)
    void load()
  }, [sessionStatus, meLoading, meUser, sessionAuthed, router, load])

  useEffect(() => {
    const onUpd = () => load()
    window.addEventListener('cart:updated', onUpd)
    return () => window.removeEventListener('cart:updated', onUpd)
  }, [load])

  async function updateQty(id: string, quantity: number) {
    if (quantity < 1) return
    setUpdatingId(id)
    try {
      await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity }),
      })
      setQtyDraftByLine((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await load()
    } finally {
      setUpdatingId(null)
    }
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

  if (sessionStatus === 'loading' || meLoading) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto px-4 text-white/70">Loading cart…</div>
      </main>
    )
  }

  if (!meUser && !sessionAuthed) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto px-4 text-white/70">Redirecting to sign in…</div>
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
                  <Link href={productDetailPath(p)} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-mugen-black">
                    <Image src={img} alt={p.name} fill className="object-cover" unoptimized={img.startsWith('http')} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={productDetailPath(p)} className="font-semibold text-white hover:text-mugen-gold">
                      {p.name}
                    </Link>
                    <p className="mt-1 text-mugen-gold">{formatCurrency(p.price)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <span className="shrink-0">Qty</span>
                        <div
                          className="inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-white/15 bg-mugen-black/70 shadow-inner"
                          role="group"
                          aria-label="Quantity"
                        >
                          <button
                            type="button"
                            disabled={updatingId === row.id || row.quantity <= 1}
                            className="flex min-w-[2.5rem] items-center justify-center text-white/90 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-35"
                            aria-label="Decrease quantity"
                            onClick={() => updateQty(row.id, row.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            aria-label="Quantity value"
                            disabled={updatingId === row.id}
                            className="w-12 min-w-[3rem] border-x border-white/10 bg-transparent px-1 text-center text-sm font-medium tabular-nums text-white outline-none ring-inset transition focus:ring-2 focus:ring-mugen-gold/50 disabled:opacity-50"
                            value={
                              qtyDraftByLine[row.id] !== undefined
                                ? qtyDraftByLine[row.id]!
                                : String(row.quantity)
                            }
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '')
                              setQtyDraftByLine((prev) => ({ ...prev, [row.id]: raw }))
                            }}
                            onBlur={() => {
                              const raw = qtyDraftByLine[row.id]
                              if (raw === undefined) return
                              const n = parseInt(raw, 10)
                              setQtyDraftByLine((prev) => {
                                const next = { ...prev }
                                delete next[row.id]
                                return next
                              })
                              if (!Number.isFinite(n) || n < 1) {
                                void load()
                                return
                              }
                              if (n !== row.quantity) void updateQty(row.id, n)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            }}
                          />
                          <button
                            type="button"
                            disabled={updatingId === row.id}
                            className="flex min-w-[2.5rem] items-center justify-center text-white/90 transition hover:bg-white/10 disabled:opacity-50"
                            aria-label="Increase quantity"
                            onClick={() => updateQty(row.id, row.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
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
                Subtotal <span className="text-mugen-gold">{formatCurrency(subtotal)}</span>
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
