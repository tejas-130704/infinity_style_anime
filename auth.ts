import type { NextAuthOptions } from 'next-auth'
import Google from 'next-auth/providers/google'
import { cookies } from 'next/headers'
import { getNextAuthSecret } from '@/lib/auth/nextauth-secret'
import type { AppUser } from '@/lib/auth/user-repo'
import { findUserByEmail, findUserById } from '@/lib/auth/user-repo'
import { syncGoogleOAuthAndEnforceIntent } from '@/lib/auth/google-oauth-signin'
import { recordLoginActivity } from '@/lib/auth/login-activity'

async function getIntentFromCookies(): Promise<'signin' | 'signup'> {
  const jar = await cookies()
  const explicit = jar.get('google_auth_intent')?.value
  if (explicit === 'signup') return 'signup'
  if (explicit === 'signin') return 'signin'

  const callback = jar.get('next-auth.callback-url')?.value
  if (callback) {
    try {
      const u = new URL(callback)
      const mode = u.searchParams.get('authMode')
      if (mode === 'signup') return 'signup'
      if (mode === 'signin') return 'signin'
    } catch {
      // ignore parse issues
    }
  }
  return 'signin'
}

function slimSessionUser(u: AppUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image ?? null,
    role: u.role,
    phone: u.phone,
    createdAt: u.createdAt,
  }
}

let jwtSessionErrorDidLog = false
function jwtSessionErrorLogged() {
  if (jwtSessionErrorDidLog) return
  jwtSessionErrorDidLog = true
  console.warn(
    '[next-auth] Session cookie could not be decrypted (stale cookie or NEXTAUTH_SECRET changed). Clear cookies for this site, set a stable NEXTAUTH_SECRET (32+ chars) in .env.local, restart dev, then sign in again.'
  )
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          access_type: 'offline',
          // Ensures refresh_token on consent; remove after first token is stored for better UX.
          prompt: 'consent',
        },
      },
    }),
  ],
  secret: getNextAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google' || !user.email) return true
      const intent = await getIntentFromCookies()
      const result = await syncGoogleOAuthAndEnforceIntent(intent, user, account)
      return result
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user?.email) {
        token.email = user.email.toLowerCase()
        token.googleProvider = 'google'
      }

      const uid = typeof token.uid === 'string' ? token.uid : undefined
      if (uid) {
        const dbUser = await findUserById(uid)
        if (dbUser) {
          token.uid = dbUser.id
          token.appUser = slimSessionUser(dbUser)
          token.email = dbUser.email.toLowerCase()
          return token
        }
        delete token.uid
        delete token.appUser
      }

      const emailRaw = (user?.email ?? token.email ?? '') as string
      const email = emailRaw.toLowerCase()
      if (email) {
        const dbUser = await findUserByEmail(email)
        if (dbUser) {
          token.uid = dbUser.id
          token.appUser = slimSessionUser(dbUser)
          token.email = dbUser.email.toLowerCase()
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.appUser && typeof token.appUser === 'object') {
        const u = token.appUser as ReturnType<typeof slimSessionUser>
        session.user = {
          ...session.user,
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image ?? session.user?.image ?? null,
          role: u.role,
          phone: u.phone,
          createdAt: u.createdAt,
        }
      } else if (token.uid) {
        session.user = {
          ...session.user,
          id: token.uid as string,
          email: (token.email as string) ?? session.user?.email ?? '',
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      try {
        const parsed = new URL(url)
        if (parsed.origin === baseUrl) return url
      } catch {
        // ignore
      }
      return `${baseUrl}/account`
    },
  },
  events: {
    async signIn(message) {
      const provider = message.account?.provider ?? 'email'
      console.log(`[auth] ${provider} sign-in success:`, message.user.email)

      // Record login activity for history tracking
      const userId = (message.user as { id?: string }).id
      if (userId) {
        // Retrieve IP / UA stored in a cookie by middleware (best-effort)
        let ipAddress: string | null = null
        let userAgent: string | null = null
        try {
          const jar = await cookies()
          ipAddress = jar.get('_req_ip')?.value ?? null
          userAgent = jar.get('_req_ua')?.value ?? null
        } catch {
          // cookies() unavailable in some contexts — ignore
        }
        await recordLoginActivity({ userId, provider, ipAddress, userAgent })
      }
    },
  },
  logger: {
    error(code, metadata) {
      if (code === 'JWT_SESSION_ERROR') {
        // Log once per process — SessionProvider polls /api/auth/session and would spam
        jwtSessionErrorLogged()
        return
      }
      console.error('[next-auth:error]', code, metadata)
    },
    warn(code) {
      console.warn('[next-auth:warn]', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[next-auth:debug]', code, metadata)
      }
    },
  },
}
