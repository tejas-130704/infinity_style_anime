import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      user_id,
      total_price,
      status,
      payment_status,
      created_at,
      order_items (
        id,
        quantity,
        price,
        products ( id, name, image_url )
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: orders ?? [] })
}
