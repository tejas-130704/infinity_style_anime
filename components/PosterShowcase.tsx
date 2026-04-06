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
      className="perspective-1200 flex-shrink-0"
      style={{
        width: '280px',
        transform: `
          perspective(1200px)
          rotateX(${tilt.x}deg)
          rotateY(${tilt.y}deg)
        `,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div
        className="group relative w-full h-96 rounded-xl overflow-hidden bg-mugen-black
          transition-[box-shadow,transform] duration-300 ease-out
          hover:shadow-[0_0_36px_rgba(255,211,77,0.42),0_0_72px_rgba(202,164,0,0.12)]
          hover:-translate-y-0.5"
        data-aos="zoom-in-up"
        data-aos-duration="750"
        data-aos-delay={index * 60}
      >
        <div className="absolute inset-0 p-2">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="280px"
            className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
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

    const scrollAmount = 300
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateScrollButtons = () => {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }

    container.addEventListener('scroll', updateScrollButtons)
    updateScrollButtons()

    return () => container.removeEventListener('scroll', updateScrollButtons)
  }, [posters.length])

  return (
    <section className="relative py-20 md:py-28 lg:py-36 bg-gradient-to-b from-mugen-black to-mugen-dark">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div
          className="mb-12 md:mb-16"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <SectionTitle
            title="Official Drops"
            japaneseSubtitle="公式コレクション"
            subtitle="Limited edition posters and collectibles"
          />
        </div>

        {/* Poster Carousel */}
        <div
          className="relative group"
          data-aos="fade-up"
          data-aos-duration="850"
          data-aos-delay="100"
        >
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 md:pb-6 [scrollbar-width:none] [-ms-overflow-style:none]"
            style={{ scrollBehavior: 'smooth' }}
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

          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-0 top-1/3 -translate-y-1/2 z-20 bg-mugen-black/80 text-mugen-gold p-3 rounded-full cursor-pointer
                transition-all duration-300 ease-out glow-gold
                hover:bg-mugen-black hover:scale-110 hover:shadow-[0_0_26px_rgba(255,211,77,0.55)] active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-0 top-1/3 -translate-y-1/2 z-20 bg-mugen-black/80 text-mugen-gold p-3 rounded-full cursor-pointer
                transition-all duration-300 ease-out glow-gold
                hover:bg-mugen-black hover:scale-110 hover:shadow-[0_0_26px_rgba(255,211,77,0.55)] active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
