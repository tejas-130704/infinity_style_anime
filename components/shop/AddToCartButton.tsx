'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ShoppingCart, CheckCircle, AlertCircle, Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { productDetailPath } from '@/lib/product-path'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface AddToCartButtonProps {
  productId: string
  /** Used for post-login redirect URL (pretty /product/slug when set). */
  productSlug?: string | null
  /** Pass the currently selected color (for single-color products) */
  selectedColor?: string
  /** Pass the currently selected size (for poster products)  */
  selectedSize?: string
  /**
   * If true, the product has variants that MUST be selected.
   * Color products: must have selectedColor.
   * Poster products: must have selectedSize.
   */
  requiresVariant?: boolean
  variantLabel?: string   // e.g. "a colour" or "a size"
}

export function AddToCartButton({
  productId,
  productSlug,
  selectedColor,
  selectedSize,
  requiresVariant = false,
  variantLabel = 'a variant',
}: AddToCartButtonProps) {
  const router = useRouter()
  const { status: nextAuthStatus } = useSession()
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [showVariantError, setShowVariantError] = useState(false)

  const variantSelected = !requiresVariant || selectedColor || selectedSize

  async function add() {
    // Variant gate
    if (!variantSelected) {
      setShowVariantError(true)
      setTimeout(() => setShowVariantError(false), 3000)
      return
    }

    setErrMsg(null)
    setShowVariantError(false)
    setStatus('loading')

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const signedIn = !!user || nextAuthStatus === 'authenticated'
    if (!signedIn) {
      const nextPath = productDetailPath({ id: productId, slug: productSlug ?? null })
      router.push(`/login?next=${encodeURIComponent(nextPath)}`)
      setStatus('idle')
      return
    }

    try {
      const selected_variant: Record<string, string> = {}
      if (selectedColor) selected_variant.color = selectedColor
      if (selectedSize)  selected_variant.size  = selectedSize

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
          selected_variant,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErrMsg(j.error || 'Could not add to cart')
        setStatus('error')
        return
      }
      setStatus('success')
      window.dispatchEvent(new Event('cart:updated'))
      router.refresh()
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setErrMsg('Network error — please try again')
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError   = status === 'error'

  return (
    <div className="flex flex-col gap-2">
      <button
        id="btn-add-to-cart"
        onClick={add}
        disabled={isLoading || isSuccess}
        aria-label="Add to cart"
        className={`
          relative flex h-12 w-full items-center justify-center gap-2.5
          overflow-hidden rounded-xl font-cinzel text-sm font-bold uppercase tracking-widest
          transition-all duration-300 select-none
          ${isSuccess
            ? 'border border-green-500/40 bg-green-600/20 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
            : isError
              ? 'border border-red-500/30 bg-red-950/20 text-red-400'
              : showVariantError
                ? 'border border-amber-500/50 bg-amber-900/20 text-amber-300 animate-pulse'
                : 'border border-mugen-crimson/60 bg-gradient-to-r from-mugen-crimson to-mugen-magenta text-white shadow-[0_4px_24px_rgba(134,56,65,0.45)] hover:shadow-[0_6px_32px_rgba(184,77,122,0.55)] hover:scale-[1.01] active:scale-[0.99]'
          }
          disabled:cursor-not-allowed
        `}
      >
        {/* Shimmer sweep on hover */}
        {!isLoading && !isSuccess && !isError && !showVariantError && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full
                       bg-gradient-to-r from-transparent via-white/15 to-transparent
                       opacity-0 transition-all duration-700 ease-out
                       group-hover:translate-x-[300%] group-hover:opacity-100"
          />
        )}

        {isLoading       && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSuccess       && <CheckCircle className="h-4 w-4" />}
        {isError         && <AlertCircle className="h-4 w-4" />}
        {showVariantError && <AlertTriangle className="h-4 w-4" />}
        {!isLoading && !isSuccess && !isError && !showVariantError && (
          <ShoppingCart className="h-4 w-4" />
        )}

        <span>
          {isLoading       ? 'Adding…'
            : isSuccess    ? 'Added to Cart!'
            : isError      ? 'Failed — Retry'
            : showVariantError ? `Please select ${variantLabel} first`
            : 'Add to Cart'}
        </span>
      </button>

      {isError && errMsg && (
        <p className="flex items-center gap-1.5 font-sans text-xs text-red-400/80">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {errMsg}
        </p>
      )}
    </div>
  )
}
