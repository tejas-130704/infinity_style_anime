'use client'

import { useEffect } from 'react'

/**
 * Client-side hardening (UX-heavy; bypassable via devtools). Complements server routes.
 * Enabled when NEXT_PUBLIC_ENABLE_CLIENT_ASSET_HARDENING=true OR in production.
 */
export function AssetProtectionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const explicit = process.env.NEXT_PUBLIC_ENABLE_CLIENT_ASSET_HARDENING
    const enabled =
      explicit === 'true' || (explicit !== 'false' && process.env.NODE_ENV === 'production')
    if (!enabled) return

    const stop = (e: Event) => e.preventDefault()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        return
      }
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase()
        if (k === 's' || k === 'u' || k === 'p') e.preventDefault()
        if (e.shiftKey && (k === 'i' || k === 'c' || k === 'j')) e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', stop)
    document.addEventListener('dragstart', stop, true)
    document.addEventListener('selectstart', stop, true)
    document.addEventListener('keydown', onKey, true)

    return () => {
      document.removeEventListener('contextmenu', stop)
      document.removeEventListener('dragstart', stop, true)
      document.removeEventListener('selectstart', stop, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [])

  return <>{children}</>
}
