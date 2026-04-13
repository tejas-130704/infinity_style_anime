import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getNextAuthSecret } from '@/lib/auth/nextauth-secret'
import { updateSession } from '@/lib/supabase/middleware'

let warnedMissingNextAuthSecret = false

// Routes that require authentication (non-admin users)
const PROTECTED_ROUTES = ['/account', '/orders', '/checkout', '/cart', '/profile']

// Routes that require admin
const ADMIN_ROUTES = ['/admin']

// Auth-related API routes to rate-limit
const AUTH_API_ROUTES = [
  '/api/auth/google',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/signin',
]

// Simple in-process rate limiter for auth routes (middleware-compatible)
// Using a plain object avoids importing the class which might have issues in edge runtime
const authRateStore = new Map<string, { count: number; resetAt: number }>()

function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60_000
  const max = 20

  const entry = authRateStore.get(ip)
  if (!entry || now > entry.resetAt) {
    authRateStore.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const ip = getIp(request)
  const ua = request.headers.get('user-agent') ?? ''

  // ── Rate limit auth API routes ──────────────────────────────────────────────
  if (AUTH_API_ROUTES.some((r) => path.startsWith(r))) {
    if (!checkAuthRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please wait a minute.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }
  }

  // Refresh Supabase cookies first so getUser() matches the incoming request.
  const { response: supabaseResponse, supabaseUserId } = await updateSession(request)

  const secret = getNextAuthSecret()
  if (!secret && process.env.NODE_ENV === 'development' && !warnedMissingNextAuthSecret) {
    warnedMissingNextAuthSecret = true
    console.warn(
      '[auth] NEXTAUTH_SECRET is not set — middleware cannot validate NextAuth sessions. Add NEXTAUTH_SECRET (32+ random chars) to .env.local and restart, or Google sign-in will redirect back to /login.'
    )
  }

  let nextAuthAuthed = false
  if (secret) {
    const token = await getToken({ req: request, secret })
    const appUserId = (token as { appUser?: { id?: string } } | null)?.appUser?.id
    nextAuthAuthed = !!(token?.uid || appUserId)
  }

  const hasAppSession = nextAuthAuthed || !!supabaseUserId

  // ── Redirect authenticated users away from login/signup ────────────────────
  if (path === '/login' || path === '/signup') {
    if (hasAppSession) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── Protect user account routes (NextAuth JWT and/or Supabase session) ─────
  const isProtected = PROTECTED_ROUTES.some((r) => path.startsWith(r))
  if (isProtected && !hasAppSession) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', path)
    return NextResponse.redirect(redirectUrl)
  }

  // ── Protect admin routes ───────────────────────────────────────────────────
  const isAdmin = ADMIN_ROUTES.some((r) => path.startsWith(r))
  if (isAdmin && !path.startsWith('/api/') && !hasAppSession) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', path)
    return NextResponse.redirect(redirectUrl)
    // Role check happens inside AdminLayout via Supabase for accuracy
  }

  // ── Pass IP + UA to auth events via short-lived cookies ────────────────────
  // These are read in auth.ts signIn event to record login_activity.
  // We only inject on the callback path so they're available during the OAuth handshake.
  if (path.startsWith('/api/auth/callback')) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60, // 60 seconds — just long enough for the callback
    }
    supabaseResponse.cookies.set('_req_ip', ip, cookieOptions)
    supabaseResponse.cookies.set('_req_ua', ua.slice(0, 300), {
      ...cookieOptions,
      httpOnly: true,
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|glb)$).*)',
  ],
}
