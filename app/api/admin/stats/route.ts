import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminDashboardKpis } from '@/lib/admin/dashboard-stats'

export async function GET() {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const kpi = await getAdminDashboardKpis(supabase)

  return NextResponse.json({
    productCount: kpi.productCount,
    orderCount: kpi.orderCount,
    pendingCount: kpi.pendingCount,
  })
}
