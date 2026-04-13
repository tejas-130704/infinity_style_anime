'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'react-toastify'

export function GoogleLogin({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') || '/account'
  const [loading, setLoading] = useState(false)

  async function startGoogleAuth() {
    try {
      setLoading(true)
      document.cookie = `google_auth_intent=${mode}; path=/; max-age=600; samesite=lax`
      await signIn('google', {
        callbackUrl: `${next}?authMode=${mode}`,
      })
    } catch (err) {
      console.error('Google auth start error:', err)
      toast.error('Failed to start Google authentication.')
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/40 font-medium tracking-wider uppercase">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <button
        type="button"
        onClick={startGoogleAuth}
        disabled={loading}
        className="w-full rounded-lg border border-white/20 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading
          ? 'Please wait…'
          : mode === 'signup'
            ? 'Sign up with Google'
            : 'Sign in with Google'}
      </button>

      <p className="text-[11px] text-white/25 text-center mt-1">
        By continuing with Google, you agree to our Terms of Service.
      </p>
    </div>
  )
}
