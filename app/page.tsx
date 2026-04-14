'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/HeroSection'

const LoadingAnimation = dynamic(
  () => import('@/components/LoadingAnimation').then((m) => ({ default: m.LoadingAnimation })),
  { ssr: false, loading: () => <div className="min-h-screen bg-black" aria-hidden /> },
)

const ProductShowcase = dynamic(
  () => import('@/components/ProductShowcase').then((m) => ({ default: m.ProductShowcase })),
  {
    loading: () => (
      <section className="min-h-[50vh] flex items-center justify-center bg-mugen-black" aria-hidden>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </section>
    ),
  },
)

const ValueProposition = dynamic(
  () => import('@/components/ValueProposition').then((m) => ({ default: m.ValueProposition })),
  { loading: () => <section className="min-h-[40vh] bg-black" aria-hidden /> },
)

const FeaturedCollections = dynamic(
  () => import('@/components/FeaturedCollections').then((m) => ({ default: m.FeaturedCollections })),
  { loading: () => <section className="min-h-[24vh] bg-black" aria-hidden /> },
)

export default function Home() {
  const [loadingAnimationShown, setLoadingAnimationShown] = useState(false)

  useEffect(() => {
    const hasSeenLoadingAnimation = sessionStorage.getItem('mugenDripLoadingShown')
    if (hasSeenLoadingAnimation) {
      setLoadingAnimationShown(true)
    }
  }, [])

  const handleLoadingComplete = () => {
    sessionStorage.setItem('mugenDripLoadingShown', 'true')
    setLoadingAnimationShown(true)
  }

  return (
    <main className="bg-black text-mugen-white">
      <LoadingAnimation
        onComplete={handleLoadingComplete}
        isSkipped={loadingAnimationShown}
      />

      <div className="relative">
        <HeroSection />
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="mt-12 md:mt-20">
        <ProductShowcase />
      </div>

      <div className="mt-12 md:mt-20">
        <ValueProposition />
      </div>

      <FeaturedCollections />
    </main>
  )
}