'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlowButton } from '@/components/GlowButton'

export default function CheckoutPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone1: '',
    phone2: '',
    email: '',
    address: '',
    city: '',
    state: '',
  })

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login?next=/checkout')
        return
      }
      setForm((f) => ({
        ...f,
        email: user.email ?? '',
      }))
      setReady(true)
    })()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Checkout failed')
        return
      }
      if (json.url) {
        window.location.href = json.url
        return
      }
      setError('No checkout URL returned')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto px-4 text-white/70">Loading…</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-lg px-4 md:px-8">
        <h1 className="font-cinzel text-3xl font-bold text-white">Checkout</h1>
        <p className="mt-2 text-sm text-white/60">Secure payment via Stripe</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {[
            ['name', 'Full name'],
            ['phone1', 'Phone'],
            ['phone2', 'Phone 2 (optional)'],
            ['email', 'Email'],
            ['address', 'Street address'],
            ['city', 'City'],
            ['state', 'State'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-semibold text-white">{label}</label>
              <input
                required={key !== 'phone2'}
                className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none"
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <GlowButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Redirecting…' : 'Pay with Stripe'}
          </GlowButton>
        </form>
      </div>
    </main>
  )
}
