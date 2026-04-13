import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    // ─── 1. Revenue & order counts ───────────────────────────────────────────
    const { data: revenueData, error: revenueErr } = await supabase
      .from('orders')
      .select('total_price, payment_status, created_at, status')

    if (revenueErr) throw revenueErr

    const paidOrders = revenueData?.filter((o) => o.payment_status === 'completed') ?? []
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_price ?? 0), 0)
    const totalOrders = revenueData?.length ?? 0

    // ─── 2. User counts ──────────────────────────────────────────────────────
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Active users = users who placed an order in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const activeUsers = new Set(recentOrders?.map((o) => o.user_id) ?? []).size

    // ─── 3. Daily sales — last 30 days ───────────────────────────────────────
    const dailySalesMap: Record<string, { revenue: number; orders: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dailySalesMap[key] = { revenue: 0, orders: 0 }
    }

    paidOrders.forEach((o) => {
      const key = new Date(o.created_at).toISOString().slice(0, 10)
      if (dailySalesMap[key]) {
        dailySalesMap[key].revenue += o.total_price ?? 0
        dailySalesMap[key].orders += 1
      }
    })

    const dailySales = Object.entries(dailySalesMap).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue / 100), // convert paisa → rupees
      orders: v.orders,
    }))

    // ─── 4. Monthly sales — last 12 months ───────────────────────────────────
    const monthlySalesMap: Record<string, { revenue: number; orders: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlySalesMap[key] = { revenue: 0, orders: 0 }
    }

    paidOrders.forEach((o) => {
      const d = new Date(o.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlySalesMap[key]) {
        monthlySalesMap[key].revenue += o.total_price ?? 0
        monthlySalesMap[key].orders += 1
      }
    })

    const monthlySales = Object.entries(monthlySalesMap).map(([month, v]) => ({
      month,
      revenue: Math.round(v.revenue / 100),
      orders: v.orders,
    }))

    // ─── 5. Top-selling products ──────────────────────────────────────────────
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, price, products(id, name, image_url, category)')

    const productSalesMap: Record<
      string,
      { name: string; image_url: string | null; category: string; totalQty: number; totalRevenue: number }
    > = {}

    orderItems?.forEach((item: any) => {
      const p = item.products
      if (!p) return
      if (!productSalesMap[p.id]) {
        productSalesMap[p.id] = {
          name: p.name,
          image_url: p.image_url,
          category: p.category,
          totalQty: 0,
          totalRevenue: 0,
        }
      }
      productSalesMap[p.id].totalQty += item.quantity ?? 0
      productSalesMap[p.id].totalRevenue += (item.price ?? 0) * (item.quantity ?? 0)
    })

    const topSellingProducts = Object.entries(productSalesMap)
      .map(([id, v]) => ({ id, ...v, totalRevenue: Math.round(v.totalRevenue / 100) }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 6)

    // ─── 6. Low-performing products (0 orders) ────────────────────────────────
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, category, image_url, price')
      .order('created_at', { ascending: false })

    const soldProductIds = new Set(Object.keys(productSalesMap))
    const lowPerformingProducts = (allProducts ?? [])
      .filter((p) => !soldProductIds.has(p.id))
      .slice(0, 6)
      .map((p) => ({ ...p, price: Math.round(p.price / 100) }))

    // ─── 7. Most liked products (by rating_count) ─────────────────────────────
    const { data: mostLiked } = await supabase
      .from('products')
      .select('id, name, category, image_url, price, rating, rating_count')
      .order('rating_count', { ascending: false, nullsFirst: false })
      .limit(6)

    const mostLikedProducts = (mostLiked ?? []).map((p) => ({
      ...p,
      price: Math.round(p.price / 100),
    }))

    // ─── 8. Category breakdown (for pie chart) ────────────────────────────────
    const categoryMap: Record<string, number> = {}
    orderItems?.forEach((item: any) => {
      const cat = item.products?.category
      if (!cat) return
      categoryMap[cat] = (categoryMap[cat] ?? 0) + (item.quantity ?? 0)
    })

    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }))

    // ─── 9. Order status breakdown ────────────────────────────────────────────
    const statusMap: Record<string, number> = {}
    revenueData?.forEach((o) => {
      const s = o.status ?? 'unknown'
      statusMap[s] = (statusMap[s] ?? 0) + 1
    })
    const orderStatusBreakdown = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }))

    // ─── 10. User signup trends — last 30 days ───────────────────────────────
    const thirtyDaysAgoISO = new Date(thirtyDaysAgo).toISOString()
    const { data: signupData } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoISO)

    const signupMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      signupMap[d.toISOString().slice(0, 10)] = 0
    }
    ;(signupData ?? []).forEach((u) => {
      const key = new Date(u.created_at).toISOString().slice(0, 10)
      if (signupMap[key] !== undefined) signupMap[key]++
    })
    const signupTrend = Object.entries(signupMap).map(([date, count]) => ({ date, count }))

    // ─── 11. Login provider breakdown ─────────────────────────────────────────
    const { data: providerData } = await supabase
      .from('profiles')
      .select('auth_provider')

    const providerMap: Record<string, number> = {}
    ;(providerData ?? []).forEach((u: any) => {
      const prov = u.auth_provider ?? 'email'
      providerMap[prov] = (providerMap[prov] ?? 0) + 1
    })
    const providerBreakdown = Object.entries(providerMap).map(([provider, count]) => ({
      provider,
      count,
    }))

    return NextResponse.json({
      overview: {
        totalRevenue: Math.round(totalRevenue / 100),
        totalOrders,
        totalUsers: totalUsers ?? 0,
        activeUsers,
      },
      dailySales,
      monthlySales,
      topSellingProducts,
      mostLikedProducts,
      lowPerformingProducts,
      categoryBreakdown,
      orderStatusBreakdown,
      signupTrend,
      providerBreakdown,
    })
  } catch (err: any) {
    console.error('[analytics] error:', err)
    return NextResponse.json({ error: err.message ?? 'Analytics failed' }, { status: 500 })
  }
}
