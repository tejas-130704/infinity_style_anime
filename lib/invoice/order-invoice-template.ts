import { formatCurrency } from '@/lib/pricing-utils'
import { BRAND_LOGO_PNG_SRC } from '@/lib/constants'

export type OrderInvoiceLine = {
  name: string
  quantity: number
  lineTotalPaisa: number
}

export type OrderInvoicePayload = {
  orderId: string
  transactionId: string
  razorpayOrderId: string | null
  paidAtIso: string
  paymentMethodLabel: string
  lines: OrderInvoiceLine[]
  itemTotalPaisa: number
  deliveryPaisa: number
  discountPaisa: number
  gstPaisa: number
  totalPaisa: number
  couponCode: string | null
  shipToName: string
  shipToEmail: string
  shipToPhone: string
  shipToAddressLines: string[]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatInrPaisa(paisa: number): string {
  return formatCurrency(Math.max(0, Math.round(paisa)))
}

/** Email-safe professional stack — same everywhere (body, tables, cells). */
const FONT_UI =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif"
const FONT_MONO = "ui-monospace,'SF Mono',Consolas,'Liberation Mono',Menlo,monospace"

function font(style: string): string {
  return `font-family:${FONT_UI};${style}`
}

/**
 * Single global invoice template (dark / premium). Inline CSS for email clients.
 */
export function buildOrderInvoiceHtml(payload: OrderInvoicePayload, opts?: { assetBaseUrl?: string }): string {
  const base = (opts?.assetBaseUrl ?? '').replace(/\/$/, '')
  const logoUrl = base ? `${base}${BRAND_LOGO_PNG_SRC}` : ''

  const rows = payload.lines
    .map(
      (l) => `
      <tr>
        <td valign="top" style="${font('padding:12px 16px 12px 0;border-bottom:1px solid rgba(255,255,255,0.07);color:#e8e4dc;font-size:14px;line-height:1.45;word-break:break-word;')}">${escapeHtml(l.name)}</td>
        <td valign="top" width="56" style="${font('padding:12px 8px;border-bottom:1px solid rgba(255,255,255,0.07);color:#b8b3a8;font-size:14px;text-align:center;vertical-align:top;')}">${l.quantity}</td>
        <td valign="top" width="112" style="${font('padding:12px 0 12px 12px;border-bottom:1px solid rgba(255,255,255,0.07);color:#f0ebe3;font-size:14px;text-align:right;vertical-align:top;font-variant-numeric:tabular-nums;white-space:nowrap;')}">${formatInrPaisa(l.lineTotalPaisa)}</td>
      </tr>`
    )
    .join('')

  const addrBlock = payload.shipToAddressLines.map((line) => escapeHtml(line)).join('<br/>')
  const paidAt = new Date(payload.paidAtIso)
  const paidLabel = Number.isNaN(paidAt.getTime())
    ? escapeHtml(payload.paidAtIso)
    : escapeHtml(
        paidAt.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice — ${escapeHtml(payload.orderId.slice(0, 8))}</title>
  <!--[if mso]><style type="text/css">body, table, td, p { font-family: 'Segoe UI', Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#050505;${font('font-size:15px;line-height:1.5;color:#d8d3ca;-webkit-font-smoothing:antialiased;')}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="${font('background:linear-gradient(180deg,#080808 0%,#0d0c0b 40%,#0a0908 100%);padding:32px 16px;')}">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="${font('max-width:640px;width:100%;border-radius:16px;border:1px solid rgba(6,182,212,0.38);background:linear-gradient(165deg,rgba(6,182,212,0.08) 0%,rgba(255,255,255,0.03) 45%,rgba(8,10,14,0.95) 100%);box-shadow:0 0 52px rgba(6,182,212,0.22);overflow:hidden;border-collapse:collapse;')}">
          <tr>
            <td style="padding:28px 28px 22px;border-bottom:1px solid rgba(6,182,212,0.2);">
              <table width="100%" cellspacing="0" cellpadding="0" style="${font('border-collapse:collapse;')}">
                <tr>
                  <td valign="middle" align="left" style="${font('padding:0 16px 0 0;vertical-align:middle;')}">
                    ${
                      logoUrl
                        ? `<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr>
                    <td valign="middle" style="padding:0 14px 0 0;vertical-align:middle;">
                      <img src="${escapeHtml(logoUrl)}" alt="3D Kalakaar" width="56" height="56" style="display:block;width:56px;height:56px;max-width:56px;max-height:56px;object-fit:contain;border-radius:9999px;-webkit-border-radius:9999px;overflow:hidden;border:1px solid rgba(6,182,212,0.35);filter:drop-shadow(0 0 14px rgba(6,182,212,0.45));" />
                    </td>
                    <td valign="middle" style="${font('vertical-align:middle;font-size:19px;font-weight:700;color:#ecfeff;letter-spacing:0.03em;line-height:1.2;')}">3D Kalakaar</td>
                  </tr></table>`
                        : `<span style="${font('font-size:20px;letter-spacing:0.12em;color:#a5f3fc;font-weight:700;')}">3D Kalakaar</span>`
                    }
                  </td>
                  <td valign="middle" align="right" style="${font('vertical-align:middle;text-align:right;')}">
                    <div style="${font('font-size:10px;letter-spacing:0.18em;color:#67e8f9;text-transform:uppercase;font-weight:600;line-height:1.3;')}">Tax Invoice</div>
                    <div style="margin-top:8px;font-size:12px;color:#9ca3af;font-family:${FONT_MONO};line-height:1.35;word-break:break-all;">#${escapeHtml(payload.orderId)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="${font('border-collapse:collapse;table-layout:fixed;')}">
                <tr>
                  <td valign="top" width="50%" style="${font('vertical-align:top;padding:0 20px 0 0;')}">
                    <div style="${font('font-size:10px;letter-spacing:0.14em;color:#9ca3af;text-transform:uppercase;font-weight:600;margin-bottom:10px;')}">Bill to</div>
                    <div style="${font('font-size:15px;color:#f0ebe3;font-weight:600;line-height:1.35;margin-bottom:6px;')}">${escapeHtml(payload.shipToName)}</div>
                    <div style="${font('font-size:13px;color:#b5b0a6;line-height:1.55;')}">${escapeHtml(payload.shipToEmail)}<br/>${escapeHtml(payload.shipToPhone)}</div>
                    <div style="${font('margin-top:10px;font-size:13px;color:#9a958c;line-height:1.55;')}">${addrBlock}</div>
                  </td>
                  <td valign="top" width="50%" style="${font('vertical-align:top;padding:0 0 0 20px;border-left:1px solid rgba(255,255,255,0.06);')}">
                    <div style="${font('font-size:10px;letter-spacing:0.14em;color:#9ca3af;text-transform:uppercase;font-weight:600;margin-bottom:10px;')}">Payment</div>
                    <table width="100%" cellspacing="0" cellpadding="0" style="${font('border-collapse:collapse;font-size:13px;color:#e8e4dc;')}">
                      <tr>
                        <td style="${font('color:#8a8580;padding:5px 12px 5px 0;vertical-align:top;width:42%;')}">Date &amp; time</td>
                        <td align="right" style="${font('padding:5px 0;vertical-align:top;text-align:right;')}">${paidLabel}</td>
                      </tr>
                      <tr>
                        <td style="${font('color:#8a8580;padding:5px 12px 5px 0;vertical-align:top;')}">Method</td>
                        <td align="right" style="${font('padding:5px 0;vertical-align:top;text-align:right;line-height:1.4;')}">${escapeHtml(payload.paymentMethodLabel)}</td>
                      </tr>
                      <tr>
                        <td style="${font('color:#8a8580;padding:5px 12px 5px 0;vertical-align:top;')}">Transaction ID</td>
                        <td align="right" style="padding:5px 0;vertical-align:top;text-align:right;font-size:11px;line-height:1.4;font-family:${FONT_MONO};word-break:break-all;">${escapeHtml(payload.transactionId)}</td>
                      </tr>
                      ${
                        payload.razorpayOrderId
                          ? `<tr>
                        <td style="${font('color:#8a8580;padding:5px 12px 5px 0;vertical-align:top;')}">Gateway order</td>
                        <td align="right" style="padding:5px 0;vertical-align:top;text-align:right;font-size:11px;line-height:1.4;font-family:${FONT_MONO};word-break:break-all;">${escapeHtml(payload.razorpayOrderId)}</td>
                      </tr>`
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="${font('border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);table-layout:fixed;')}">
                <thead>
                  <tr style="background:rgba(6,182,212,0.12);">
                    <th align="left" style="${font('padding:12px 16px 12px 14px;font-size:10px;letter-spacing:0.14em;color:#a5f3fc;text-transform:uppercase;font-weight:600;width:58%;')}">Item</th>
                    <th align="center" width="56" style="${font('padding:12px 8px;font-size:10px;letter-spacing:0.14em;color:#a5f3fc;text-transform:uppercase;font-weight:600;')}">Qty</th>
                    <th align="right" width="120" style="${font('padding:12px 14px 12px 8px;font-size:10px;letter-spacing:0.14em;color:#a5f3fc;text-transform:uppercase;font-weight:600;')}">Amount</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td align="right" style="padding:0 28px 28px;">
              <table width="300" cellspacing="0" cellpadding="0" align="right" style="${font('border-collapse:collapse;font-size:14px;color:#d8d3ca;max-width:100%;')}">
                <tr>
                  <td style="${font('padding:8px 16px 8px 0;color:#9a958c;text-align:left;vertical-align:baseline;')}">Item total</td>
                  <td width="120" align="right" style="${font('padding:8px 0;color:#f0ebe3;text-align:right;vertical-align:baseline;font-variant-numeric:tabular-nums;white-space:nowrap;')}">${formatInrPaisa(payload.itemTotalPaisa)}</td>
                </tr>
                <tr>
                  <td style="${font('padding:8px 16px 8px 0;color:#9a958c;text-align:left;vertical-align:baseline;')}">Delivery</td>
                  <td align="right" style="${font('padding:8px 0;color:#f0ebe3;text-align:right;vertical-align:baseline;font-variant-numeric:tabular-nums;white-space:nowrap;')}">${formatInrPaisa(payload.deliveryPaisa)}</td>
                </tr>
                ${
                  payload.discountPaisa > 0
                    ? `<tr>
                  <td style="${font('padding:8px 16px 8px 0;color:#6ee7b7;text-align:left;vertical-align:baseline;')}">Discount</td>
                  <td align="right" style="${font('padding:8px 0;color:#6ee7b7;text-align:right;vertical-align:baseline;font-variant-numeric:tabular-nums;white-space:nowrap;')}">−${formatInrPaisa(payload.discountPaisa)}</td>
                </tr>`
                    : ''
                }
                ${
                  payload.gstPaisa > 0
                    ? `<tr>
                  <td style="${font('padding:8px 16px 8px 0;color:#9a958c;text-align:left;vertical-align:baseline;')}">GST</td>
                  <td align="right" style="${font('padding:8px 0;color:#f0ebe3;text-align:right;vertical-align:baseline;font-variant-numeric:tabular-nums;white-space:nowrap;')}">${formatInrPaisa(payload.gstPaisa)}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td colspan="2" style="padding:0;border-top:1px solid rgba(6,182,212,0.28);line-height:0;font-size:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="${font('padding:14px 16px 6px 0;font-size:15px;font-weight:700;color:#ecfeff;text-align:left;vertical-align:baseline;')}">Amount paid</td>
                  <td align="right" style="${font('padding:14px 0 6px 0;font-size:18px;font-weight:700;color:#22d3ee;text-align:right;vertical-align:baseline;font-variant-numeric:tabular-nums;white-space:nowrap;')}">${formatInrPaisa(payload.totalPaisa)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.25);">
              <p style="${font('margin:0;font-size:12px;line-height:1.65;color:#8a8580;text-align:center;')}">Thank you for shopping with 3D Kalakaar. For support, reply to this email or visit our website.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function orderRowToInvoicePayload(order: Record<string, unknown>, paymentMeta?: { paidAtIso?: string }): OrderInvoicePayload | null {
  const id = order.id as string | undefined
  if (!id) return null

  const rawAddr = order.addresses as
    | { name?: string; email?: string; phone1?: string; address?: string; city?: string; state?: string }
    | { name?: string; email?: string; phone1?: string; address?: string; city?: string; state?: string }[]
    | null
    | undefined
  const addr = Array.isArray(rawAddr) ? rawAddr[0] : rawAddr

  const items = (order.order_items as Array<Record<string, unknown>> | undefined) ?? []
  const lines: OrderInvoiceLine[] = []
  for (const row of items) {
    const qty = Number(row.quantity) || 0
    const price = Math.round(Number(row.price) || 0)
    const prod = row.products as { name?: string } | null | undefined
    const name = prod?.name?.trim() || 'Product'
    lines.push({ name, quantity: qty, lineTotalPaisa: price * qty })
  }

  const shipToAddressLines: string[] = []
  if (addr?.address) shipToAddressLines.push(addr.address)
  if (addr?.city || addr?.state) {
    const cs = [addr.city, addr.state].filter(Boolean).join(', ')
    if (cs) shipToAddressLines.push(cs)
  }

  const transactionId = (order.razorpay_payment_id as string) || '—'
  const razorpayOrderId = (order.razorpay_order_id as string | null) ?? null
  const paidAtIso = paymentMeta?.paidAtIso ?? (order.created_at as string) ?? new Date().toISOString()

  return {
    orderId: id,
    transactionId,
    razorpayOrderId,
    paidAtIso,
    paymentMethodLabel: 'Razorpay (UPI / Card / Netbanking)',
    lines,
    itemTotalPaisa: Math.round(Number(order.subtotal) || 0),
    deliveryPaisa: Math.round(Number(order.delivery_charge) || 0),
    discountPaisa: Math.round(Number(order.discount_amount) || 0),
    gstPaisa: Math.round(Number(order.gst_amount) || 0),
    totalPaisa: Math.round(Number(order.total_price) || 0),
    couponCode: (order.coupon_code as string | null) ?? null,
    shipToName: addr?.name?.trim() || 'Customer',
    shipToEmail: addr?.email?.trim() || '',
    shipToPhone: addr?.phone1?.trim() || '',
    shipToAddressLines: shipToAddressLines.length ? shipToAddressLines : ['—'],
  }
}
