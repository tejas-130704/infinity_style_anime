import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/admin/dashboard')
  }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-mugen-black pb-16 pt-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-2 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-mugen-gold/90">Admin</p>
            <h1 className="font-cinzel text-2xl font-bold text-white md:text-3xl">Infinity Style</h1>
            <p className="mt-1 text-sm text-white/50">Store management</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-white/70 hover:text-mugen-gold">
            ← Back to site
          </Link>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="shrink-0 md:w-52">
            <AdminNav />
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
