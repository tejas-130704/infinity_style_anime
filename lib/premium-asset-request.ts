import { getClientIp } from '@/lib/rate-limit'
import { premiumAssetLimiter } from '@/lib/rate-limit'

/**
 * Hotlink / CSRF-ish guard: block obvious cross-site fetches when Sec-Fetch-Site is present.
 * Browsers send this header for fetch() from your own pages as same-origin or same-site.
 */
export function assertPremiumFetchSite(request: Request): Response | null {
  const mode = request.headers.get('sec-fetch-site')
  if (mode === 'cross-site') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}

/**
 * Optional strict allowlist: set PREMIUM_ASSET_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000
 * If unset, only Sec-Fetch-Site (above) + session apply.
 */
export function assertPremiumOrigin(request: Request): Response | null {
  const raw = process.env.PREMIUM_ASSET_ALLOWED_ORIGINS?.trim()
  if (!raw) return null

  const allowed = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const ref = request.headers.get('referer')
  const originHdr = request.headers.get('origin')
  let origin: string | null = null
  try {
    if (ref) origin = new URL(ref).origin
    else if (originHdr) origin = originHdr
  } catch {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!origin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!allowed.some((a) => origin === a || origin.startsWith(a))) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}

export function checkPremiumRateLimit(request: Request): Response | null {
  const ip = getClientIp(request)
  const { success, resetIn } = premiumAssetLimiter.check(`premium:${ip}`)
  if (success) return null
  return new Response(JSON.stringify({ error: 'Too many requests', retryAfterMs: resetIn }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  })
}
