import type { FulfillmentStatus } from './fulfillment-constants'
import { fulfillmentRank } from './fulfillment-constants'

export type TimelineStepVisual = 'completed' | 'current' | 'upcoming'

export type TimelineStep = {
  key: string
  label: string
  dayOffset: number
  state: TimelineStepVisual
  expectedDateIso: string
  subtitle: string
}

const STEP_DEF = [
  { key: 'ordered', label: 'Ordered', dayOffset: 0 },
  { key: 'packed', label: 'Packed', dayOffset: 1 },
  { key: 'shipped', label: 'Shipped', dayOffset: 2 },
  { key: 'out_for_delivery', label: 'Out for Delivery', dayOffset: 3 },
] as const

export function orderAnchorUtc(createdAtIso: string): Date {
  const d = new Date(createdAtIso)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export function addUtcDays(anchor: Date, days: number): Date {
  const x = new Date(anchor.getTime())
  x.setUTCDate(x.getUTCDate() + days)
  return x
}

export function formatInDayMonthUtc(isoDate: Date): string {
  return isoDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

/**
 * Four-step timeline. Step 4 completes only when `fulfillmentStatus === 'delivered'`.
 */
export function buildTimelineSteps(
  fulfillmentStatus: FulfillmentStatus | null,
  paymentCompleted: boolean,
  createdAtIso: string,
  actual: {
    packed_at: string | null
    shipped_at: string | null
    out_for_delivery_at: string | null
    delivered_at: string | null
  }
): { steps: TimelineStep[]; message: string; deliveryExpectedLine: string } {
  const anchor = orderAnchorUtc(createdAtIso)
  const deliveryExpected = addUtcDays(anchor, 3)

  if (!paymentCompleted || !fulfillmentStatus) {
    const steps: TimelineStep[] = STEP_DEF.map((def) => {
      const expected = addUtcDays(anchor, def.dayOffset)
      return {
        key: def.key,
        label: def.label,
        dayOffset: def.dayOffset,
        state: 'upcoming' as const,
        expectedDateIso: expected.toISOString(),
        subtitle: `Expected ${formatInDayMonthUtc(expected)}`,
      }
    })
    return {
      steps,
      message: 'Tracking will appear after payment is confirmed.',
      deliveryExpectedLine: '',
    }
  }

  const r = fulfillmentRank(fulfillmentStatus)
  const isDelivered = fulfillmentStatus === 'delivered'

  const steps: TimelineStep[] = STEP_DEF.map((def, i) => {
    const expected = addUtcDays(anchor, def.dayOffset)
    const expectedIso = expected.toISOString()

    let state: TimelineStepVisual
    if (isDelivered) {
      state = 'completed'
    } else if (i < r) {
      state = 'completed'
    } else if (i === r) {
      state = 'current'
    } else {
      state = 'upcoming'
    }

    let subtitle = `Expected ${formatInDayMonthUtc(expected)}`
    if (i === 0) subtitle = formatInDayMonthUtc(expected)

    if (def.key === 'packed' && actual.packed_at) {
      subtitle = new Date(actual.packed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    }
    if (def.key === 'shipped' && actual.shipped_at) {
      subtitle = new Date(actual.shipped_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    }
    if (def.key === 'out_for_delivery') {
      if (isDelivered && actual.delivered_at) {
        subtitle = `Delivered ${new Date(actual.delivered_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
      } else if (actual.out_for_delivery_at) {
        subtitle = new Date(actual.out_for_delivery_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      } else {
        subtitle = `Expected by ${formatInDayMonthUtc(deliveryExpected)}`
      }
    }

    return {
      key: def.key,
      label: def.label,
      dayOffset: def.dayOffset,
      state,
      expectedDateIso: expectedIso,
      subtitle,
    }
  })

  let message = 'Shipment yet to be delivered.'
  if (isDelivered) {
    message = 'Your order has been delivered. Thank you for shopping with us!'
  } else if (fulfillmentStatus === 'out_for_delivery') {
    message = 'Shipment is out for delivery. Our partner will reach you soon.'
  }

  const deliveryExpectedLine = `Expected delivery within 3 days — by ${formatInDayMonthUtc(deliveryExpected)}`

  return {
    steps,
    message,
    deliveryExpectedLine,
  }
}
