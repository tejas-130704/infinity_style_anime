'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'

export interface UserMe {
  id: string
  name: string | null
  email: string
  image: string | null
  role: 'admin' | 'user'
  phone: string | null
  createdAt: string
}

interface UseUserMeResult {
  user: UserMe | null
  isLoading: boolean
  error: string | null
  /** Manually re-fetch user profile — e.g. after profile update */
  refresh: () => void
}

/**
 * GET /api/user/me — only when a session likely exists (NextAuth or Supabase cookie).
 * Avoids hitting the API for anonymous visitors (faster TTI, fewer 401s).
 */
export function useUserMe(): UseUserMeResult {
  const { status: nextAuthStatus, data: nextAuthData } = useSession()
  const [user, setUser] = useState<UserMe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inflightRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchGenRef = useRef(0)

  const hasCredentials = useCallback(async (): Promise<boolean> => {
    if (nextAuthStatus === 'authenticated' && nextAuthData?.user) return true
    if (nextAuthStatus === 'unauthenticated') {
      const {
        data: { session },
      } = await createClient().auth.getSession()
      return !!session
    }
    return false
  }, [nextAuthStatus, nextAuthData?.user])

  const fetchUser = useCallback(async (isBackground = false) => {
    inflightRef.current?.abort()
    const controller = new AbortController()
    inflightRef.current = controller
    const gen = ++fetchGenRef.current

    if (!isBackground) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const res = await fetch('/api/user/me', { signal: controller.signal })
      if (gen !== fetchGenRef.current) return

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null)
          return
        }
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const data: UserMe = await res.json()
      if (gen !== fetchGenRef.current) return
      setUser(data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (gen !== fetchGenRef.current) return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (gen === fetchGenRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const sync = useCallback(async (isBackground = false) => {
    if (nextAuthStatus === 'loading') {
      if (!isBackground) setIsLoading(true)
      return
    }

    const cred = await hasCredentials()
    if (!cred) {
      inflightRef.current?.abort()
      setUser(null)
      setError(null)
      setIsLoading(false)
      return
    }

    await fetchUser(isBackground)
  }, [nextAuthStatus, hasCredentials, fetchUser])

  const refresh = useCallback((isBackground = false) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void sync(isBackground), 500)
  }, [sync])

  useEffect(() => {
    void sync()
  }, [sync])

  useEffect(() => {
    const handleFocus = () => refresh(true) // Pass true for background refresh
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      inflightRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [refresh])

  return { user, isLoading, error, refresh }
}
