import type { Account, User } from 'next-auth'
import {
  createGoogleUserProfile,
  findUserByEmail,
  findUserByGoogleProviderId,
  updateGoogleOAuthProfile,
} from '@/lib/auth/user-repo'
import { encryptOAuthSecret } from '@/lib/auth/encrypt-oauth-tokens'

/**
 * NextAuth `signIn` hook: enforce signup/signin intent and sync Supabase profile + encrypted tokens.
 * Returns `true` to allow sign-in, or a path string to redirect (NextAuth error URL).
 */
export async function syncGoogleOAuthAndEnforceIntent(
  intent: 'signin' | 'signup',
  user: User,
  account: Account | null
): Promise<true | string> {
  if (account?.provider !== 'google' || !user.email) return true

  const email = user.email.toLowerCase()
  const googleSub = account.providerAccountId
  if (!googleSub) {
    return '/auth/error?error=OAuthAccount'
  }

  try {
    const accessEnc = encryptOAuthSecret(account.access_token ?? null)
    const refreshEnc = encryptOAuthSecret(account.refresh_token ?? null)

    const byEmail = await findUserByEmail(email)
    const bySub = await findUserByGoogleProviderId(googleSub)
    const existing = byEmail ?? bySub

    if (intent === 'signin') {
      if (!existing) {
        return '/signup?error=account_not_found'
      }
      await updateGoogleOAuthProfile(existing.id, {
        email,
        name: user.name ?? null,
        avatar_url: user.image ?? null,
        provider_user_id: googleSub,
        google_access_token_enc: accessEnc,
        google_refresh_token_enc: refreshEnc,
      })
      return true
    }

    // signup
    if (existing) {
      return '/login?error=account_exists'
    }

    await createGoogleUserProfile({
      email,
      name: user.name ?? null,
      image: user.image ?? null,
      provider_user_id: googleSub,
      google_access_token_enc: accessEnc,
      google_refresh_token_enc: refreshEnc,
    })

    return true
  } catch (e) {
    console.error('[google-oauth]', e)
    return '/auth/error?error=Callback'
  }
}
