import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session-guard'
import { createAdminClient } from '@/lib/supabase/admin'

/** Dashboard stats for the signed-in user (NextAuth and/or Supabase session). */
export async function GET() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const uid = sessionUser.id

  const admin = createAdminClient()
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, total_price, status, payment_status, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = orders ?? []
  const paidOrders = list.filter(
    (o) => o.payment_status === 'completed' || o.payment_status === 'paid'
  )
  const totalSpendPaisa = paidOrders.reduce((s, o) => s + (o.total_price ?? 0), 0)

  const now = new Date()
  const months: { key: string; label: string; amountPaisa: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      amountPaisa: 0,
      count: 0,
    })
  }

  for (const o of paidOrders) {
    const d = new Date(o.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const bucket = months.find((m) => m.key === key)
    if (bucket) {
      bucket.amountPaisa += o.total_price ?? 0
      bucket.count += 1
    }
  }

  const recentOrders = list.slice(0, 6).map((o) => ({
    id: o.id,
    total_price: o.total_price,
    status: o.status,
    payment_status: o.payment_status,
    created_at: o.created_at,
  }))

  return NextResponse.json({
    stats: {
      orderCount: list.length,
      paidOrderCount: paidOrders.length,
      totalSpendPaisa,
    },
    monthly: months,
    recentOrders,
  })
}
