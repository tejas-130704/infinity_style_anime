'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SectionTitle } from './SectionTitle'
import { GlowButton } from './GlowButton'
import { Flame, Star, Zap, Crown, ArrowRight } from 'lucide-react'

const collections = [
  {
    id: 'limited',
    tag: 'Limited Drop',
    tagIcon: Flame,
    title: 'Shadow\nArcs',
    subtitle: 'Dark & Mystic Edition',
    description:
      'Ultra-rare pieces inspired by the most iconic antagonists of all time. Each item numbered and hand-finished.',
    color: 'from-red-900/80 via-mugen-dark/90 to-mugen-black',
    accent: '#863841',
    glow: 'shadow-[0_0_60px_rgba(134,56,65,0.5)]',
    border: 'border-mugen-crimson/50',
    tagColor: 'bg-mugen-crimson text-white',
    items: '12 items',
    badge: '🔥 SOLD OUT SOON',
    gradient: 'bg-gradient-to-br from-red-800/30 via-transparent to-transparent',
  },
  {
    id: 'exclusive',
    tag: 'VIP Exclusive',
    tagIcon: Crown,
    title: 'Golden\nSage',
    subtitle: 'Premium Gold Series',
    description:
      'Gold-foil printed merchandise with premium DTF coating. Inspired by legendary sage-mode power-ups.',
    color: 'from-yellow-900/60 via-mugen-dark/90 to-mugen-black',
    accent: '#D4AF37',
    glow: 'shadow-[0_0_60px_rgba(255,211,77,0.4)]',
    border: 'border-mugen-gold/50',
    tagColor: 'bg-mugen-gold text-black',
    items: '8 items',
    badge: '⭐ NEW ARRIVAL',
    gradient: 'bg-gradient-to-br from-yellow-700/25 via-transparent to-transparent',
  },
  {
    id: 'bestseller',
    tag: 'Best Seller',
    tagIcon: Star,
    title: 'Void\nKings',
    subtitle: 'Fan Favourite Collection',
    description:
      'The fan-voted #1 collection of the year. Street-style hoodies, tees, and oversized drops.',
    color: 'from-violet-900/60 via-mugen-dark/90 to-mugen-black',
    accent: '#7C3AED',
    glow: 'shadow-[0_0_60px_rgba(124,58,237,0.45)]',
    border: 'border-violet-500/50',
    tagColor: 'bg-violet-600 text-white',
    items: '24 items',
    badge: '🏆 #1 RANKED',
    gradient: 'bg-gradient-to-br from-violet-700/25 via-transparent to-transparent',
  },
  {
    id: 'new',
    tag: 'Just Dropped',
    tagIcon: Zap,
    title: 'Infinity\nSurge',
    subtitle: 'Latest Release',
    description:
      'Fresh off our design studio — electric, bold, and ready to make a statement wherever you go.',
    color: 'from-cyan-900/60 via-mugen-dark/90 to-mugen-black',
    accent: '#06B6D4',
    glow: 'shadow-[0_0_60px_rgba(6,182,212,0.4)]',
    border: 'border-cyan-500/50',
    tagColor: 'bg-cyan-600 text-white',
    items: '18 items',
    badge: '⚡ JUST LAUNCHED',
    gradient: 'bg-gradient-to-br from-cyan-700/25 via-transparent to-transparent',
  },
]

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '500+', label: 'Unique Designs' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '72h', label: 'Fast Dispatch' },
]

export function FeaturedCollections() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <section className="relative py-20 md:py-32 lg:py-40 bg-mugen-black overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-mugen-crimson/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-mugen-gold/5 rounded-full blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mugen-crimson/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Heading */}
        <div className="mb-16 md:mb-20 text-left" data-aos="fade-up" data-aos-duration="800">
          <SectionTitle
            title="Featured Collections"
            japaneseSubtitle="フィーチャードコレクション"
            subtitle="Handpicked drops — designed for those who live the story"
          />
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {collections.map((col, i) => {
            const TagIcon = col.tagIcon
            const isHovered = hovered === col.id
            return (
              <div
                key={col.id}
                className="group relative cursor-pointer"
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay={i * 80}
                onMouseEnter={() => setHovered(col.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <Link href={`/shop?collection=${col.id}`} className="block h-full">
                  <div
                    className={`relative h-full min-h-80 sm:min-h-[360px] rounded-2xl border overflow-hidden flex flex-col transition-all duration-500 ease-out
                      bg-gradient-to-b ${col.color}
                      ${col.border}
                      ${isHovered ? `${col.glow} md:-translate-y-2 md:scale-[1.02]` : 'md:hover:-translate-y-1'}
                      active:scale-[0.99] md:active:scale-100
                    `}
                  >
                    {/* Inner gradient overlay */}
                    <div className={`absolute inset-0 ${col.gradient} opacity-0 transition-opacity duration-500 md:group-hover:opacity-100`} />

                    {/* Shimmer sweep on hover */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 transition-all duration-700 ease-out md:group-hover:translate-x-[350%] md:group-hover:opacity-100"
                    />

                    {/* Card content */}
                    <div className="relative z-10 flex flex-col flex-1 p-6">
                      {/* Tag */}
                      <div className="flex items-center justify-between mb-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${col.tagColor}`}>
                          <TagIcon size={10} />
                          {col.tag}
                        </span>
                        <span className="text-xs text-white/60 font-medium">{col.items}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-white leading-snug mb-2 whitespace-pre-line [text-shadow:0_2px_20px_rgba(0,0,0,0.8)]">
                        {col.title}
                      </h3>

                      {/* Subtitle */}
                      <p className="font-sans text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: col.accent }}>
                        {col.subtitle}
                      </p>

                      {/* Description */}
                      <p className="font-sans text-sm text-white/80 leading-relaxed flex-1">
                        {col.description}
                      </p>

                      {/* CTA */}
                      <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{col.badge}</span>
                        <span
                          className="flex items-center gap-1.5 text-sm font-bold transition-all duration-300 group-hover:gap-2.5"
                          style={{ color: col.accent }}
                        >
                          Shop <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Stats Bar */}
        <div
          className="mt-20 md:mt-28 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 divide-x-0 md:divide-x divide-white/10"
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-delay="150"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 py-6 px-4">
              <span className="font-cinzel text-3xl md:text-4xl font-extrabold text-mugen-gold [text-shadow:0_0_30px_rgba(255,211,77,0.4)]">
                {stat.value}
              </span>
              <span className="font-sans text-sm text-white/70 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Strip */}
        <div
          className="mt-14 md:mt-20 flex flex-col sm:flex-row items-center justify-center gap-5 text-center"
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-delay="200"
        >
          <p className="font-cinzel text-xl md:text-2xl font-bold text-white">
            Ready to wear your arc?
          </p>
          <Link href="/shop">
            <GlowButton size="lg">
              Explore All Collections
            </GlowButton>
          </Link>
        </div>
      </div>
    </section>
  )
}
