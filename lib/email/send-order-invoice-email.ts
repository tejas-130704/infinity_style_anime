import {
  buildOrderInvoiceHtml,
  buildAdminInvoiceHtml,
  orderRowToInvoicePayload,
} from '@/lib/invoice/order-invoice-template'
import nodemailer from 'nodemailer'

// ─── Per spec: "do not hardcode anything EXCEPT the provided admin emails" ───
const ADMIN_RECIPIENTS = [
  'jainishan2023@gmail.com',
  'tejasjadhav130704@gmail.com',
]

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

function createTransporter() {
  const user = process.env.GMAIL_USER!
  const pass = process.env.GMAIL_APP_PASSWORD!
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export type InvoiceEmailResult = {
  sent: boolean
  skipped: boolean
  error?: string
  adminSent: boolean
  adminError?: string
}

/**
 * Sends the order invoice immediately after successful payment:
 *  1. Customer email  → clean invoice + order summary
 *  2. Admin emails (×2) → full invoice + complete client details banner
 *
 * Admin failures are logged but NEVER block the customer email.
 * Returns early (skipped) if GMAIL_USER / GMAIL_APP_PASSWORD are unset.
 */
export async function sendOrderInvoiceEmail(
  toEmail: string,
  order: Record<string, unknown>
): Promise<InvoiceEmailResult> {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPass) {
    console.warn('[invoice email] GMAIL_USER or GMAIL_APP_PASSWORD not configured — skipping.')
    return { sent: false, skipped: true, error: 'Email not configured', adminSent: false }
  }

  const trimmed = toEmail?.trim()
  if (!trimmed) {
    return { sent: false, skipped: true, error: 'No recipient email', adminSent: false }
  }

  const payload = orderRowToInvoicePayload(order, { paidAtIso: new Date().toISOString() })
  if (!payload) {
    return { sent: false, skipped: true, error: 'Invalid order payload', adminSent: false }
  }

  const base = assetBaseUrl()
  const customerHtml = buildOrderInvoiceHtml(payload, { assetBaseUrl: base })
  const adminHtml = buildAdminInvoiceHtml(payload, { assetBaseUrl: base })
  const short = payload.orderId.slice(0, 8).toUpperCase()
  const fromLabel = `"Infinity Style" <${gmailUser}>`

  const transporter = createTransporter()

  // ── 1. Customer email ─────────────────────────────────────────────────────
  let customerResult: { sent: boolean; error?: string } = { sent: false }
  try {
    await transporter.sendMail({
      from: fromLabel,
      to: trimmed,
      subject: `✅ Order Confirmed — Invoice #${short}`,
      html: customerHtml,
    })
    customerResult = { sent: true }
    console.log(`[invoice email] Customer invoice sent → ${trimmed} (order ${short})`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    customerResult = { sent: false, error: msg }
    console.error(`[invoice email] Customer send FAILED (order ${short}):`, msg)
  }

  // ── 2. Admin emails (parallel, independent) ───────────────────────────────
  let adminSent = false
  let adminError: string | undefined

  try {
    const adminSubject = `🛒 New Order #${short} — ${payload.shipToName} (${payload.shipToEmail})`

    const adminSends = ADMIN_RECIPIENTS.map((adminTo) =>
      transporter
        .sendMail({
          from: fromLabel,
          to: adminTo,
          subject: adminSubject,
          html: adminHtml,
        })
        .then(() => {
          console.log(`[admin invoice] Sent → ${adminTo} (order ${short})`)
          return { ok: true as const, to: adminTo }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`[admin invoice] FAILED → ${adminTo} (order ${short}):`, msg)
          return { ok: false as const, to: adminTo, error: msg }
        })
    )

    const results = await Promise.all(adminSends)
    const allOk = results.every((r) => r.ok)
    const failures = results.filter((r) => !r.ok) as { ok: false; to: string; error: string }[]

    adminSent = allOk
    if (failures.length > 0) {
      adminError = failures.map((f) => `${f.to}: ${f.error}`).join(' | ')
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    adminError = msg
    console.error('[admin invoice] Unexpected error during admin send:', msg)
  }

  return {
    sent: customerResult.sent,
    skipped: false,
    error: customerResult.error,
    adminSent,
    adminError,
  }
}
