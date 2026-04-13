import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string | null
      email: string
      image?: string | null
      role: 'admin' | 'user'
      phone: string | null
      createdAt: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string
    email?: string | null
    googleProvider?: 'google'
    appUser?: {
      id: string
      name: string | null
      email: string
      image?: string | null
      role: 'admin' | 'user'
      phone: string | null
      createdAt: string
    }
  }
}
