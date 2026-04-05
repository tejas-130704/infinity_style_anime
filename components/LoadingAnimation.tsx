'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'

interface LoadingAnimationProps {
  onComplete: () => void
  isSkipped: boolean
}

export function LoadingAnimation({ onComplete, isSkipped }: LoadingAnimationProps) {
  const [isLoading, setIsLoading] = useState(!isSkipped)

  useEffect(() => {
    if (isSkipped) {
      setIsLoading(false)
      return
    }

    const animationTimeline = gsap.timeline({
      onComplete: () => {
        setIsLoading(false)
        onComplete()
      },
    })

    // Breathing glow animation for Zenitsu GIF
    animationTimeline.to(
      '.zenitsu-container',
      {
        duration: 2,
        filter: 'drop-shadow(0 0 30px rgba(134, 56, 65, 0.55))',
        scale: 1,
      },
      0
    )

    // Lightning bar progress animation
    animationTimeline.to(
      '.lightning-bar',
      {
        duration: 2.5,
        width: '100%',
        ease: 'power2.out',
      },
      0
    )

    // Delay for tear animation
    animationTimeline.to('.loading-overlay', { duration: 0.5 }, '+=0.5')

    // Zenitsu slides right
    animationTimeline.to(
      '.zenitsu-container',
      {
        duration: 0.8,
        x: '150vw',
        opacity: 0,
        ease: 'expoIn',
      },
      '-=0.3'
    )

    // Tear effect - split screen
    animationTimeline.to(
      '.tear-left',
      {
        duration: 0.6,
        x: '-100%',
        ease: 'expoIn',
      },
      '<'
    )

    animationTimeline.to(
      '.tear-right',
      {
        duration: 0.6,
        x: '100%',
        ease: 'expoIn',
      },
      '<'
    )

    // Fade out overlay
    animationTimeline.to(
      '.loading-overlay',
      {
        duration: 0.3,
        opacity: 0,
        pointerEvents: 'none',
      },
      '-=0.2'
    )
  }, [isSkipped, onComplete])

  if (!isLoading) return null

  return (
    <div className="loading-overlay fixed inset-0 bg-mugen-black z-50 flex items-center justify-center overflow-hidden">
      {/* Zenitsu Container */}
      <div className="zenitsu-container absolute z-30 transform">
        {/* Placeholder for Zenitsu GIF - will use gradient for now */}
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-b from-mugen-crimson to-mugen-gold pulse-glow flex items-center justify-center">
          <span className="text-4xl font-cinzel text-mugen-white text-center">⚡</span>
        </div>
      </div>

      {/* Tear Effect Dividers */}
      <div className="tear-left fixed inset-0 bg-mugen-black z-20 origin-left" />
      <div className="tear-right fixed inset-0 bg-mugen-black z-20 origin-right" />

      {/* Lightning Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-mugen-gray z-40">
        <div className="lightning-bar h-full bg-gradient-to-r from-mugen-crimson via-mugen-gold to-mugen-crimson w-0 shadow-glow-strong" />
      </div>

      {/* Loading Text */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center z-30">
        <p className="font-sans text-white/90 text-sm font-semibold tracking-widest uppercase">
          Initializing the Arc...
        </p>
      </div>
    </div>
  )
}
