'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X } from 'lucide-react'
import { deleteOrderAction, updateOrderAdminAction } from '@/app/admin/orders/server-actions'
import { formatMoneyINRFromPaise } from '@/lib/admin/format'

const FULFILLMENT = [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

const PAYMENT = ['pending', 'completed', 'failed', 'refunded'] as const

function label(s: string) {
  return s.replace(/_/g, ' ')
}

type Props = {
  orderId: string
  userId: string
  initial: {
    status: string
    payment_status: string
    order_notes: string | null
    total_price: number
  }
}

export function OrderAdminControls({ orderId, userId, initial }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [status, setStatus] = useState(initial.status)
  const [paymentStatus, setPaymentStatus] = useState(initial.payment_status)
  const [notes, setNotes] = useState(initial.order_notes ?? '')
  const [totalRupees, setTotalRupees] = useState(String((initial.total_price ?? 0) / 100))
  const [editTotal, setEditTotal] = useState(false)

  function resetForm() {
    setStatus(initial.status)
    setPaymentStatus(initial.payment_status)
    setNotes(initial.order_notes ?? '')
    setTotalRupees(String((initial.total_price ?? 0) / 100))
    setEditTotal(false)
    setError(null)
  }

  function onSave() {
    setError(null)
    const payload: Parameters<typeof updateOrderAdminAction>[0] = {
      orderId,
      userId,
      status,
      payment_status: paymentStatus,
      order_notes: notes,
    }

    if (editTotal) {
      const rupees = parseFloat(totalRupees.replace(/[^0-9.]/g, ''))
      if (!Number.isFinite(rupees) || rupees < 0) {
        setError('Enter a valid total in ₹')
        return
      }
      payload.total_price_paise = Math.round(rupees * 100)
    }

    startTransition(async () => {
      try {
        await updateOrderAdminAction(payload)
        setOpen(false)
        resetForm()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Update failed')
      }
    })
  }

  function onDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteOrderAction({ orderId, userId })
        setConfirmDelete(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          resetForm()
          setOpen(true)
        }}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setConfirmDelete(true)
        }}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-950/50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-mugen-dark p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-cinzel text-lg font-bold text-white">Edit order</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 font-mono text-[10px] text-white/40">{orderId}</p>

            {error && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/50">Fulfillment</label>
                <select
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-mugen-black/80 px-3 py-2 text-sm text-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {FULFILLMENT.map((s) => (
                    <option key={s} value={s} style={{ backgroundColor: '#22201f', color: '#f5f5f5' }}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/50">Payment</label>
                <select
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-mugen-black/80 px-3 py-2 text-sm text-white"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  {PAYMENT.map((s) => (
                    <option key={s} value={s} style={{ backgroundColor: '#22201f', color: '#f5f5f5' }}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-white/50">
                  <span>Total (₹)</span>
                  <label className="flex cursor-pointer items-center gap-1.5 font-normal text-white/40">
                    <input type="checkbox" checked={editTotal} onChange={(e) => setEditTotal(e.target.checked)} />
                    Adjust total
                  </label>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={!editTotal}
                  className="w-full rounded-lg border border-white/10 bg-mugen-black/80 px-3 py-2 text-sm text-white disabled:opacity-50"
                  value={totalRupees}
                  onChange={(e) => setTotalRupees(e.target.value)}
                  placeholder="e.g. 1499"
                />
                {!editTotal && (
                  <p className="mt-1 text-xs text-white/35">Current: {formatMoneyINRFromPaise(initial.total_price)}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/50">Internal notes</label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 bg-mugen-black/80 px-3 py-2 text-sm text-white placeholder:text-white/25"
                  placeholder="Optional note for this order…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={onSave}
                className="rounded-lg border border-mugen-glow/40 bg-mugen-crimson/40 px-4 py-2 text-sm font-semibold text-white hover:bg-mugen-crimson/60 disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="alertdialog"
        >
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-mugen-black p-5 shadow-2xl">
            <h3 className="font-cinzel text-lg font-bold text-white">Delete this order?</h3>
            <p className="mt-2 text-sm text-white/60">
              This removes the order and its line items. This cannot be undone.
            </p>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={onDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
