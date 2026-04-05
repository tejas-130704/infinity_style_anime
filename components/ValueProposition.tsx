'use client'

import { Zap, Package, Shield, Star } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { SectionTitle } from './SectionTitle'

interface CardProps {
  icon: React.ComponentType<{ size: number }>
  title: string
  description: string
  index: number
}

const ValueCard = ({ icon: Icon, title, description, index }: CardProps) => {
  return (
    <div
      data-aos="fade-up"
      data-aos-duration="800"
      data-aos-delay={index * 100}
    >
      <GlassCard strength="strong">
        <div className="flex flex-col gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-mugen-crimson to-mugen-gold flex items-center justify-center">
            <Icon size={24} className="text-mugen-white" />
          </div>
          <h3 className="font-cinzel text-xl font-extrabold heading-stroke-md">
            {title}
          </h3>
          <p className="font-sans text-sm text-white/90 font-medium leading-relaxed">
            {description}
          </p>
        </div>
      </GlassCard>
    </div>
  )
}

export function ValueProposition() {
  const cards = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Premium drops released weekly with instant inventory updates and real-time stock notifications for collectors.',
    },
    {
      icon: Package,
      title: 'Premium Quality',
      description:
        'High-grade materials sourced globally. Every piece undergoes rigorous QC testing before shipment.',
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description:
        'Bank-level encryption, insured shipments, and hassle-free returns within 30 days.',
    },
    {
      icon: Star,
      title: 'Exclusive Access',
      description:
        'VIP members get early access to limited drops, exclusive designs, and special pricing.',
    },
  ]

  return (
    <section className="relative py-20 md:py-32 lg:py-40 bg-mugen-black">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-16 md:mb-24 text-left" data-aos="fade-up" data-aos-duration="800">
          <SectionTitle
            title="Why Choose Infinity Style"
            japaneseSubtitle="インフィニティスタイルを選ぶ理由"
            subtitle="Experience premium anime merchandise like never before"
          />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <ValueCard
              key={card.title}
              {...card}
              index={index}
            />
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-0 w-64 h-64 bg-mugen-crimson/10 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-mugen-gold/5 rounded-full blur-3xl opacity-20" />
      </div>
    </section>
  )
}
