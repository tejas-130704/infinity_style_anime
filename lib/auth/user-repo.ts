import { createAdminClient } from '@/lib/supabase/admin'

export type AppUser = {
  id: string
  name: string | null
  email: string
  role: 'admin' | 'user'
  phone: string | null
  createdAt: string
  image?: string | null
}

function toAppUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    name: (row.name as string | null) ?? null,
    email: (row.email as string) ?? '',
    role: row.is_admin ? 'admin' : 'user',
    phone: (row.phone as string | null) ?? null,
    createdAt: (row.created_at as string) ?? '',
    image: (row.avatar_url as string | null) ?? null,
  }
}

const PROFILE_SELECT = 'id, name, email, phone, is_admin, created_at, avatar_url'

/** PostgREST / Supabase: unknown column wording varies (incl. "schema cache"). */
function isProfileColumnMissingError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase()
  if (!m) return false
  if (m.includes('schema cache') && m.includes('column')) return true
  if (/could not find .* column/i.test(err?.message ?? '')) return true
  if (/column .* does not exist/i.test(m)) return true
  if (m.includes('unknown column')) return true
  return false
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('email', email.toLowerCase())
    .maybeSingle()
  if (error || !data) return null
  return toAppUser(data as Record<string, unknown>)
}

export async function findUserByGoogleProviderId(providerUserId: string): Promise<AppUser | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('provider_user_id', providerUserId)
    .maybeSingle()
  if (error || !data) return null
  return toAppUser(data as Record<string, unknown>)
}

export async function findUserById(id: string): Promise<AppUser | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return toAppUser(data as Record<string, unknown>)
}

export async function updateGoogleOAuthProfile(
  profileId: string,
  input: {
    email: string
    name: string | null
    avatar_url: string | null
    provider_user_id: string
    google_access_token_enc: string | null
    google_refresh_token_enc: string | null
  }
) {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = {
    email: input.email.toLowerCase(),
    name: input.name,
    avatar_url: input.avatar_url,
    auth_provider: 'google',
    provider_user_id: input.provider_user_id,
    email_verified: true,
    last_sign_in_at: new Date().toISOString(),
  }
  if (input.google_access_token_enc != null) {
    patch.google_access_token_enc = input.google_access_token_enc
  }
  if (input.google_refresh_token_enc != null) {
    patch.google_refresh_token_enc = input.google_refresh_token_enc
  }

  let { error } = await admin.from('profiles').update(patch).eq('id', profileId)
  if (error && isProfileColumnMissingError(error)) {
    const minimal = {
      email: input.email.toLowerCase(),
      name: input.name,
    }
    ;({ error } = await admin.from('profiles').update(minimal).eq('id', profileId))
  }
  if (error) {
    throw new Error(error.message)
  }
}

export async function createGoogleUserProfile(input: {
  email: string
  name: string | null
  image?: string | null
  provider_user_id: string
  google_access_token_enc: string | null
  google_refresh_token_enc: string | null
}): Promise<AppUser> {
  const admin = createAdminClient()

  let authUserId: string | null = null
  const created = await admin.auth.admin.createUser({
    email: input.email.toLowerCase(),
    email_confirm: true,
    user_metadata: {
      name: input.name ?? null,
      avatar_url: input.image ?? null,
      provider: 'google',
    },
  })

  if (!created.error && created.data.user?.id) {
    authUserId = created.data.user.id
  } else {
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const match = listed.data.users.find((u) => (u.email || '').toLowerCase() === input.email.toLowerCase())
    if (match?.id) {
      authUserId = match.id
    }
  }

  if (!authUserId) {
    throw new Error(created.error?.message || 'Failed to resolve auth user id for Google account')
  }

  const emailLower = input.email.toLowerCase()
  const fullRow: Record<string, unknown> = {
    id: authUserId,
    email: emailLower,
    name: input.name,
    avatar_url: input.image ?? null,
    phone: null,
    is_admin: false,
    auth_provider: 'google',
    provider_user_id: input.provider_user_id,
    email_verified: true,
    last_sign_in_at: new Date().toISOString(),
  }
  if (input.google_access_token_enc != null) {
    fullRow.google_access_token_enc = input.google_access_token_enc
  }
  if (input.google_refresh_token_enc != null) {
    fullRow.google_refresh_token_enc = input.google_refresh_token_enc
  }

  const tiers: Record<string, unknown>[] = [
    fullRow,
    {
      id: authUserId,
      email: emailLower,
      name: input.name,
      avatar_url: input.image ?? null,
      is_admin: false,
    },
    {
      id: authUserId,
      email: emailLower,
      name: input.name,
      is_admin: false,
    },
    { id: authUserId, email: emailLower, name: input.name },
  ]

  let data: Record<string, unknown> | null = null
  let lastError: { message: string } | null = null

  for (const row of tiers) {
    const res = await admin
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select(PROFILE_SELECT)
      .single()
    if (!res.error && res.data) {
      data = res.data as Record<string, unknown>
      break
    }
    lastError = res.error ?? { message: 'Unknown error' }
    if (!isProfileColumnMissingError(res.error)) {
      break
    }
  }

  if (!data) {
    throw new Error(lastError?.message || 'Failed to create or update profile for Google account')
  }
  return toAppUser(data)
}
