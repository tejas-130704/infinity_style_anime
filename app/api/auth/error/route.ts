import { NextRequest, NextResponse } from 'next/server'

/**
 * NextAuth’s default error URL is /api/auth/error. Forward to the app UI page
 * so users never see the bare API error screen.
 */
export function GET(req: NextRequest) {
  const url = new URL(req.url)
  const error = url.searchParams.get('error')
  const dest = new URL('/auth/error', req.url)
  if (error) {
    dest.searchParams.set('error', error)
  }
  return NextResponse.redirect(dest)
}
