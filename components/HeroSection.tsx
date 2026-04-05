'use client'

import { useRef } from 'react'
import { GlowButton } from './GlowButton'

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  return (
    <section
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden flex items-center justify-start pt-20"
    >
      {/* Video Background — file: public/assests/videos/Background.mp4 */}
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src="/assests/videos/Background.mp4" type="video/mp4" />
        </video>
        {/* Black film: 100% opacity at left edge → 0% at horizontal center; right half stays clear */}
        <div
          className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(to_right,rgb(1, 1, 1)_0%,rgba(8, 8, 8, 0)_100%)]"
          aria-hidden
        />
        {/* Light vertical vignette for bottom/top readability (does not repeat the left rail) */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/55" />
      </div>

      {/* Content: left-aligned, width capped at 40vw from the left rail */}
      <div className="relative z-20 w-full flex justify-start px-4 md:px-8 lg:pl-50 lg:pr-8">
        <div
          className="w-full max-w-[40vw] min-w-0 text-left text-white"
          data-aos="fade-up"
          data-aos-duration="900"
          data-aos-delay="150"
        >
          {/* Main Title */}
          <h1
            ref={titleRef}
            className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight text-left text-balance text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)] "
          >
            <span className="word inline-block text-white">Wear</span>{' '}
            <span className="word inline-block text-white">The</span>{' '}
            <span className="word inline-block text-white">Legend.</span>
            <br />
            <span className="word inline-block text-mugen-crimson [text-shadow:0_2px_20px_rgba(0,0,0,0.95),0_0_28px_rgba(134,56,65,0.5)]">
              Live
            </span>{' '}
            <span className="word inline-block text-mugen-crimson [text-shadow:0_2px_20px_rgba(0,0,0,0.95),0_0_28px_rgba(134,56,65,0.5)]">
              The
            </span>{' '}
            <span className="word inline-block text-mugen-crimson [text-shadow:0_2px_20px_rgba(0,0,0,0.95),0_0_28px_rgba(134,56,65,0.5)]">
              Arc.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-base md:text-lg text-white/90 mb-8 leading-relaxed [text-shadow:0_1px_12px_rgba(0,0,0,0.75)]">
            Exclusive anime merchandise drops with premium quality, 3D customization, and limited editions. Each piece tells a story.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-start">
            <GlowButton className="hover:glow-gold" size="lg" onClick={() => {}}>
              Shop Now
            </GlowButton>
            <GlowButton size="lg" variant="outline" onClick={() => {}}>
              Custom Order
            </GlowButton>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap gap-8 text-sm font-sans text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2">
              <span className="text-mugen-gold">✓</span>
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-mugen-gold">✓</span>
              <span>Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-mugen-gold">✓</span>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Element */}
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-t from-mugen-crimson/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" />
    </section>
  )
}
