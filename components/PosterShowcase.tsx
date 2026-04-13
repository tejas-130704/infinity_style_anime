'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionTitle } from './SectionTitle'

/** Posters in public/assests/poster — paths match filenames (incl. typo loffy.jpg). */
const POSTER_ITEMS = [
  { id: 1, src: '/assests/poster/loffy.jpg', alt: 'Monkey D. Luffy poster' },
  { id: 2, src: '/assests/poster/luffy3.jpg', alt: 'Monkey D. Luffy poster artwork' },
  { id: 3, src: '/assests/poster/zoro.jpg', alt: 'Roronoa Zoro poster' },
  { id: 4, src: '/assests/poster/zoro1.png', alt: 'Roronoa Zoro poster artwork' },
  { id: 5, src: '/assests/poster/zoro3.jpg', alt: 'Roronoa Zoro alternate poster' },
  { id: 6, src: '/assests/poster/naruto.jpg', alt: 'Naruto Uzumaki poster' },
  { id: 7, src: '/assests/poster/naruto2.jpg', alt: 'Naruto Uzumaki poster artwork' },
  { id: 8, src: '/assests/poster/59190d06bf7cf9dd960890942a1d094f.jpg', alt: 'Infinity Style exclusive anime poster' },
  { id: 9, src: '/assests/poster/649979948a46121e53349c791d4e2a83.jpg', alt: 'Infinity Style exclusive anime poster variant' },
] as const

interface PosterCardProps {
  src: string
  alt: string
  index: number
}

const PosterCard = ({ src, alt, index }: PosterCardProps) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotationX = ((y - centerY) / centerY) * 15
    const rotationY = ((centerX - x) / centerX) * 15

    setTilt({ x: rotationX, y: rotationY })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1200 w-[min(78vw,280px)] shrink-0 snap-center sm:w-64 md:w-72"
      style={{
        transform: `
          perspective(1200px)
          rotateX(${tilt.x}deg)
          rotateY(${tilt.y}deg)
        `,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div
        className="group relative h-[min(52vw,22rem)] w-full overflow-hidden rounded-xl bg-mugen-black transition-[box-shadow,transform] duration-300 ease-out sm:h-96
          hover:shadow-[0_0_36px_rgba(255,211,77,0.42),0_0_72px_rgba(202,164,0,0.12)]
          md:hover:-translate-y-0.5 active:scale-[0.99] md:active:scale-100"
        data-aos="zoom-in-up"
        data-aos-duration="750"
        data-aos-delay={index * 60}
      >
        <div className="absolute inset-0 p-2">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 256px, 288px"
            className="object-contain object-center transition-transform duration-500 ease-out md:group-hover:scale-[1.02]"
          />
        </div>
      </div>
    </div>
  )
}

export function PosterShowcase() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const posters = POSTER_ITEMS

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const amount = Math.min(320, scrollContainerRef.current.clientWidth * 0.85)
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateScrollButtons = () => {
      setCanScrollLeft(container.scrollLeft > 4)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }

    container.addEventListener('scroll', updateScrollButtons, { passive: true })
    updateScrollButtons()
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [posters.length])

  return (
    <section className="relative overflow-x-hidden bg-gradient-to-b from-mugen-black to-mugen-dark py-16 md:py-28 lg:py-36">
      <div className="page-gutter">
        {/* Section Header */}
        <div
          className="mb-10 md:mb-16"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <SectionTitle
            title="Official Drops"
            japaneseSubtitle="公式コレクション"
            subtitle="Limited edition posters and collectibles — swipe or use arrows to explore"
          />
        </div>

        {/* Premium poster rail */}
        <div
          className="relative -mx-4 sm:mx-0"
          data-aos="fade-up"
          data-aos-duration="850"
          data-aos-delay="100"
        >
          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 pl-4 pr-4 sm:gap-6 sm:pl-0 sm:pr-0 md:pb-6"
          >
            {posters.map((poster, index) => (
              <PosterCard
                key={poster.id}
                src={poster.src}
                alt={poster.alt}
                index={index}
              />
            ))}
          </div>

          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="tap-target absolute left-1 top-[38%] z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-mugen-black/85 text-mugen-gold shadow-lg backdrop-blur-md transition-all duration-300 ease-out glow-gold hover:bg-mugen-black hover:shadow-[0_0_26px_rgba(255,211,77,0.55)] active:scale-95 sm:left-0 sm:flex"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="tap-target absolute right-1 top-[38%] z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-mugen-black/85 text-mugen-gold shadow-lg backdrop-blur-md transition-all duration-300 ease-out glow-gold hover:bg-mugen-black hover:shadow-[0_0_26px_rgba(255,211,77,0.55)] active:scale-95 sm:right-0 sm:flex"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
