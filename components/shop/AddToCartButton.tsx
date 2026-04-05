'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/GlowButton'

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function add() {
    setMessage(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?next=/product/${productId}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setMessage(j.error || 'Could not add to cart')
        return
      }
      setMessage('Added to cart')
      window.dispatchEvent(new Event('cart:updated'))
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <GlowButton size="lg" onClick={add} disabled={loading} className="w-full sm:w-auto">
        {loading ? 'Adding…' : 'Add to cart'}
      </GlowButton>
      {message && <p className="font-sans text-sm text-mugen-gold">{message}</p>}
    </div>
  )
}
