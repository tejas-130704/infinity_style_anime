'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ZenitsuLoaderProps {
  isLoading: boolean
  children: React.ReactNode
}

const IMAGE_URL =
  "https://customer-assets.emergentagent.com/job_sculpture-shop-1/artifacts/rytzoe31_Zenitsu-PNG.png"

const SMOKE_SEEDS = [
  { delay: 0.4, duration: 9.2, x: 30, y: -20, scale: 0.9, opacity: 0.5 },
  { delay: 1.1, duration: 10.5, x: -40, y: 25, scale: 1.05, opacity: 0.4 },
  { delay: 0.7, duration: 8.8, x: 20, y: -35, scale: 0.85, opacity: 0.55 },
  { delay: 1.8, duration: 11.2, x: -25, y: 40, scale: 1.0, opacity: 0.35 },
  { delay: 0.3, duration: 9.7, x: 45, y: -15, scale: 0.95, opacity: 0.45 },
]

// 🔥 Reduced particles
const SMOKE_PARTICLES = SMOKE_SEEDS.slice(0, 5).map((s, i) => ({ id: i, ...s }))

export default function ZenitsuLoader({ isLoading, children }: ZenitsuLoaderProps) {
  const [showLoader, setShowLoader] = useState(true)
  const [exitAnimation, setExitAnimation] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // ✅ Detect mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // ✅ Preload image (fix delay)
  useEffect(() => {
    const img = new window.Image()
    img.src = IMAGE_URL
  }, [])

  useEffect(() => {
    if (!isLoading) {
      setExitAnimation(true)
      setTimeout(() => setShowLoader(false), 600) // faster exit
    }
  }, [isLoading])

  if (!showLoader) return <>{children}</>

  return (
    <div className="relative w-full h-full">

      <AnimatePresence mode="wait">
        {showLoader && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />

            {/* 🔥 Smoke (disabled on mobile) */}
            {!isMobile && (
              <div className="absolute inset-0 overflow-hidden">
                {SMOKE_PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute w-[400px] h-[400px] rounded-full"
                    style={{
                      background: `radial-gradient(circle, rgba(255,200,0,${p.opacity}) 0%, transparent 70%)`,
                      filter: 'blur(50px)',
                      left: `${20 + (p.id % 3) * 25}%`,
                      top: `${20 + Math.floor(p.id / 3) * 30}%`,
                    }}
                    animate={
                      exitAnimation
                        ? { opacity: 0, y: -150, scale: 0.6 }
                        : {
                            x: [p.x, -p.x, p.x],
                            y: [p.y, -p.y * 0.5, p.y],
                            scale: [p.scale, p.scale * 1.08, p.scale],
                            opacity: [p.opacity, p.opacity * 0.7, p.opacity],
                          }
                    }
                    transition={
                      exitAnimation
                        ? { duration: 0.6 }
                        : {
                            duration: p.duration,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut',
                            delay: p.delay,
                          }
                    }
                  />
                ))}
              </div>
            )}

            {/* Stable Glow Background */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(255,180,0,0.15), transparent 60%)',
                filter: 'blur(100px)',
              }}
              animate={
                exitAnimation
                  ? { opacity: 0 }
                  : {
                      scale: [1, 1.08, 1],
                      opacity: [0.3, 0.4, 0.3],
                    }
              }
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Character */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={exitAnimation ? { x: '-30vw' } : { x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative h-[min(65vw,360px)] w-[min(65vw,360px)]">
                <Image
                  src={IMAGE_URL}
                  alt="Zenitsu"
                  width={360}
                  height={360}
                  className="object-contain drop-shadow-[0_0_25px_rgba(255,200,0,0.6)]"
                  priority
                />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              className="absolute bottom-16 w-full text-center"
              animate={
                exitAnimation
                  ? { opacity: 0 }
                  : { opacity: [0.6, 1, 0.6] }
              }
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <p className="text-yellow-400 text-lg font-bold tracking-widest">
                THUNDER BREATHING
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: 80 }}
        animate={exitAnimation ? { opacity: 1, x: 0 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  )
}