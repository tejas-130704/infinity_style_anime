import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session-guard'
import {
  assertPremiumFetchSite,
  assertPremiumOrigin,
  checkPremiumRateLimit,
} from '@/lib/premium-asset-request'
import { resolveCatalogGlbFilename } from '@/lib/premium-assets-policy'

export const runtime = 'nodejs'

function premiumGlbDirs() {
  const custom = process.env.PREMIUM_GLB_ROOT?.trim()
  if (custom) return [path.resolve(custom)]
  return [path.join(process.cwd(), 'premium-assets', 'glb')]
}

async function resolveGlbPath(filename: string): Promise<string | null> {
  for (const dir of premiumGlbDirs()) {
    const abs = path.join(dir, filename)
    try {
      const st = await fs.stat(abs)
      if (st.isFile()) return abs
    } catch {
      /* try next */
    }
  }
  if (process.env.PREMIUM_GLB_ALLOW_PUBLIC_FALLBACK !== 'false') {
    const pub = path.join(process.cwd(), 'public', 'assests', 'models', filename)
    try {
      const st = await fs.stat(pub)
      if (st.isFile()) return pub
    } catch {
      /* missing */
    }
  }
  return null
}

async function handle(
  request: Request,
  ctx: { params: Promise<{ characterId: string }> },
  headOnly: boolean,
) {
  const rl = checkPremiumRateLimit(request)
  if (rl) return rl
  const sf = assertPremiumFetchSite(request)
  if (sf) return sf
  const og = assertPremiumOrigin(request)
  if (og) return og

  const requireAuth = process.env.PREMIUM_CATALOG_REQUIRE_AUTH !== 'false'
  if (requireAuth) {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { characterId } = await ctx.params
  const filename = resolveCatalogGlbFilename(characterId)
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const abs = await resolveGlbPath(filename)
  if (!abs) {
    return NextResponse.json(
      { error: 'Model not on server. Place GLBs under premium-assets/glb/ or set PREMIUM_GLB_ROOT.' },
      { status: 404 },
    )
  }

  const st = await fs.stat(abs)
  const headers = new Headers()
  headers.set('Content-Type', 'model/gltf-binary')
  headers.set('Cache-Control', 'private, no-store, max-age=0')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Content-Disposition', 'inline')

  if (headOnly) {
    headers.set('Content-Length', String(st.size))
    return new NextResponse(null, { status: 200, headers })
  }

  const buf = await fs.readFile(abs)
  headers.set('Content-Length', String(buf.byteLength))
  return new NextResponse(buf, { status: 200, headers })
}

export function HEAD(
  request: Request,
  ctx: { params: Promise<{ characterId: string }> },
) {
  return handle(request, ctx, true)
}

export function GET(
  request: Request,
  ctx: { params: Promise<{ characterId: string }> },
) {
  return handle(request, ctx, false)
}
