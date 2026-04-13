'use client'

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] w-full max-w-[100vw] flex-col justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        >
          {/* Public URL mirrors folder on disk: public/assests/videos/ (spelling matches repo) */}
          <source src="/assests/videos/Background.mp4" type="video/mp4" />
        </video>
        {/* Left-to-center dark gradient for text legibility */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(to right, rgb(1,1,1) 0%, rgba(8, 8, 8, 0.5) 42%, rgba(8,8,8,0.15) 72%, rgba(8,8,8,0) 100%)',
          }}
          aria-hidden
        />
        {/* Top + bottom vignette */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-transparent to-black/65" />
      </div>

      {/* Content — full width on narrow phones; capped width on larger screens */}
      <div className="relative z-20 flex w-full items-center justify-start px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-28 md:px-12 lg:px-16">
        <div
          className="w-full max-w-full text-left text-white sm:max-w-lg md:max-w-xl lg:max-w-2xl"
          data-aos="fade-up"
          data-aos-duration="900"
          data-aos-delay="150"
        >
          {/* Main Title */}
          <h1 className="mb-4 font-cinzel text-[clamp(1.75rem,6vw,4.5rem)] font-bold leading-[1.1] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)] sm:mb-5">
            <span className="block text-white">Wear The</span>
            <span className="block text-white">Legend.</span>
            <span className="block text-mugen-crimson [text-shadow:0_2px_20px_rgba(0,0,0,0.95),0_0_28px_rgba(134,56,65,0.5)]">
              Live The Arc.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-prose font-sans text-sm leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.75)] sm:text-base">
            Exclusive anime merchandise drops with premium quality, 3D customization, and limited
            editions. Each piece tells a story.
          </p>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-col gap-2 text-xs font-sans text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:text-sm">
            <div className="flex min-h-11 items-center gap-2 text-yellow-600">
              <span className="text-mugen-gold">✓</span>
              <span>Premium Quality</span>
            </div>
            <div className="flex min-h-11 items-center gap-2">
              <span className="text-mugen-gold">✓</span>
              <span>Fast Shipping</span>
            </div>
            <div className="flex min-h-11 items-center gap-2 text-green-600">
              <span className="text-mugen-gold">✓</span>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating ambient glow — hidden on very small screens to reduce clutter */}
      <div className="pointer-events-none absolute bottom-8 right-6 hidden h-28 w-28 rounded-full bg-gradient-to-t from-mugen-crimson/30 to-transparent opacity-50 blur-3xl animate-pulse sm:bottom-10 sm:right-10 sm:block sm:h-32 sm:w-32" />
    </section>
  )
}
