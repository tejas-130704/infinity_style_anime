import { createAdminClient } from '@/lib/supabase/admin'

function isLoginActivityUnavailableError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    /relation ['"]?public\.login_activity['"]? does not exist/i.test(message) ||
    /relation.*login_activity.*does not exist/i.test(m) ||
    (m.includes('login_activity') && m.includes('schema cache')) ||
    (m.includes('could not find') && m.includes('login_activity'))
  )
}

interface LoginActivityInput {
  userId: string
  provider: string
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Records a login event to the login_activity table.
 * Uses the service-role admin client so it bypasses RLS.
 * Never throws — failures are logged and swallowed to avoid breaking auth flow.
 */
export async function recordLoginActivity(input: LoginActivityInput): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('login_activity').insert({
      user_id: input.userId,
      provider: input.provider,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ? input.userAgent.slice(0, 500) : null, // truncate long UAs
    })
    if (error) {
      const m = error.message ?? ''
      if (isLoginActivityUnavailableError(m)) {
        return
      }
      console.error('[login_activity] Failed to record:', m)
    }
  } catch (err) {
    console.error('[login_activity] Unexpected error:', err)
  }
}

/**
 * Fetches the recent login history for a user.
 * Returns an empty array if the table doesn't exist yet.
 */
export async function getLoginHistory(
  userId: string,
  limit = 20
): Promise<
  Array<{
    id: string
    provider: string
    ip_address: string | null
    user_agent: string | null
    created_at: string
  }>
> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('login_activity')
      .select('id, provider, ip_address, user_agent, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      const m = error.message ?? ''
      if (!isLoginActivityUnavailableError(m)) {
        console.error('[login_activity] Failed to fetch:', m)
      }
      return []
    }
    return data ?? []
  } catch {
    return []
  }
}
