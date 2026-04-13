'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function DeactivateCouponButton({ couponId }: { couponId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDeactivate() {
    if (!confirm('Deactivate this coupon? It will no longer apply to new checkouts.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/coupons')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onDeactivate}
      disabled={loading}
      className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 disabled:opacity-50"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Working…
        </span>
      ) : (
        'Deactivate'
      )}
    </button>
  )
}
