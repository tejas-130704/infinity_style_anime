'use client'

import { useTransition } from 'react'
import { updateOrderStatusAction } from '@/app/admin/orders/server-actions'

const STATUS_OPTIONS = [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

function label(s: string) {
  return s.replace(/_/g, ' ')
}

export function OrderStatusSelect({
  orderId,
  value,
}: {
  orderId: string
  value: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      className="cursor-pointer rounded-lg border border-mugen-gray bg-mugen-black/80 px-3 py-1.5 text-sm text-white"
      defaultValue={value}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value
        startTransition(async () => {
          await updateOrderStatusAction({ orderId, status: next })
        })
      }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s} style={{ backgroundColor: '#22201f', color: '#f5f5f5' }}>
          {label(s)}
        </option>
      ))}
    </select>
  )
}

