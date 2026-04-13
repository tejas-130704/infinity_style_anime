import { Suspense } from 'react'
import { AuthErrorContent } from './AuthErrorContent'

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-mugen-black pt-28 pb-20">
          <p className="text-white/60">Loading…</p>
        </main>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
