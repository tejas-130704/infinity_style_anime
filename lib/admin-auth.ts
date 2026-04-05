import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<{ user: User } | { error: string; status: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user }
}
