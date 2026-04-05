'use client'

import Image from 'next/image'

const brandLogos = [
  {
    src: '/assests/images/Jujutsu_Kaisen_logo.svg.png',
    alt: 'Jujutsu Kaisen',
  },
  {
    src: '/assests/images/My-hero-academia-jpn.svg.png',
    alt: 'My Hero Academia',
  },
  {
    src: '/assests/images/Naruto_logo.svg.png',
    alt: 'Naruto',
  },
  {
    src: '/assests/images/one-piece.jpg',
    alt: 'One Piece',
  },
  {
    src: '/assests/images/one-punch-man.png',
    alt: 'One-Punch Man',
  },
] as const

function LogoMark({
  logo,
  ariaHidden,
}: {
  logo: (typeof brandLogos)[number]
  ariaHidden?: boolean
}) {
  return (
    <div
      className="inline-flex shrink-0 items-center justify-center h-14 md:h-16 lg:h-[4.5rem] px-6 md:px-10 lg:px-14 opacity-90 hover:opacity-100 transition-opacity duration-300"
      aria-hidden={ariaHidden}
    >
      <Image
        src={logo.src}
        alt={ariaHidden ? '' : logo.alt}
        width={240}
        height={96}
        className="h-full w-auto max-w-[min(240px,30vw)] object-contain object-center"
        title={logo.alt}
      />
    </div>
  )
}

export function MarqueeSection() {
  return (
    <section
      className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-r from-mugen-crimson/10 via-mugen-black to-mugen-crimson/10  mx-40"
      data-aos="fade-in"
      data-aos-duration="900"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mugen-crimson to-transparent glow-crimson" />

      {/* Infinite loop: two identical strips — CSS animates −50% for seamless R→L scroll */}
      <div className="relative overflow-hidden w-full select-none">
        <div className="marquee-logos-track">
          <div className="flex shrink-0 items-center">
            {brandLogos.map((logo) => (
              <LogoMark key={`a-${logo.src}`} logo={logo} />
            ))}
          </div>
          <div className="flex shrink-0 items-center" aria-hidden>
            {brandLogos.map((logo) => (
              <LogoMark key={`b-${logo.src}`} logo={logo} ariaHidden />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-mugen-crimson to-transparent glow-crimson" />
    </section>
  )
}
