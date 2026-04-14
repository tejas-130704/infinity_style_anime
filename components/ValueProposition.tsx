'use client'

import { useState } from 'react'
import { Zap, Package, Shield, Star } from 'lucide-react'
import { SectionTitle } from './SectionTitle'

const cards = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    tag: 'Weekly Drops',
    description:
      'Premium drops released every week with instant inventory updates and real-time stock notifications for collectors.',
    accent: '#863841',
    glowRgb: '134,56,65',
    border: 'rgba(134,56,65,0.4)',
    tagBg: '#863841',
    tagText: '#fff',
    gradFrom: 'rgba(127,29,29,0.35)',
  },
  {
    icon: Package,
    title: 'Premium Quality',
    tag: 'Guaranteed',
    description:
      'High-grade materials sourced globally. Every piece undergoes rigorous QC testing before shipment to you.',
    accent: '#c6a86c',
    glowRgb: '198,168,108',
    border: 'rgba(198,168,108,0.4)',
    tagBg: '#c6a86c',
    tagText: '#000',
    gradFrom: 'rgba(120,90,25,0.35)',
  },
  {
    icon: Shield,
    title: 'Secure & Safe',
    tag: 'Protected',
    description:
      'Bank-level encryption and careful packaging so your order reaches you safely.',
    accent: '#7C3AED',
    glowRgb: '124,58,237',
    border: 'rgba(124,58,237,0.4)',
    tagBg: '#7C3AED',
    tagText: '#fff',
    gradFrom: 'rgba(76,29,149,0.35)',
  },
  {
    icon: Star,
    title: 'Exclusive Access',
    tag: 'VIP Members',
    description:
      'VIP members get early access to limited drops, exclusive designs, and special member-only pricing.',
    accent: '#06B6D4',
    glowRgb: '6,182,212',
    border: 'rgba(6,182,212,0.4)',
    tagBg: '#06B6D4',
    tagText: '#fff',
    gradFrom: 'rgba(15, 154, 189, 0.42)',
  },
]

export function ValueProposition() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="relative py-20 md:py-28 lg:py-36 bg-mugen-black overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-mugen-crimson/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-mugen-gold/5 rounded-full blur-[80px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mugen-crimson/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <div className="mb-12 md:mb-16 text-left" data-aos="fade-up" data-aos-duration="800">
          <SectionTitle
            title="Why Choose Infinity Style"
            japaneseSubtitle="インフィニティスタイルを選ぶ理由"
            subtitle="Experience premium anime merchandise like never before"
          />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon
            const isHovered = hoveredIndex === index
            return (
              <div
                key={card.title}
                className="group relative cursor-default"
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay={index * 80}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="relative h-full min-h-[260px] rounded-2xl overflow-hidden flex flex-col transition-all duration-500 ease-out sm:min-h-[280px] md:min-h-[280px]"
                  style={{
                    background: `linear-gradient(to bottom, ${card.gradFrom}, rgba(42,38,36,0.85) 60%, #22201f)`,
                    border: `1px solid ${card.border}`,
                    boxShadow: isHovered ? `0 0 55px rgba(${card.glowRgb},0.45)` : 'none',
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  }}
                >
                  {/* Shimmer sweep */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 transition-all duration-700 ease-out md:group-hover:translate-x-[350%] md:group-hover:opacity-100"
                  />

                  <div className="relative z-10 flex flex-col flex-1 p-6">
                    {/* Tag + Icon row */}
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                        style={{ backgroundColor: card.tagBg, color: card.tagText }}
                      >
                        {card.tag}
                      </span>
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${card.accent}22`,
                          border: `1px solid ${card.accent}55`,
                        }}
                      >
                        <Icon size={20} style={{ color: card.accent }} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-cinzel text-2xl font-extrabold text-white mb-2 leading-snug [text-shadow:0_2px_20px_rgba(0,0,0,0.8)]">
                      {card.title}
                    </h3>

                    {/* Accent underline */}
                    <div
                      className="h-0.5 w-10 rounded-full mb-4 transition-all duration-300"
                      style={{
                        backgroundColor: card.accent,
                        width: isHovered ? '3.5rem' : '2.5rem',
                      }}
                    />

                    {/* Description */}
                    <p className="font-sans text-sm text-white/75 leading-relaxed flex-1">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
