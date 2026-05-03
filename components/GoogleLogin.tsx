'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

/** Human-readable messages for NextAuth error codes returned in URL */
const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  OAuthSignin:        'Could not connect to Google. Check your internet and try again.',
  OAuthCallback:      'Google sign-in was interrupted. Please try again.',
  OAuthCreateAccount: 'Could not create your account. Please try again or contact support.',
  OAuthAccount:       'Could not read your Google account info. Try again.',
  Callback:           'Sign-in failed. Please try again.',
  AccessDenied:       'Access was denied. You may have cancelled the Google sign-in.',
  Configuration:      'Authentication is not configured correctly. Contact support.',
  Default:            'Google sign-in failed. Please try again.',
  account_not_found:  'No account found for this Google address. Please sign up first.',
  account_exists:     'An account already exists with this email. Please sign in instead.',
}

export function GoogleLogin({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') || '/account'
  const [loading, setLoading] = useState(false)

  // Show error toast if redirected back with ?error= in URL
  useEffect(() => {
    const errorCode = searchParams?.get('error')
    if (errorCode) {
      const message = GOOGLE_AUTH_ERRORS[errorCode] ?? GOOGLE_AUTH_ERRORS.Default
      toast.error(message, {
        description: `Error code: ${errorCode}`,
        duration: 6000,
      })
    }
  }, [searchParams])

  async function startGoogleAuth() {
    if (loading) return
    try {
      setLoading(true)

      // Store intent in cookie so auth.ts callback knows whether this is signin or signup
      document.cookie = `google_auth_intent=${mode}; path=/; max-age=600; samesite=lax`

      const result = await signIn('google', {
        callbackUrl: `${next}?authMode=${mode}`,
        redirect: true,
      })

      // signIn with redirect:true normally navigates away — if we reach here it failed
      if (result?.error) {
        const message = GOOGLE_AUTH_ERRORS[result.error] ?? GOOGLE_AUTH_ERRORS.Default
        toast.error(message, {
          description: `Error: ${result.error}`,
          duration: 6000,
        })
        setLoading(false)
      }
    } catch (err: unknown) {
      console.error('[GoogleLogin] auth error:', err)
      const message = err instanceof Error && err.message
        ? `Google sign-in failed: ${err.message}`
        : 'Could not reach Google authentication. Check your internet connection.'
      toast.error(message, { duration: 6000 })
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <button
        type="button"
        id={`btn-google-${mode}`}
        onClick={startGoogleAuth}
        disabled={loading}
        className="relative flex w-full items-center justify-center gap-3 rounded-lg border border-white/20
                   bg-white px-4 py-3 text-sm font-semibold text-gray-800
                   transition-all duration-200
                   hover:bg-white/90 hover:shadow-md
                   disabled:cursor-not-allowed disabled:opacity-60
                   active:scale-[0.98]"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
        ) : (
          /* Google "G" logo */
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
        )}
        <span>
          {loading
            ? 'Connecting to Google…'
            : mode === 'signup'
              ? 'Sign up with Google'
              : 'Sign in with Google'}
        </span>
      </button>

      <p className="text-[11px] text-white/25 text-center">
        By continuing with Google, you agree to our Terms of Service.
      </p>
    </div>
  )
}
