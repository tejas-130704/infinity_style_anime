'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/GlowButton'
import { GoogleLogin } from '@/components/GoogleLogin'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/account'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'account_exists') {
      toast.error('Account already exists, please sign in.')
    }
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push(next)
    router.refresh()
  }



  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-md px-4">
        <h1 className="font-cinzel text-3xl font-bold text-white">Sign in</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-white">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-white">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-400">{error}</p>
              {error.toLowerCase().includes('invalid login') && (
                <p className="text-xs leading-relaxed text-white/50">
                  If this account should exist: run <code className="text-mugen-gold">npm run seed:admin</code> (needs{' '}
                  <code className="text-white/80">SUPABASE_SERVICE_ROLE_KEY</code> in{' '}
                  <code className="text-white/80">.env.local</code>), then restart <code className="text-white/80">npm run dev</code>.
                  Ensure URL + anon/publishable keys are from the same Supabase project. If you only use Google for this
                  email, use &quot;Continue with Google&quot; instead.
                </p>
              )}
            </div>
          )}
          <GlowButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </GlowButton>
        </form>

        <div className="mt-4">
          <p className="mb-2 text-center text-xs text-white/40">or</p>
          <GoogleLogin mode="signin" />
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          No account?{' '}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-semibold text-mugen-gold hover:text-white"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
