import { createAdminClient } from '@/lib/supabase/admin'
import { ORDER_SELECT } from '@/lib/order/get-order-for-viewer'
import {
  buildOrderInvoiceHtml,
  buildAdminInvoiceHtml,
  orderRowToInvoicePayload,
  type OrderInvoicePayload,
} from '@/lib/invoice/order-invoice-template'
import { InvoicePreviewClient } from './PreviewClient'

/** Synthetic demo order shown when no real completed order exists. */
function demoPayload(): OrderInvoicePayload {
  return {
    orderId: 'demo-00000000-0000-0000-0000-000000000001',
    transactionId: 'pay_DemoRazorpayTxn123',
    razorpayOrderId: 'order_DemoRazorpayOrder456',
    paidAtIso: new Date().toISOString(),
    paymentMethodLabel: 'Razorpay (UPI / Card / Netbanking)',
    lines: [
      { name: 'Naruto Uzumaki Action Figure', quantity: 1, lineTotalPaisa: 59900 },
      { name: 'Attack on Titan Poster (A2)', quantity: 2, lineTotalPaisa: 39800 },
    ],
    itemTotalPaisa: 99700,
    deliveryPaisa: 8900,
    discountPaisa: 10000,
    gstPaisa: 0,
    totalPaisa: 98600,
    couponCode: 'FIRST10',
    shipToName: 'Rahul Sharma',
    shipToEmail: 'rahul.sharma@example.com',
    shipToPhone: '+91 98765 43210',
    shipToAddressLines: ['42, MG Road, Koramangala', 'Bengaluru, Karnataka'],
  }
}

async function fetchLatestCompletedOrder(): Promise<Record<string, unknown> | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('orders')
      .select(ORDER_SELECT)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data as Record<string, unknown> | null
  } catch {
    return null
  }
}

export default async function InvoicePreviewPage() {
  const latestOrder = await fetchLatestCompletedOrder()

  let payload: OrderInvoicePayload | null = null
  let isReal = false

  if (latestOrder) {
    payload = orderRowToInvoicePayload(latestOrder, {
      paidAtIso: (latestOrder.created_at as string) ?? new Date().toISOString(),
    })
    if (payload) isReal = true
  }

  if (!payload) {
    payload = demoPayload()
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const customerHtml = buildOrderInvoiceHtml(payload, { assetBaseUrl: base })
  const adminHtml = buildAdminInvoiceHtml(payload, { assetBaseUrl: base })

  return (
    <InvoicePreviewClient
      customerHtml={customerHtml}
      adminHtml={adminHtml}
      orderId={payload.orderId}
      isReal={isReal}
    />
  )
}
