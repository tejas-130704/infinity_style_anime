import { buildOrderInvoiceHtml, orderRowToInvoicePayload } from '@/lib/invoice/order-invoice-template'

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || '').replace(/\/$/, '')
}

function vercelHost(): string {
  const v = process.env.VERCEL_URL
  if (!v) return ''
  return v.startsWith('http') ? v : `https://${v}`
}

function assetBaseUrl(): string {
  return siteUrl() || vercelHost()
}

/**
 * Sends the global invoice template via Resend. No-op if RESEND_API_KEY is unset.
 * @returns { sent: boolean, skipped: boolean, error?: string }
 */
export async function sendOrderInvoiceEmail(toEmail: string, order: Record<string, unknown>): Promise<{
  sent: boolean
  skipped: boolean
  error?: string
}> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) {
    return { sent: false, skipped: true, error: 'Email not configured (RESEND_API_KEY / RESEND_FROM)' }
  }

  const trimmed = toEmail?.trim()
  if (!trimmed) {
    return { sent: false, skipped: true, error: 'No recipient email' }
  }

  const payload = orderRowToInvoicePayload(order, { paidAtIso: new Date().toISOString() })
  if (!payload) {
    return { sent: false, skipped: true, error: 'Invalid order payload' }
  }

  const html = buildOrderInvoiceHtml(payload, { assetBaseUrl: assetBaseUrl() })
  const short = payload.orderId.slice(0, 8).toUpperCase()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [trimmed],
      subject: `Your invoice — Order ${short}`,
      html,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return { sent: false, skipped: false, error: errText || `Resend HTTP ${res.status}` }
  }

  return { sent: true, skipped: false }
}
