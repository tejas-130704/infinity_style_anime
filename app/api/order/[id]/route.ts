import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/session-guard'
import { fetchOrderForViewer } from '@/lib/order/get-order-for-viewer'

/**
 * GET /api/order/:id — order + Flipkart-style tracking (owner or admin).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const sessionUser = await getSessionUser()
  const supabase = await createClient()
  const {
    data: { user: sbUser },
  } = await supabase.auth.getUser()

  const userId = sbUser?.id ?? sessionUser?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let isAdmin = sessionUser?.role === 'admin'
  if (!isAdmin && sbUser?.id) {
    const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', sbUser.id).maybeSingle()
    isAdmin = !!p?.is_admin
  }

  const result = await fetchOrderForViewer(id, userId, { isAdmin })
  if (!result) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (!isAdmin && (result.order as { user_id: string }).user_id !== userId) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}
