'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/HeroSection'

const LoadingAnimation = dynamic(
  () => import('@/components/LoadingAnimation').then((m) => ({ default: m.LoadingAnimation })),
  { ssr: false, loading: () => <div className="min-h-screen bg-black" aria-hidden /> },
)

const ValueProposition = dynamic(
  () => import('@/components/ValueProposition').then((m) => ({ default: m.ValueProposition })),
  { loading: () => <section className="min-h-[40vh] bg-black" aria-hidden /> },
)

const PosterShowcase = dynamic(
  () => import('@/components/PosterShowcase').then((m) => ({ default: m.PosterShowcase })),
  { loading: () => <section className="min-h-[30vh] bg-black" aria-hidden /> },
)

const FeaturedCollections = dynamic(
  () => import('@/components/FeaturedCollections').then((m) => ({ default: m.FeaturedCollections })),
  { loading: () => <section className="min-h-[24vh] bg-black" aria-hidden /> },
)

export default function Home() {
  const [loadingAnimationShown, setLoadingAnimationShown] = useState(false)

  useEffect(() => {
    const hasSeenLoadingAnimation = sessionStorage.getItem(
      'mugenDripLoadingShown'
    )
    if (hasSeenLoadingAnimation) {
      setLoadingAnimationShown(true)
    }
  }, [])

  const handleLoadingComplete = () => {
    sessionStorage.setItem('mugenDripLoadingShown', 'true')
    setLoadingAnimationShown(true)
  }

  return (
    <main className="bg-black text-mugen-white overflow-hidden">
      {/* Loading Animation - Shows only once per session */}
      <LoadingAnimation
        onComplete={handleLoadingComplete}
        isSkipped={loadingAnimationShown}
      />

      {/* Main Content */}
      <HeroSection />
      <ValueProposition />
      <PosterShowcase />
      {/* <ThreeDModelViewer /> */}  {/* Meet the Characters — commented out */}
      <FeaturedCollections />
    </main>
  )
}
