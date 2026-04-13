import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/session-guard'
import {
  assertPremiumFetchSite,
  assertPremiumOrigin,
  checkPremiumRateLimit,
} from '@/lib/premium-asset-request'
import {
  isCatalogPremiumCategory,
  isUserGeneratedCatalogCategory,
} from '@/lib/premium-assets-policy'

export const runtime = 'nodejs'

function buildGalleryUrls(row: {
  image_url: string | null
  extra_images: string | null
}): string[] {
  const urls: string[] = []
  if (row.image_url) urls.push(row.image_url)
  try {
    if (row.extra_images) {
      const parsed = JSON.parse(row.extra_images)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string') urls.push(item)
          else if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
            urls.push(item.url)
          }
        }
      }
    }
  } catch {
    /* ignore */
  }
  return urls
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ productId: string; index: string }> },
) {
  const rl = checkPremiumRateLimit(request)
  if (rl) return rl
  const sf = assertPremiumFetchSite(request)
  if (sf) return sf
  const og = assertPremiumOrigin(request)
  if (og) return og

  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId, index: indexStr } = await ctx.params
  const index = parseInt(indexStr, 10)
  if (!productId || !Number.isFinite(index) || index < 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('products')
    .select('category, image_url, extra_images')
    .eq('id', productId)
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (isUserGeneratedCatalogCategory(row.category)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!isCatalogPremiumCategory(row.category)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const urls = buildGalleryUrls(row)
  const upstream = urls[index]
  if (!upstream) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const u = new URL(upstream)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return NextResponse.json({ error: 'Bad asset' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Bad asset' }, { status: 400 })
  }

  const upstreamRes = await fetch(upstream, {
    headers: { Accept: 'image/*,*/*' },
    cache: 'no-store',
  })
  if (!upstreamRes.ok || !upstreamRes.body) {
    return NextResponse.json({ error: 'Upstream failed' }, { status: 502 })
  }

  const ct = upstreamRes.headers.get('content-type') ?? 'image/jpeg'
  const headers = new Headers()
  headers.set('Content-Type', ct)
  headers.set('Cache-Control', 'private, no-store, max-age=0')
  headers.set('X-Content-Type-Options', 'nosniff')

  return new NextResponse(upstreamRes.body, { status: 200, headers })
}
