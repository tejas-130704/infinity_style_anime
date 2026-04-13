import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth/session-guard'

export type CartDbContext = {
  userId: string
  /** User JWT present — RLS applies. Otherwise service role with explicit user_id filters. */
  db: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>
  useRls: boolean
}

/**
 * Cart rows use RLS (auth.uid() = user_id). Google/NextAuth users often have no Supabase
 * cookie — use service role only after user id is verified via getSessionUser().
 */
export async function getCartContext(): Promise<CartDbContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id) {
    return { userId: user.id, db: supabase, useRls: true }
  }

  const sessionUser = await getSessionUser()
  if (!sessionUser?.id) {
    return null
  }

  return {
    userId: sessionUser.id,
    db: createAdminClient(),
    useRls: false,
  }
}
