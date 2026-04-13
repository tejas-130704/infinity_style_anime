import { Suspense } from 'react'
import CheckoutSuccessClient from './CheckoutSuccessClient'

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black pt-28 pb-20">
          <div className="container mx-auto max-w-2xl px-4">
            <p className="text-white/60">Loading…</p>
          </div>
        </main>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  )
}
