'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Star,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalOrders: number
    totalUsers: number
    activeUsers: number
  }
  dailySales: { date: string; revenue: number; orders: number }[]
  monthlySales: { month: string; revenue: number; orders: number }[]
  topSellingProducts: {
    id: string
    name: string
    image_url: string | null
    category: string
    totalQty: number
    totalRevenue: number
  }[]
  mostLikedProducts: {
    id: string
    name: string
    image_url: string | null
    category: string
    price: number
    rating: number | null
    rating_count: number | null
  }[]
  lowPerformingProducts: {
    id: string
    name: string
    image_url: string | null
    category: string
    price: number
  }[]
  categoryBreakdown: { category: string; count: number }[]
  orderStatusBreakdown: { status: string; count: number }[]
  signupTrend: { date: string; count: number }[]
  providerBreakdown: { provider: string; count: number }[]
}

const CHART_COLORS = ['#C0151A', '#D4AF37', '#6B7280', '#10B981', '#3B82F6', '#F59E0B']
const CATEGORY_LABELS: Record<string, string> = {
  posters: 'Posters',
  action_figures: 'Action Figures',
  limited_edition: 'Limited Edition',
  custom_action_figure: 'Custom 3D',
  personalized_posters: 'Custom Poster',
  '3d_models': '3D Models',
}
const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#6B7280',
  processing: '#F59E0B',
  shipped: '#3B82F6',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

