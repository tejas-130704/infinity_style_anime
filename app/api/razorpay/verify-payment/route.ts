import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordCouponUsageForCompletedOrder } from '@/lib/coupon/record-usage'
import { ORDER_SELECT } from '@/lib/order/get-order-for-viewer'
import { sendOrderInvoiceEmail } from '@/lib/email/send-order-invoice-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_db_id } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Invalid signature' }, { status: 400 })
    }

    if (order_db_id) {
      const admin = createAdminClient()

      let wasAlreadyCompleted = false
      let invoiceAlreadySent = false
      const priorRes = await admin
        .from('orders')
        .select('payment_status, invoice_email_sent_at')
        .eq('id', order_db_id)
        .maybeSingle()
      if (priorRes.error) {
        const { data: p2 } = await admin.from('orders').select('payment_status').eq('id', order_db_id).maybeSingle()
        wasAlreadyCompleted = p2?.payment_status === 'completed'
      } else {
        wasAlreadyCompleted = priorRes.data?.payment_status === 'completed'
        invoiceAlreadySent = !!priorRes.data?.invoice_email_sent_at
      }

      const { error } = await admin
        .from('orders')
        .update({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          payment_status: 'completed',
          status: 'processing',
          fulfillment_status: 'ordered',
        })
        .eq('id', order_db_id)

      if (error) {
        console.error('Database update error:', error)
        return NextResponse.json(
          { verified: true, warning: 'Payment verified but database update failed' },
          { status: 200 }
        )
      }

      try {
        await recordCouponUsageForCompletedOrder(order_db_id)
      } catch (e) {
        console.error('Coupon usage recording:', e)
      }

      if (!wasAlreadyCompleted && !invoiceAlreadySent) {
        const { data: fullOrder } = await admin
          .from('orders')
          .select(ORDER_SELECT)
          .eq('id', order_db_id)
          .maybeSingle()

        if (fullOrder) {
          const row = fullOrder as Record<string, unknown>
          const rawAddr = row.addresses as { email?: string } | { email?: string }[] | null | undefined
          const addr = Array.isArray(rawAddr) ? rawAddr[0] : rawAddr
          const to = addr?.email?.trim()
          if (to) {
            const result = await sendOrderInvoiceEmail(to, row)
            if (result.sent) {
              const { error: invErr } = await admin
                .from('orders')
                .update({ invoice_email_sent_at: new Date().toISOString() })
                .eq('id', order_db_id)
              if (invErr) console.error('[invoice_email_sent_at]', invErr.message)
            } else if (!result.skipped) {
              console.error('[invoice email]', result.error)
            }
          }
        }
      }
    }

    return NextResponse.json({
      verified: true,
      order_id: order_db_id,
      payment_id: razorpay_payment_id,
      message: 'Payment verified successfully',
    })
  } catch (error: unknown) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      {
        verified: false,
        error: 'Verification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
