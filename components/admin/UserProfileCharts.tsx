'use client'

import type { MonthlyPoint, StatusSlice } from '@/lib/admin/user-profile-stats'

export type { MonthlyPoint, StatusSlice } from '@/lib/admin/user-profile-stats'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const GOLD = '#D4AF37'
const MUTED = ['#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

type Props = {
  monthly: MonthlyPoint[]
  paymentStatus: StatusSlice[]
  fulfillmentStatus: StatusSlice[]
}

function MonthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: MonthlyPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload as MonthlyPoint
  return (
    <div className="rounded-lg border border-white/10 bg-mugen-black/95 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white/90">{label}</p>
      <p className="text-mugen-gold">Spend: ₹{p.spendRupee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
      <p className="text-white/60">Orders: {p.orders}</p>
    </div>
  )
}

export default function UserProfileCharts({ monthly, paymentStatus, fulfillmentStatus }: Props) {
  const hasMonthly = monthly.some((m) => m.orders > 0 || m.spendRupee > 0)
  const hasPayment = paymentStatus.some((s) => s.value > 0)
  const hasFulfillment = fulfillmentStatus.some((s) => s.value > 0)

  if (!hasMonthly && !hasPayment && !hasFulfillment) {
    return (
      <div className="rounded-2xl border border-white/10 bg-mugen-dark/20 px-6 py-10 text-center text-sm text-white/45">
        Not enough order data for charts yet.
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {hasMonthly && (
        <div className="rounded-2xl border border-white/10 bg-mugen-dark/30 p-5">
          <h3 className="font-cinzel text-lg font-bold text-white">Orders & spend by month</h3>
          <p className="mt-1 text-xs text-white/40">Paid orders only · last 12 months</p>
          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`)}
                />
                <Tooltip content={<MonthTooltip />} />
                <Bar dataKey="spendRupee" name="Spend" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {hasPayment && (
          <div className="rounded-2xl border border-white/10 bg-mugen-dark/30 p-5">
            <h3 className="font-cinzel text-lg font-bold text-white">Payment status</h3>
            <p className="mt-1 text-xs text-white/40">All orders in range</p>
            <div className="mt-2 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {paymentStatus.map((_, i) => (
                      <Cell key={i} fill={MUTED[i % MUTED.length]} stroke="rgba(0,0,0,0.2)" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {hasFulfillment && (
          <div className="rounded-2xl border border-white/10 bg-mugen-dark/30 p-5">
            <h3 className="font-cinzel text-lg font-bold text-white">Fulfillment status</h3>
            <p className="mt-1 text-xs text-white/40">Order pipeline</p>
            <div className="mt-2 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fulfillmentStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {fulfillmentStatus.map((_, i) => (
                      <Cell key={i} fill={MUTED[(i + 2) % MUTED.length]} stroke="rgba(0,0,0,0.2)" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
