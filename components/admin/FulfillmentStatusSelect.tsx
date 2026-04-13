'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateFulfillmentStatusAction } from '@/app/admin/orders/server-actions'
import { FULFILLMENT_STATUSES, type FulfillmentStatus } from '@/lib/order/fulfillment-constants'

function label(s: string) {
  return s.replace(/_/g, ' ')
}

export function FulfillmentStatusSelect({
  orderId,
  value,
  paymentCompleted,
}: {
  orderId: string
  value: string | null
  paymentCompleted: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!paymentCompleted) {
    return (
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40">
        Tracking after payment
      </span>
    )
  }

  return (
    <select
      className="cursor-pointer rounded-lg border border-mugen-glow/30 bg-mugen-black/80 px-3 py-1.5 text-xs text-mugen-gold"
      value={value ?? 'ordered'}
      disabled={isPending}
      title="Shipment timeline (Flipkart-style)"
      onChange={(e) => {
        const next = e.target.value as FulfillmentStatus
        startTransition(async () => {
          await updateFulfillmentStatusAction({ orderId, fulfillment_status: next })
          router.refresh()
        })
      }}
    >
      {FULFILLMENT_STATUSES.map((s) => (
        <option key={s} value={s} style={{ backgroundColor: '#22201f', color: '#f5f5f5' }}>
          {label(s)}
        </option>
      ))}
    </select>
  )
}
