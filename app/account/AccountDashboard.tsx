'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  User, Package, ShoppingCart, Settings, LogOut,
  ChevronRight, Star, TrendingUp, Clock, CheckCircle2,
  Truck, XCircle, AlertCircle, ShoppingBag, Heart,
  ArrowUpRight, Infinity as InfinityIcon, BarChart2,
  CreditCard, MapPin, Bell
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { productDetailPath } from '@/lib/product-path'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserInfo {
  id: string
  email: string
  name: string | null
  avatar: string | null
  createdAt: string
  isAdmin: boolean
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: { id: string; name: string; image_url: string | null; slug: string | null } | null
}

interface Order {
  id: string
  total_price: number
  status: string
  payment_status: string
  created_at: string
  order_items: OrderItem[] | null
}

interface CartProduct {
  id: string
  name: string
  image_url: string | null
  price: number
  slug: string | null
}

interface CartItem {
  id: string
  quantity: number
  products: CartProduct | null
}

interface Props {
  user: UserInfo
  orders: Order[]
  cartItems: CartItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: AlertCircle },
  processing:      { label: 'Processing',       color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: Clock },
  shipped:         { label: 'Shipped',           color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Truck },
  delivered:       { label: 'Delivered',         color: 'text-emerald-400',bg: 'bg-emerald-400/10',icon: CheckCircle2 },
  cancelled:       { label: 'Cancelled',         color: 'text-red-400',   bg: 'bg-red-400/10',    icon: XCircle },
}

