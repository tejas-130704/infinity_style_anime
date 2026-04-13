import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/session-guard'
import {
  assertPremiumFetchSite,
  assertPremiumOrigin,
  checkPremiumRateLimit,
} from '@/lib/premium-asset-request'
import {
  isUserGeneratedCatalogCategory,
} from '@/lib/premium-assets-policy'

export const runtime = 'nodejs'

/**
 * Proxies STL (or binary preview) for catalog action figures only.
 * Custom / personalized products keep direct URLs and must not hit this route.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ productId: string }> },
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

  const { productId } = await ctx.params
  if (!productId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('products')
    .select('category, model_url')
    .eq('id', productId)
    .maybeSingle()

  if (error || !row?.model_url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (isUserGeneratedCatalogCategory(row.category)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (row.category !== 'action_figures') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const upstream = row.model_url
  try {
    const u = new URL(upstream)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return NextResponse.json({ error: 'Bad asset' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Bad asset' }, { status: 400 })
  }

  const upstreamRes = await fetch(upstream, { cache: 'no-store' })
  if (!upstreamRes.ok || !upstreamRes.body) {
    return NextResponse.json({ error: 'Upstream failed' }, { status: 502 })
  }

  const headers = new Headers()
  const ct =
    upstreamRes.headers.get('content-type') ??
    'application/octet-stream'
  headers.set('Content-Type', ct)
  headers.set('Cache-Control', 'private, no-store, max-age=0')
  headers.set('X-Content-Type-Options', 'nosniff')

  return new NextResponse(upstreamRes.body, { status: 200, headers })
}
