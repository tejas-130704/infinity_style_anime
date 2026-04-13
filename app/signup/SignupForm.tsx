'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/GlowButton'
import { GoogleLogin } from '@/components/GoogleLogin'
import { toast } from 'react-toastify'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/account'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'account_not_found') {
      toast.error('No account found, please sign up.')
    }
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
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
        <h1 className="font-cinzel text-3xl font-bold text-white">Create account</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-white">Name</label>
            <input
              className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              minLength={6}
              className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <GlowButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Sign up'}
          </GlowButton>
        </form>

        <div className="mt-4">
          <GoogleLogin mode="signup" />
        </div>

        <p className="mt-4 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-mugen-gold hover:text-white"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