const TABS = [
  { id: 'overview',  label: 'Overview',    icon: BarChart2 },
  { id: 'orders',    label: 'Orders',      icon: Package },
  { id: 'payments',  label: 'Payments',    icon: CreditCard },
  { id: 'cart',      label: 'Cart',        icon: ShoppingCart },
  { id: 'settings',  label: 'Settings',    icon: Settings },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export function AccountDashboard({ user, orders, cartItems }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isPending, startTransition] = useTransition()

  const totalSpent = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((s, o) => s + o.total_price, 0)

  const deliveredCount = orders.filter(o => o.status === 'delivered').length
  const activeCount    = orders.filter(o => ['processing', 'shipped'].includes(o.status)).length
  const cartTotal      = cartItems.reduce((s, i) => s + (i.products?.price ?? 0) * i.quantity, 0)

  // Monthly spend for mini bar chart (last 6 months)
  const monthlySpend = (() => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months[`${d.getFullYear()}-${d.getMonth()}`] = 0
    }
    orders.filter(o => o.payment_status === 'paid').forEach(o => {
      const d = new Date(o.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (key in months) months[key] += o.total_price
    })
    return Object.entries(months).map(([key, val]) => {
      const [y, m] = key.split('-').map(Number)
      const label = new Date(y, m, 1).toLocaleString('default', { month: 'short' })
      return { label, value: val }
    })
  })()

  const maxSpend = Math.max(...monthlySpend.map(m => m.value), 1)

  const handleSignOut = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.removeItem('spinReward')
      localStorage.removeItem('spinUsed')
      toast.success('Signed out successfully')
      router.push('/')
      router.refresh()
    })
  }

  const displayName = user.name || user.email.split('@')[0]
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen bg-mugen-atmosphere pt-24 pb-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-white/10 ring-offset-2 ring-offset-transparent">
                {user.avatar ? (
                  <Image src={user.avatar} alt={displayName} width={64} height={64} className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mugen-crimson to-mugen-magenta text-xl font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>
              {user.isAdmin && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-mugen-gold px-1.5 text-[10px] font-bold text-black">ADMIN</span>
              )}
            </div>
            <div>
              <h1 className="font-cinzel text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-sm text-white/50">{user.email}</p>
              <p className="text-xs text-white/30 mt-0.5">Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-mugen-gold/40 hover:bg-mugen-gold/10 hover:text-mugen-gold"
            >
              <ShoppingBag size={16} /> Continue Shopping
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Spent',    value: formatPrice(totalSpent),        icon: CreditCard,   color: 'from-mugen-gold/20 to-mugen-gold/5',     border: 'border-mugen-gold/20',   text: 'text-mugen-gold' },
            { label: 'Total Orders',   value: orders.length,                  icon: Package,      color: 'from-mugen-crimson/20 to-mugen-crimson/5',border: 'border-mugen-crimson/20',text: 'text-mugen-crimson' },
            { label: 'Active Orders',  value: activeCount,                    icon: Truck,        color: 'from-purple-500/20 to-purple-500/5',      border: 'border-purple-500/20',   text: 'text-purple-400' },
            { label: 'Cart Items',     value: cartItems.reduce((s,i)=>s+i.quantity,0), icon: ShoppingCart, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20',     text: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className={`glass rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.color} p-4 transition hover:scale-[1.02]`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-white/50">{stat.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${stat.text}`}>{stat.value}</p>
                </div>
                <stat.icon size={20} className={`${stat.text} opacity-70`} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-1.5 backdrop-blur">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-mugen-crimson to-mugen-magenta text-white shadow-lg shadow-mugen-crimson/25'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.id === 'cart' && cartItems.length > 0 && (
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 text-xs">{cartItems.length}</span>
              )}
              {tab.id === 'orders' && activeCount > 0 && (
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 text-xs">{activeCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Spending Chart */}
            <div className="glass rounded-2xl border border-white/10 p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-cinzel text-base font-bold text-white">Spending (Last 6 Months)</h2>
                <TrendingUp size={18} className="text-mugen-gold" />
              </div>
              <div className="flex h-40 items-end gap-2">
                {monthlySpend.map((m) => {
                  const pct = maxSpend > 0 ? (m.value / maxSpend) * 100 : 0
                  return (
                    <div key={m.label} className="group relative flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-mugen-crimson to-mugen-magenta transition-all duration-500 group-hover:opacity-80"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                      {m.value > 0 && (
                        <span className="absolute -top-6 hidden rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white group-hover:block whitespace-nowrap">
                          {formatPrice(m.value)}
                        </span>
                      )}
                      <span className="text-[10px] text-white/40">{m.label}</span>
                    </div>
                  )
                })}
              </div>
              {monthlySpend.every(m => m.value === 0) && (
                <p className="mt-4 text-center text-sm text-white/30">No purchases recorded yet</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-2xl border border-white/10 p-6">
              <h2 className="mb-4 font-cinzel text-base font-bold text-white">Activity</h2>
              <div className="space-y-3">
                {[
                  { label: 'Delivered',  value: deliveredCount,                   icon: CheckCircle2, color: 'text-emerald-400' },
                  { label: 'Processing', value: orders.filter(o=>o.status==='processing').length, icon: Clock, color: 'text-blue-400' },
                  { label: 'Shipped',    value: orders.filter(o=>o.status==='shipped').length,    icon: Truck, color: 'text-purple-400' },
                  { label: 'Cancelled',  value: orders.filter(o=>o.status==='cancelled').length,  icon: XCircle, color: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <s.icon size={15} className={s.color} />
                      <span className="text-sm text-white/70">{s.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>

              {cartItems.length > 0 && (
                <div className="mt-4 rounded-xl border border-mugen-gold/20 bg-mugen-gold/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/50">Cart value</p>
                      <p className="font-bold text-mugen-gold">{formatPrice(cartTotal)}</p>
                    </div>
                    <Link href="/cart" className="flex items-center gap-1 rounded-lg bg-mugen-gold/20 px-3 py-1.5 text-xs font-semibold text-mugen-gold hover:bg-mugen-gold/30">
                      View Cart <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="glass rounded-2xl border border-white/10 p-6 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-cinzel text-base font-bold text-white">Recent Orders</h2>
                <button onClick={() => setActiveTab('orders')} className="flex items-center gap-1 text-xs font-semibold text-mugen-gold hover:text-white">
                  See all <ChevronRight size={14} />
                </button>
              </div>

              {orders.length === 0 ? (
                <EmptyState icon={Package} title="No orders yet" desc="Start shopping to see your orders here." cta="Browse Shop" href="/shop" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-white/40">
                        <th className="pb-3 font-medium">Order ID</th>
                        <th className="pb-3 font-medium">Items</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.slice(0, 5).map(order => {
                        const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['processing']
                        const StatusIcon = cfg.icon
                        return (
                          <tr key={order.id} className="group transition hover:bg-white/5">
                            <td className="py-3 pr-4 font-mono text-xs text-white/60">#{order.id.slice(0, 8).toUpperCase()}</td>
                            <td className="py-3 pr-4">
                              <div className="flex -space-x-2">
                                {(order.order_items ?? []).slice(0, 3).map(item => (
                                  <div key={item.id} className="h-8 w-8 overflow-hidden rounded-lg border border-white/10 bg-mugen-dark">
                                    {item.products?.image_url ? (
                                      <Image src={item.products.image_url} alt={item.products.name} width={32} height={32} className="object-cover" unoptimized />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center"><ShoppingBag size={12} className="text-white/30" /></div>
                                    )}
                                  </div>
                                ))}
                                {(order.order_items?.length ?? 0) > 3 && (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-mugen-dark text-[10px] text-white/50">
                                    +{(order.order_items?.length ?? 0) - 3}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4 font-semibold text-white">{formatPrice(order.total_price)}</td>
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                                <StatusIcon size={11} />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="py-3 text-xs text-white/40">{timeAgo(order.created_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ORDERS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
              <Link href="/orders" className="flex items-center gap-1 text-xs font-semibold text-mugen-gold hover:text-white">
                Full Tracking Page <ChevronRight size={14} />
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="glass rounded-2xl border border-white/10 p-12">
                <EmptyState icon={Package} title="No orders yet" desc="Looks like you haven't made any orders. Let's change that!" cta="Shop Now" href="/shop" />
              </div>
            ) : (
              orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['processing']
                const StatusIcon = cfg.icon
                return (
                  <div key={order.id} className="glass overflow-hidden rounded-2xl border border-white/10 transition hover:border-white/20">
                    {/* Order header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-white/40">Order ID</p>
                          <p className="font-mono text-sm font-semibold text-white">#{order.id.slice(0, 12).toUpperCase()}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div>
                          <p className="text-xs text-white/40">Placed</p>
                          <p className="text-sm text-white/80">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-3 py-1.5 text-xs font-semibold ${cfg.color}`}>
                          <StatusIcon size={12} /> {cfg.label}
                        </span>
                        <span className="text-lg font-bold text-mugen-gold">{formatPrice(order.total_price)}</span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:border-mugen-gold/40 hover:text-mugen-gold transition-all"
                        >
                          Track
                        </Link>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="divide-y divide-white/5">
                      {(order.order_items ?? []).map(item => {
                        const p = item.products
                        return (
                          <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mugen-dark">
                              {p?.image_url ? (
                                <Image src={p.image_url} alt={p.name} width={56} height={56} className="h-full w-full object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center"><ShoppingBag size={18} className="text-white/20" /></div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{p?.name ?? 'Product'}</p>
                              <p className="text-sm text-white/50">Qty: {item.quantity} · {formatPrice(item.price)} each</p>
                            </div>
                            {p?.id && (
                              <Link
                                href={productDetailPath({ id: p.id, slug: p.slug ?? null })}
                                className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-mugen-gold/40 hover:text-mugen-gold"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PAYMENT HISTORY TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-lg font-bold text-white">Payment History</h2>
              <p className="text-xs text-white/40">{orders.length} transaction{orders.length !== 1 ? 's' : ''}</p>
            </div>

            {orders.length === 0 ? (
              <div className="glass rounded-2xl border border-white/10 p-12">
                <EmptyState icon={CreditCard} title="No payments yet" desc="Your payment history will appear here after your first order." cta="Shop Now" href="/shop" />
              </div>
            ) : (
              <div className="glass overflow-hidden rounded-2xl border border-white/10">
                <div className="divide-y divide-white/5">
                  {orders.map(order => {
                    const isPaid = order.payment_status === 'completed' || order.payment_status === 'paid'
                    return (
                      <div key={order.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/5">
                        {/* Icon */}
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          isPaid ? 'bg-emerald-500/10' : 'bg-red-500/10'
                        }`}>
                          <CreditCard size={18} className={isPaid ? 'text-emerald-400' : 'text-red-400'} />
                        </div>

                        {/* Order info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {(order.order_items ?? []).length} item order
                          </p>
                          <p className="font-mono text-[10px] text-white/30">#{order.id}</p>
                        </div>

                        {/* Date */}
                        <div className="text-right shrink-0">
                          <p className="text-xs text-white/50">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-white/30">{timeAgo(order.created_at)}</p>
                        </div>

                        {/* Amount + Status */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-mugen-gold">{formatPrice(order.total_price)}</p>
                          <span className={`text-[10px] font-semibold ${
                            isPaid ? 'text-emerald-400' : 'text-yellow-400'
                          }`}>
                            {isPaid ? '✓ Paid' : order.payment_status}
                          </span>
                        </div>

                        {/* Track link */}
                        <Link
                          href={`/orders/${order.id}`}
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:border-mugen-gold/40 hover:text-mugen-gold transition-all"
                        >
                          Details
                        </Link>
                      </div>
                    )
                  })}
                </div>

                {/* Summary footer */}
                <div className="border-t border-white/10 bg-white/5 px-5 py-3 flex items-center justify-between">
                  <p className="text-xs text-white/40">Total spent (paid orders)</p>
                  <p className="font-bold text-mugen-gold">{formatPrice(totalSpent)}</p>
                </div>
              </div>
            )}
          </div>
        )}


        {activeTab === 'cart' && (
          <div className="glass rounded-2xl border border-white/10">
            {cartItems.length === 0 ? (
              <div className="p-12">
                <EmptyState icon={ShoppingCart} title="Your cart is empty" desc="Add some awesome anime merch to get started." cta="Shop Now" href="/shop" />
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/5">
                  {cartItems.map(item => {
                    const p = item.products
                    if (!p) return null
                    return (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mugen-dark">
                          {p.image_url ? (
                            <Image src={p.image_url} alt={p.name} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center"><ShoppingBag size={20} className="text-white/20" /></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{p.name}</p>
                          <p className="text-sm text-white/50">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-mugen-gold">{formatPrice(p.price * item.quantity)}</p>
                          <p className="text-xs text-white/40">{formatPrice(p.price)} each</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Cart footer */}
                <div className="border-t border-white/10 bg-white/5 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">Cart Total ({cartItems.reduce((s,i)=>s+i.quantity,0)} items)</p>
                      <p className="text-2xl font-bold text-mugen-gold">{formatPrice(cartTotal)}</p>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/cart" className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                        Edit Cart
                      </Link>
                      <Link href="/checkout" className="rounded-xl bg-gradient-to-r from-mugen-crimson to-mugen-magenta px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-mugen-crimson/30 transition hover:opacity-90">
                        Checkout →
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SETTINGS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile Info */}
            <div className="glass rounded-2xl border border-white/10 p-6">
              <h2 className="mb-4 font-cinzel text-base font-bold text-white flex items-center gap-2"><User size={16} className="text-mugen-gold" /> Profile</h2>
              <div className="space-y-4">
                <InfoRow label="Display Name" value={user.name || '—'} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Member Since" value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoRow label="Account Type" value={user.isAdmin ? 'Administrator' : 'Customer'} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl border border-white/10 p-6">
              <h2 className="mb-4 font-cinzel text-base font-bold text-white flex items-center gap-2"><Bell size={16} className="text-mugen-gold" /> Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'View Order History', icon: Package, href: null, action: () => setActiveTab('orders') },
                  { label: 'Go to Cart', icon: ShoppingCart, href: '/cart', action: null },
                  { label: 'Browse Shop', icon: ShoppingBag, href: '/shop', action: null },
                  ...(user.isAdmin ? [{ label: 'Admin Panel', icon: InfinityIcon, href: '/admin', action: null }] : []),
                ].map(item => item.href ? (
                  <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/15 hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-white/60" />
                      <span className="text-sm font-medium text-white/80">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-white/30" />
                  </Link>
                ) : (
                  <button key={item.label} onClick={item.action!} className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/15 hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-white/60" />
                      <span className="text-sm font-medium text-white/80">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-white/30" />
                  </button>
                ))}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 transition hover:bg-red-500/15"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={16} className="text-red-400" />
                    <span className="text-sm font-medium text-red-400">Sign Out</span>
                  </div>
                  <ChevronRight size={14} className="text-red-400/30" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, desc, cta, href }: {
  icon: React.ElementType; title: string; desc: string; cta: string; href: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
        <Icon size={28} className="text-white/30" />
      </div>
      <div>
        <p className="font-semibold text-white/70">{title}</p>
        <p className="mt-1 text-sm text-white/40">{desc}</p>
      </div>
      <Link href={href} className="rounded-xl bg-gradient-to-r from-mugen-crimson to-mugen-magenta px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-mugen-crimson/25 transition hover:opacity-90">
        {cta}
      </Link>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-white/40">{label}</span>
      <span className="text-sm font-medium text-white/80">{value}</span>
    </div>
  )
}
