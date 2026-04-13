import { redirect } from 'next/navigation'
import { getServerSessionSafe } from '@/lib/auth/safe-get-server-session'
import { createClient } from '@/lib/supabase/server'

/** If the visitor already has a session, send them to home (login/signup are guest-only). */
export async function redirectHomeIfAuthenticated() {
  const session = await getServerSessionSafe()
  if (session?.user) {
    redirect('/')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    redirect('/')
  }
}
