'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/pricing-utils'

export type MonthlyPoint = { label: string; amountPaisa: number; count: number }

export function AccountSpendChart({ data }: { data: MonthlyPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    spendRupee: Math.round(d.amountPaisa / 100),
  }))

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,15,18,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.85)' }}
            formatter={(value: number) => [formatCurrency(value * 100), 'Spent']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
          />
          <Bar dataKey="spendRupee" fill="rgba(212, 175, 55, 0.85)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
