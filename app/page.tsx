'use client'

import { useEffect, useState } from 'react'
import { LoadingAnimation } from '@/components/LoadingAnimation'
import { HeroSection } from '@/components/HeroSection'
import { ValueProposition } from '@/components/ValueProposition'
import { PosterShowcase } from '@/components/PosterShowcase'
// import { ThreeDModelViewer } from '@/components/ThreeDModelViewer'  // "Meet the Characters" — commented out
// import { CustomOrderForm } from '@/components/CustomOrderForm'       // "Design Your Legend"  — removed
import { FeaturedCollections } from '@/components/FeaturedCollections'

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
