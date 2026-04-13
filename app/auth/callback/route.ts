import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncProfileFromAuthUser } from '@/lib/auth/sync-profile'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // First OAuth login creates profile; repeat logins refresh metadata + access.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.id) {
          await syncProfileFromAuthUser(user)
        }
      } catch {
        // Non-fatal
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
