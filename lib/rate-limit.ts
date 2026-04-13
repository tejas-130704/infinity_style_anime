/**
 * In-memory sliding-window rate limiter.
 * Works in Next.js Edge middleware and API routes (Node.js runtime).
 *
 * Usage:
 *   const limiter = new RateLimiter({ windowMs: 60_000, max: 20 })
 *   const { success } = limiter.check(ip)
 *   if (!success) return new Response('Too Many Requests', { status: 429 })
 */

interface RateLimiterOptions {
  /** Window length in milliseconds. Default: 60 000 (1 minute) */
  windowMs?: number
  /** Max requests allowed per window per key. Default: 20 */
  max?: number
}

interface CheckResult {
  /** true = allowed, false = rate-limited */
  success: boolean
  /** Remaining requests in the current window */
  remaining: number
  /** Milliseconds until the window resets */
  resetIn: number
}

export class RateLimiter {
  private readonly windowMs: number
  private readonly max: number
  /** Map<key, timestamps[]> */
  private readonly store = new Map<string, number[]>()

  constructor({ windowMs = 60_000, max = 20 }: RateLimiterOptions = {}) {
    this.windowMs = windowMs
    this.max = max
  }

  check(key: string): CheckResult {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Prune old timestamps
    const timestamps = (this.store.get(key) ?? []).filter((t) => t > windowStart)

    const count = timestamps.length

    if (count >= this.max) {
      const oldestAllowed = timestamps[count - this.max] ?? timestamps[0]
      return {
        success: false,
        remaining: 0,
        resetIn: oldestAllowed + this.windowMs - now,
      }
    }

    timestamps.push(now)
    this.store.set(key, timestamps)

    return {
      success: true,
      remaining: this.max - timestamps.length,
      resetIn: this.windowMs,
    }
  }

  /** Manually reset a key (e.g. after successful auth). */
  reset(key: string): void {
    this.store.delete(key)
  }
}

// ── Pre-built limiters ────────────────────────────────────────────────────────

/** Strict limiter for auth endpoints: 15 requests / minute per IP */
export const authLimiter = new RateLimiter({ windowMs: 60_000, max: 15 })

/** Looser limiter for general API endpoints: 60 requests / minute per IP */
export const apiLimiter = new RateLimiter({ windowMs: 60_000, max: 60 })

/** Premium catalog assets (images / GLB / STL proxy): 45 requests / minute per IP */
export const premiumAssetLimiter = new RateLimiter({ windowMs: 60_000, max: 45 })

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Returns the client IP from a Next.js Request or NextRequest.
 * Falls back to 'unknown' when running behind a reverse proxy without headers.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
