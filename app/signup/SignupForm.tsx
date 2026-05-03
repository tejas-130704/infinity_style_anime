'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/GlowButton'
import { GoogleLogin } from '@/components/GoogleLogin'
import { toast } from 'sonner'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/account'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Show toasts for URL-based errors (Google redirect errors come back here)
  useEffect(() => {
    const authError = searchParams.get('error')
    if (!authError) return

    const messages: Record<string, string> = {
      account_exists:    'An account already exists with this Google address. Please sign in instead.',
      account_not_found: 'No account found for this Google address. Please sign up first.',
      auth:              'Authentication failed. Please try again.',
    }
    const msg = messages[authError] ?? `Sign-up error: ${authError}`
    toast.error(msg, { duration: 6000 })
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    const supabase = createClient()
    const { error: err, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    })
    setLoading(false)

    if (err) {
      if (err.message.toLowerCase().includes('already registered')) {
        toast.error('Account exists', {
          description: 'An account with this email already exists. Please sign in.',
          duration: 7000,
        })
      } else {
        toast.error(err.message, { duration: 6000 })
      }
      return
    }

    if (data?.session) {
      toast.success('Account created successfully!', { duration: 2500 })
      router.push(next)
      router.refresh()
    } else {
      toast.success('Check your email!', {
        description: 'We sent you a confirmation link. Please confirm your email to sign in.',
        duration: 8000,
      })
      router.push('/login')
    }
  }

  return (
    <main className="min-h-screen bg-mugen-black pt-20 pb-16 sm:pt-28 sm:pb-20">
      <div className="container mx-auto max-w-md px-4 sm:px-6">
        <h1 className="font-cinzel text-2xl font-bold text-white sm:text-3xl">Create Account</h1>
        <p className="mt-1 text-sm text-white/50">Join Infinity Style Anime</p>

        <form onSubmit={onSubmit} className="mt-6 sm:mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-3 text-base text-white
                         placeholder:text-white/30 focus:border-mugen-crimson focus:outline-none transition"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white" htmlFor="signup-password">
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-3 pr-12 text-base text-white
                           placeholder:text-white/30 focus:border-mugen-crimson focus:outline-none transition"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <GlowButton type="submit" className="w-full py-3" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
              </span>
            ) : 'Sign up'}
          </GlowButton>
        </form>

        {/* Google Sign-up */}
        <div className="mt-4">
          <GoogleLogin mode="signup" />
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-mugen-gold hover:text-white transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
