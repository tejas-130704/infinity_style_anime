import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-mugen-black pt-28 pb-20">
          <div className="container mx-auto max-w-md px-4">
            <h1 className="font-cinzel text-3xl font-bold text-white">Sign in</h1>
            <p className="mt-8 text-white/60">Loading…</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
