'use client'

import { Check, Circle, Package } from 'lucide-react'
import type { TimelineStep } from '@/lib/order/tracking'
import { cn } from '@/lib/utils'

type Props = {
  steps: TimelineStep[]
  message: string
  deliveryExpectedLine: string
  cancelled?: boolean
}

export function OrderTrackingTimeline({ steps, message, deliveryExpectedLine, cancelled }: Props) {
  if (cancelled) return null

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-cinzel text-lg font-bold text-white">Order tracking</h2>
        {deliveryExpectedLine ? (
          <p className="max-w-[220px] text-right text-xs font-medium leading-snug text-emerald-400/90">
            {deliveryExpectedLine}
          </p>
        ) : null}
      </div>

      <p className="mb-6 text-sm text-white/65 transition-opacity duration-500">{message}</p>

      <ol className="relative space-y-0">
        {steps.map((step, i) => {
          const connectorGreen = i > 0 && steps[i - 1]?.state === 'completed'

          return (
            <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
              {i > 0 && (
                <div
                  className={cn(
                    'absolute left-4 top-0 h-8 w-0.5 -translate-y-full transition-colors duration-700',
                    connectorGreen ? 'bg-emerald-500' : 'bg-white/10'
                  )}
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500',
                  step.state === 'completed' && 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]',
                  step.state === 'current' &&
                    'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.25)] ring-2 ring-amber-500/30',
                  step.state === 'upcoming' && 'border-white/15 bg-mugen-black text-white/25'
                )}
              >
                {step.state === 'completed' ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : step.state === 'current' ? (
                  <Package className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors duration-500',
                    step.state === 'completed' && 'text-emerald-100',
                    step.state === 'current' && 'text-amber-100',
                    step.state === 'upcoming' && 'text-white/35'
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-xs transition-colors duration-500',
                    step.state === 'upcoming' ? 'text-white/30' : 'text-white/55'
                  )}
                >
                  {step.subtitle}
                </p>
                {step.state === 'current' && step.key === 'out_for_delivery' && (
                  <p className="mt-1 text-xs font-medium text-amber-200/90">
                    Shipment yet to be delivered — we’ll confirm once it reaches you.
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
