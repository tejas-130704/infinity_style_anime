'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'

/**
 * Client fallback: block auth pages until session is resolved, then redirect if already signed in
 * (NextAuth and/or Supabase).
 */
export function GuestAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { status } = useSession()
  const [supabaseChecked, setSupabaseChecked] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated') {
      router.replace('/account')
      return
    }

    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (user) {
        router.replace('/account')
        return
      }
      setSupabaseChecked(true)
    })()

    return () => {
      cancelled = true
    }
  }, [status, router])

  if (status === 'loading' || (status === 'unauthenticated' && !supabaseChecked)) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto max-w-md px-4">
          <p className="text-white/60">Checking session…</p>
        </div>
      </main>
    )
  }

  if (status === 'authenticated') {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto max-w-md px-4">
          <p className="text-white/60">Redirecting…</p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
