'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Copy = { title: string; body: string; hint?: string }

const BY_CODE: Record<string, Copy> = {
  Configuration: {
    title: 'Sign-in is not fully configured',
    body:
      'The app is missing required environment variables (for example NEXTAUTH_SECRET). Ask the administrator to check the server configuration.',
    hint: 'For local development, copy .env.example to .env.local and set NEXTAUTH_SECRET to a random string of at least 32 characters.',
  },
  AccessDenied: {
    title: 'Access denied',
    body: 'You do not have permission to sign in with this account.',
  },
  Verification: {
    title: 'Verification required',
    body: 'Check your email or complete verification before signing in.',
  },
  OAuthSignin: {
    title: 'Could not start Google sign-in',
    body: 'Something went wrong connecting to Google. Try again in a moment.',
  },
  OAuthCallback: {
    title: 'Could not finish sign-in',
    body: 'Google returned an unexpected response. Try signing in again.',
  },
  OAuthAccount: {
    title: 'Google account issue',
    body: 'We could not read a stable Google account id. Try again or use another sign-in method.',
  },
  Callback: {
    title: 'Something went wrong',
    body: 'We could not complete your Google sign-in or save your profile. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Could not create account',
    body: 'Account creation did not complete. Try again or contact support.',
  },
  EmailSignin: {
    title: 'Email sign-in failed',
    body: 'Check your email link or try signing in again.',
  },
  CredentialsSignin: {
    title: 'Invalid credentials',
    body: 'Email or password was not accepted.',
  },
  SessionRequired: {
    title: 'Session required',
    body: 'You need to be signed in to view this page.',
  },
  Default: {
    title: 'Sign-in failed',
    body: 'Something went wrong during authentication. Please try again from the login page.',
  },
}

function looksLikeInternalEnvMessage(s: string): boolean {
  const lower = s.toLowerCase()
  return (
    lower.includes('nextauth') ||
    lower.includes('google_token') ||
    lower.includes('encryption') ||
    lower.includes('env') ||
    s.length > 120
  )
}

function resolveCopy(raw: string | null): Copy {
  if (!raw || raw.trim() === '') {
    return BY_CODE.Default
  }

  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    decoded = raw
  }

  if (BY_CODE[decoded]) {
    return BY_CODE[decoded]
  }

  if (looksLikeInternalEnvMessage(decoded)) {
    return BY_CODE.Configuration
  }

  return {
    title: 'Sign-in failed',
    body: decoded.length <= 200 ? decoded : BY_CODE.Default.body,
  }
}

export function AuthErrorContent() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const { title, body, hint } = resolveCopy(errorParam)

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-md px-4">
        <div className="rounded-2xl border border-red-500/25 bg-red-950/20 p-8 text-center">
          <h1 className="font-cinzel text-2xl font-bold text-white md:text-3xl">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">{body}</p>
          {hint && process.env.NODE_ENV !== 'production' && (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-left text-xs text-white/50">{hint}</p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex justify-center rounded-lg bg-mugen-gold/90 px-6 py-3 text-sm font-semibold text-mugen-black transition hover:bg-mugen-gold"
            >
              Back to sign in
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/5"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
