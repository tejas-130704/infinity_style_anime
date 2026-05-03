import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Fetch only active and visible coupons
  const { data, error } = await supabase
    .from('coupons')
    .select('code, description, discount_type, discount_value, min_order_amount')
    .eq('is_active', true)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupons: data ?? [] })
}
