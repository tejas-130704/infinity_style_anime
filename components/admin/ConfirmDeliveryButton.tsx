'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { updateFulfillmentStatusAction } from '@/app/admin/orders/server-actions'

export function ConfirmDeliveryButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await updateFulfillmentStatusAction({ orderId, fulfillment_status: 'delivered' })
          router.refresh()
        })
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {pending ? 'Saving…' : 'Confirm delivery'}
    </button>
  )
}
