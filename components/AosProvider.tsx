'use client'

import { useEffect } from 'react'

type AosProviderProps = {
  children: React.ReactNode
}

/**
 * Loads AOS in an async chunk after mount so the root layout bundle stays small
 * (avoids ChunkLoadError / timeouts on slow networks or heavy dev rebuilds).
 */
export function AosProvider({ children }: AosProviderProps) {
  useEffect(() => {
    let cancelled = false
    let teardown: (() => void) | undefined

    const run = async () => {
      await import('aos/dist/aos.css')
      const { default: AOS } = await import('aos')
      if (cancelled) return

      AOS.init({
        duration: 850,
        easing: 'ease-out-cubic',
        once: true,
        offset: 72,
        delay: 0,
      })

      const refresh = () => AOS.refresh()
      window.addEventListener('resize', refresh)
      const t1 = window.setTimeout(refresh, 400)
      const t2 = window.setTimeout(refresh, 1200)

      teardown = () => {
        window.removeEventListener('resize', refresh)
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }

    void run()

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [])

  return <>{children}</>
}