function KPICard({
  label,
  value,
  icon: Icon,
  sub,
  color,
}: {
  label: string
  value: string | number
  icon: any
  sub?: string
  color: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</p>
          <p className="mt-2 font-cinzel text-3xl font-bold text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
        </div>
        <div className={`rounded-lg p-3 ${color} bg-opacity-20`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h3 className="mb-4 font-cinzel text-lg font-bold text-white">{title}</h3>
      {children}
    </div>
  )
}

function ProductTable({
  title,
  products,
  icon: Icon,
  iconClass,
  columns,
}: {
  title: string
  icon: any
  iconClass: string
  products: any[]
  columns: { key: string; label: string; render?: (v: any, row: any) => React.ReactNode }[]
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h3 className="font-cinzel text-lg font-bold text-white">{title}</h3>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-white/40">No data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-white/40">
                <th className="pb-2 pr-4">Product</th>
                {columns.map((c) => (
                  <th key={c.key} className="pb-2 pr-4">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p, i) => (
                <tr key={p.id || i} className="text-white/80 hover:text-white">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {p.image_url ? (
                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-white/10">
                          <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 flex-shrink-0 rounded-md bg-white/10" />
                      )}
                      <span className="max-w-[160px] truncate text-xs font-medium">{p.name}</span>
                    </div>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="py-2 pr-4 text-xs">
                      {c.render ? c.render(p[c.key], p) : p[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/20 bg-[#0d0d0d]/95 p-3 text-xs text-white shadow-xl">
      <p className="mb-1 font-semibold text-white/70">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'revenue' ? `₹${entry.value.toLocaleString('en-IN')}` : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeChart, setActiveChart] = useState<'daily' | 'monthly'>('monthly')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load analytics')
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-mugen-crimson" />
          <p className="mt-3 text-white/60">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 text-red-300">{error || 'Failed to load analytics'}</p>
        <button
          onClick={load}
          className="mt-4 mx-auto flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/30"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    )
  }

  const {
    overview,
    dailySales,
    monthlySales,
    topSellingProducts,
    mostLikedProducts,
    lowPerformingProducts,
    categoryBreakdown,
    orderStatusBreakdown,
    signupTrend = [],
    providerBreakdown = [],
  } = data

  const chartData = activeChart === 'daily' ? dailySales : monthlySales
  const chartKey = activeChart === 'daily' ? 'date' : 'month'

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-white/50">Real-time store performance</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Total Revenue"
          value={`₹${overview.totalRevenue.toLocaleString('en-IN')}`}
          icon={DollarSign}
          sub="From paid orders"
          color="bg-mugen-crimson"
        />
        <KPICard
          label="Total Orders"
          value={overview.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          sub="All time"
          color="bg-blue-600"
        />
        <KPICard
          label="Total Users"
          value={overview.totalUsers.toLocaleString()}
          icon={Users}
          sub="Registered accounts"
          color="bg-emerald-600"
        />
        <KPICard
          label="Active Users"
          value={overview.activeUsers.toLocaleString()}
          icon={TrendingUp}
          sub="Ordered in last 30 days"
          color="bg-mugen-gold"
        />
      </div>

      <ChartCard title="Sales Overview">
        <div className="mb-4 flex gap-2">
          {(['monthly', 'daily'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setActiveChart(k)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeChart === k ? 'bg-mugen-crimson text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {k === 'monthly' ? 'Monthly (12m)' : 'Daily (30d)'}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey={chartKey}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickFormatter={(v) =>
                activeChart === 'daily'
                  ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  : v.slice(5) + ' ' + v.slice(0, 4)
              }
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }} />
            <Line type="monotone" dataKey="revenue" stroke="#C0151A" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="orders" stroke="#D4AF37" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Monthly Revenue (₹)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySales} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#C0151A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Sales by Category">
          {categoryBreakdown.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-white/30">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) =>
                    `${CATEGORY_LABELS[category] || category} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, CATEGORY_LABELS[String(name)] || name]}
                  contentStyle={{
                    background: '#0d0d0d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Order Status Distribution">
        <div className="flex flex-wrap gap-3">
          {orderStatusBreakdown.map((s) => (
            <div key={s.status} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] ?? '#6B7280' }} />
              <span className="text-xs font-medium text-white/70 capitalize">{s.status.replace(/_/g, ' ')}</span>
              <span className="text-xs font-bold text-white">{s.count}</span>
            </div>
          ))}
          {orderStatusBreakdown.length === 0 && <p className="text-sm text-white/30">No orders yet</p>}
        </div>
      </ChartCard>

      {/* ── User Signup Trends ── */}
      <ChartCard title="User Signups — Last 30 Days">
        {signupTrend.every((d) => d.count === 0) ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-white/30">No signups in last 30 days</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={signupTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                }
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                itemStyle={{ color: '#10B981' }}
                formatter={(v: any) => [v, 'New signups']}
                labelFormatter={(l) => new Date(l).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
              />
              <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fill="url(#signupGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Login Provider Breakdown ── */}
      {providerBreakdown.length > 0 && (
        <ChartCard title="Auth Provider Breakdown">
          <div className="flex flex-wrap items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={providerBreakdown}
                  dataKey="count"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {providerBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3">
              {providerBreakdown.map((p, i) => (
                <div key={p.provider} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-sm font-semibold capitalize text-white/80">{p.provider}</span>
                  <span className="font-cinzel text-lg font-bold text-white">{p.count}</span>
                  <span className="text-xs text-white/40">
                    ({Math.round((p.count / providerBreakdown.reduce((s, x) => s + x.count, 0)) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ProductTable
          title="Top-Selling Products"
          icon={TrendingUp}
          iconClass="text-mugen-crimson"
          products={topSellingProducts}
          columns={[
            { key: 'totalQty', label: 'Units', render: (v) => <span className="font-bold text-mugen-gold">{v}</span> },
            { key: 'totalRevenue', label: 'Revenue', render: (v) => `₹${v.toLocaleString('en-IN')}` },
          ]}
        />
        <ProductTable
          title="Most Liked Products"
          icon={Star}
          iconClass="text-mugen-gold"
          products={mostLikedProducts}
          columns={[
            { key: 'rating', label: 'Rating', render: (v) => (v ? `⭐ ${Number(v).toFixed(1)}` : '—') },
            { key: 'rating_count', label: 'Likes', render: (v) => <span className="font-bold text-white">{v ?? 0}</span> },
          ]}
        />
      </div>

      <ProductTable
        title="Low-Performing Products (0 Sales)"
        icon={AlertTriangle}
        iconClass="text-amber-400"
        products={lowPerformingProducts}
        columns={[
          { key: 'category', label: 'Category', render: (v) => <span className="capitalize">{CATEGORY_LABELS[v] || v}</span> },
          { key: 'price', label: 'Price', render: (v) => `₹${v.toLocaleString('en-IN')}` },
        ]}
      />
    </div>
  )
}

