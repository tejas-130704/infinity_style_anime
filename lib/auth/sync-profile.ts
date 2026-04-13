import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export async function syncProfileFromAuthUser(user: User) {
  const admin = createAdminClient()
  const googleIdentity = user.identities?.find((i) => i?.provider === 'google') ?? null

  const fullPayload = {
    id: user.id,
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      null,
    email: user.email ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    auth_provider: user.app_metadata?.provider ?? null,
    provider_user_id: googleIdentity?.id ?? user.identities?.[0]?.id ?? null,
    email_verified:
      typeof user.user_metadata?.email_verified === 'boolean'
        ? user.user_metadata.email_verified
        : null,
    last_sign_in_at: new Date().toISOString(),
  }

  const { error } = await admin.from('profiles').upsert(
    fullPayload,
    { onConflict: 'id' }
  )

  if (!error) {
    return
  }

  // Backward compatibility: if new identity columns are missing in DB, still create profile row.
  if (/column .* does not exist/i.test(error.message)) {
    const { error: fallbackError } = await admin.from('profiles').upsert(
      {
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          null,
      },
      { onConflict: 'id' }
    )

    if (!fallbackError) {
      return
    }
    throw fallbackError
  }

  throw error
}

