import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const [{ count: productCount }, { count: orderCount }, { count: pendingCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_payment', 'processing']),
  ])

  return NextResponse.json({
    productCount: productCount ?? 0,
    orderCount: orderCount ?? 0,
    pendingCount: pendingCount ?? 0,
  })
}
