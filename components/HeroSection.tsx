'use client'

export function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-start">
      {/* Video Background */}
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
        {/* Left-to-center dark gradient for text legibility */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgb(1,1,1) 0%, rgba(8, 8, 8, 0.42) 45%, rgba(8,8,8,0) 100%)',
          }}
          aria-hidden
        />
        {/* Top + bottom vignette */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      </div>

      {/* Content — left-rail, narrower max-width so text never overflows */}
      <div className="relative z-20 w-full flex justify-start items-center pt-10 px-4 sm:px-10 md:px-14 lg:px-18 xl:px-18">
        <div
          className="w-full max-w-[min(480px,55vw)] text-left text-white"
          data-aos="fade-up"
          data-aos-duration="900"
          data-aos-delay="150"
        >
          {/* Main Title */}
          <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)]">
            <span className="block text-white">Wear The</span>
            <span className="block text-white">Legend.</span>
            <span className="block text-mugen-crimson [text-shadow:0_2px_20px_rgba(0,0,0,0.95),0_0_28px_rgba(134,56,65,0.5)]">
              Live The Arc.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-sm sm:text-base text-white/85 leading-relaxed [text-shadow:0_1px_12px_rgba(0,0,0,0.75)]">
            Exclusive anime merchandise drops with premium quality, 3D customization, and limited
            editions. Each piece tells a story.
          </p>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm font-sans text-white/80 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2 text-yellow-600">
              <span className="text-mugen-gold">✓</span>
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-mugen-gold">✓</span>
              <span>Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-mugen-gold">✓</span>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating ambient glow */}
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-t from-mugen-crimson/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" />
    </section>
  )
}
