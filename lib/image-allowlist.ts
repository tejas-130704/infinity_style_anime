/**
 * Keep in sync with `images.remotePatterns` in next.config.mjs.
 * Used to set `unoptimized` when Next/Image should not run the optimization server fetch.
 *
 * Supabase Storage: always use `unoptimized`. The optimizer resolves DNS on the server;
 * many networks return IPv6 NAT64 (e.g. 64:ff9b::/96) for *.supabase.co, which Next.js
 * treats as a private IP and refuses — causing broken images and console errors.
 */
const EXTRA_HOSTS = new Set([
  'customer-assets.emergentagent.com',
  'm.media-amazon.com',
  'images.surferseo.art',
  'cdn.dribbble.com',
  'lh3.googleusercontent.com',
])

export function shouldOptimizeImageSrc(src: string): boolean {
  if (!src || src.startsWith('/')) return true
  if (!src.startsWith('http')) return true
  try {
    const { hostname } = new URL(src)
    if (hostname.endsWith('.supabase.co')) return false
    return EXTRA_HOSTS.has(hostname)
  } catch {
    return false
  }
}
