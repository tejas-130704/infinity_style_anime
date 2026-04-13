import { URL } from 'node:url'

function supabaseStorageHostname() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) return null
  try {
    return new URL(raw).hostname
  } catch {
    return null
  }
}

const supabaseHost = supabaseStorageHostname()

/** Remote hosts allowed for `next/image` optimization (resize + WebP/AVIF). */
const remotePatterns = [
  { protocol: 'https', hostname: 'customer-assets.emergentagent.com', pathname: '/**' },
  { protocol: 'https', hostname: 'm.media-amazon.com', pathname: '/**' },
  { protocol: 'https', hostname: 'images.surferseo.art', pathname: '/**' },
  { protocol: 'https', hostname: 'cdn.dribbble.com', pathname: '/**' },
  { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
]

if (supabaseHost) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHost,
    pathname: '/storage/v1/object/public/**',
  })
}
/* Note: server-side fetch for Image Optimization can still fail for this host (NAT64 → "private IP").
   App uses `unoptimized` for Supabase URLs via `lib/image-allowlist.ts`. */

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['occt-import-js'],
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns,
  },
  compress: true,
}

export default nextConfig
