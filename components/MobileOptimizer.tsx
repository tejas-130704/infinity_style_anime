'use client'

import { useEffect } from 'react'

export function MobileOptimizer() {
  useEffect(() => {
    // Disable multi-touch zoom globally
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
    }
  }, [])

  return null
}
