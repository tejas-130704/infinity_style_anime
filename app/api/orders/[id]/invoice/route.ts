import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/session-guard'
import { fetchOrderForViewer } from '@/lib/order/get-order-for-viewer'
import { buildOrderInvoiceHtml, orderRowToInvoicePayload } from '@/lib/invoice/order-invoice-template'

function assetBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (u) return u.replace(/\/$/, '')
  const v = process.env.VERCEL_URL
  if (v) return (v.startsWith('http') ? v : `https://${v}`).replace(/\/$/, '')
  return ''
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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

  const payload = orderRowToInvoicePayload(result.order as Record<string, unknown>)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid order' }, { status: 500 })
  }

  const html = buildOrderInvoiceHtml(payload, { assetBaseUrl: assetBaseUrl() })
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="invoice-${id.slice(0, 8)}.html"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
