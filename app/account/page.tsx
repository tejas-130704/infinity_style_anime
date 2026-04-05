import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from './actions'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/account')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-lg px-4">
        <h1 className="font-cinzel text-3xl font-bold text-white">Account</h1>
        <p className="mt-2 text-white/60">{user.email}</p>
        {profile?.name && <p className="mt-1 text-white/80">{profile.name}</p>}

        <div className="mt-10 flex flex-col gap-4">
          <Link
            href="/account/orders"
            className="rounded-xl border border-white/10 bg-mugen-dark/50 px-4 py-4 font-semibold text-white hover:border-mugen-glow/40"
          >
            Order history
          </Link>
          <Link href="/shop" className="text-mugen-gold hover:text-white">
            Continue shopping
          </Link>
        </div>

        <form className="mt-10" action={signOutAction}>
          <button type="submit" className="text-sm text-red-400 hover:text-red-300">
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
