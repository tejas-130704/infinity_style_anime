export type MonthlyPoint = { label: string; orders: number; spendRupee: number }

export type StatusSlice = { name: string; value: number }

type OrderRow = {
  total_price: number
  payment_status: string
  status: string
  created_at: string
}

const PAISA_PER_RUPEE = 100

/** Last 12 calendar months: paid-order count + spend (₹) per month. */
export function buildMonthlySpendSeries(orders: OrderRow[]): MonthlyPoint[] {
  const now = new Date()
  const labels: { ym: string; label: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    labels.push({ ym, label })
  }

  const agg = new Map<string, { orders: number; spendRupee: number }>()
  for (const { ym } of labels) {
    agg.set(ym, { orders: 0, spendRupee: 0 })
  }

  for (const o of orders) {
    if (o.payment_status !== 'completed') continue
    const d = new Date(o.created_at)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const bucket = agg.get(ym)
    if (!bucket) continue
    bucket.orders += 1
    bucket.spendRupee += (o.total_price ?? 0) / PAISA_PER_RUPEE
  }

  return labels.map(({ ym, label }) => {
    const b = agg.get(ym)!
    return {
      label,
      orders: b.orders,
      spendRupee: Math.round(b.spendRupee * 100) / 100,
    }
  })
}

function countBy<T extends string>(items: T[]): StatusSlice[] {
  const m = new Map<string, number>()
  for (const x of items) {
    m.set(x, (m.get(x) ?? 0) + 1)
  }
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function buildPaymentStatusSlices(orders: OrderRow[]): StatusSlice[] {
  return countBy(orders.map((o) => o.payment_status || 'unknown'))
}

export function buildFulfillmentStatusSlices(orders: OrderRow[]): StatusSlice[] {
  return countBy(orders.map((o) => o.status || 'unknown'))
}
