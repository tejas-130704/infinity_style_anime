/**
 * Keep in sync with `images.remotePatterns` in next.config.mjs.
 * Used to set `unoptimized` when Next/Image should not run the optimization server fetch.
 *
 * Supabase Storage: always use `unoptimized`. The optimizer resolves DNS on the server;
 * many networks return IPv6 NAT64 (e.g. 64:ff9b::/96) for *.supabase.co, which Next.js
 * treats as a private IP and refuses — causing broken images and console errors.
 *
 * External CDNs (amazon, dribbble, surferseo): also unoptimized — their servers
 * block or timeout Next.js server-side fetch, causing TimeoutError (code 23).
 */

/** Hosts that are safe for Next.js server-side optimization fetch */
const OPTIMIZED_HOSTS = new Set([
  'customer-assets.emergentagent.com',
  'lh3.googleusercontent.com',
])

/** Hosts that must bypass optimization (timeout / block server-side fetch) */
const SKIP_OPTIMIZE_HOSTS = new Set([
  'm.media-amazon.com',
  'images.surferseo.art',
  'cdn.dribbble.com',
])

export function shouldOptimizeImageSrc(src: string): boolean {
  if (!src || src.startsWith('/')) return true
  if (!src.startsWith('http')) return true
  try {
    const { hostname } = new URL(src)
    if (hostname.endsWith('.supabase.co')) return false
    if (SKIP_OPTIMIZE_HOSTS.has(hostname)) return false
    return OPTIMIZED_HOSTS.has(hostname)
  } catch {
    return false
  }
}
