import { Suspense } from 'react'
import { redirectHomeIfAuthenticated } from '@/lib/auth/redirect-if-authenticated'
import { SignupForm } from './SignupForm'

export default async function SignupPage() {
  await redirectHomeIfAuthenticated()
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-mugen-black pt-28 pb-20">
          <div className="container mx-auto max-w-md px-4">
            <h1 className="font-cinzel text-3xl font-bold text-white">Create Account</h1>
            <p className="mt-8 text-white/60">Loading…</p>
          </div>
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
