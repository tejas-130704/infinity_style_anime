'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Segment {
  id: string
  name: string
  image_url: string | null
  video_url?: string | null
  images?: string[]
}

interface SpinWheelProps {
  segments: Segment[]
  /** Zero-based index the server chose */
  chosenIndex: number
  onSpinComplete: (reward: Segment) => void
}

const COLORS = [
  '#7c3aed', // violet-700
  '#a855f7', // purple-500
  '#6d28d9', // violet-800
  '#9333ea', // purple-600
  '#5b21b6', // violet-900
  '#c084fc', // purple-400
]

export function SpinWheel({ segments, chosenIndex, onSpinComplete }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [spun, setSpun] = useState(false)
  const rotationRef = useRef(0)
  const rafRef = useRef<number>(0)
  
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const loadedImages = useRef<Record<string, HTMLImageElement>>({})

  const count = segments.length
  const arc = count > 0 ? (2 * Math.PI) / count : 0

  useEffect(() => {
    let loadedCount = 0
    const total = segments.filter(s => s.image_url).length
    if (total === 0) {
      setImagesLoaded(true)
      return
    }

    segments.forEach(segment => {
      if (segment.image_url) {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.src = segment.image_url
        img.onload = () => {
          loadedImages.current[segment.id] = img
          loadedCount++
          if (loadedCount === total) setImagesLoaded(true)
        }
        img.onerror = () => {
          loadedCount++
          if (loadedCount === total) setImagesLoaded(true)
        }
      }
    })
  }, [segments])

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const cx = W / 2
    const cy = W / 2
    const radius = W / 2 - 8

    ctx.clearRect(0, 0, W, W)

    if (count === 0) return

    // Outer glow ring
    ctx.save()
    ctx.shadowColor = '#a855f7'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(168,85,247,0.2)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()

    for (let i = 0; i < count; i++) {
      const startAngle = rotation + i * arc
      const endAngle = startAngle + arc

      // Segment fill
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const midAngle = startAngle + arc / 2

      // Image or Text
      const img = segments[i].image_url ? loadedImages.current[segments[i].id] : null
      
      if (img && imagesLoaded) {
        ctx.save()
        
        // Clip to segment
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.clip()

        // Position image center
        const imgDist = radius * 0.65
        const imgX = cx + Math.cos(midAngle) * imgDist
        const imgY = cy + Math.sin(midAngle) * imgDist
        const imgSize = radius * 0.45

        ctx.translate(imgX, imgY)
        ctx.rotate(midAngle + Math.PI / 2) // Orient image

        // Circular clip for the image
        ctx.beginPath()
        ctx.arc(0, 0, imgSize/2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()

        // Draw image
        ctx.drawImage(img, -imgSize/2, -imgSize/2, imgSize, imgSize)

        // Draw inner border over image
        ctx.beginPath()
        ctx.arc(0, 0, imgSize/2, 0, Math.PI * 2)
        ctx.lineWidth = 4
        ctx.strokeStyle = hoveredIndex === i ? '#fbbf24' : '#fff' // yellow-400 on hover
        ctx.stroke()

        ctx.restore()
      } else {
        // Fallback text
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(midAngle)
        ctx.textAlign = 'right'
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.font = 'bold 11px Inter, sans-serif'
        const label = segments[i].name.length > 16
            ? segments[i].name.slice(0, 15) + '…'
            : segments[i].name
        ctx.fillText(label, radius - 12, 4)
        ctx.restore()
      }
    }

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 26, 0, 2 * Math.PI)
    ctx.fillStyle = '#1a0a2e'
    ctx.fill()
    ctx.strokeStyle = 'rgba(168,85,247,0.6)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Center star icon
    ctx.fillStyle = '#c084fc'
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✦', cx, cy)
  }

  // Redraw when interaction changes or images load
  useEffect(() => {
    if (!spinning) {
      drawWheel(rotationRef.current)
    }
  }, [segments, hoveredIndex, imagesLoaded])

  const handleSpin = () => {
    if (spinning || spun || count === 0) return
    setSpinning(true)
    setHoveredIndex(null)

    const segmentAngle = (2 * Math.PI) / count
    const targetAngle = -(chosenIndex * segmentAngle + segmentAngle / 2) - Math.PI / 2

    const fullSpins = (8 + Math.floor(Math.random() * 4)) * 2 * Math.PI
    const finalRotation = fullSpins + targetAngle

    const duration = 5000 // ms
    const startTime = performance.now()
    const startRotation = rotationRef.current

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

    const animate = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = easeOut(t)
      rotationRef.current = startRotation + finalRotation * eased
      drawWheel(rotationRef.current)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setSpun(true)
        setTimeout(() => onSpinComplete(segments[chosenIndex]), 400)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (spinning || spun || count === 0 || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    const distance = Math.sqrt(x*x + y*y)
    const radius = rect.width / 2 - 8
    
    if (distance < 26 || distance > radius + 10) {
      setHoveredIndex(null)
      return
    }
    
    let angle = Math.atan2(y, x)
    if (angle < 0) angle += 2 * Math.PI
    
    const currentRotation = (rotationRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    let normalizedAngle = angle - currentRotation
    if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI
    
    const index = Math.floor(normalizedAngle / arc) % count
    setHoveredIndex(index)
  }

  useEffect(() => {
    if (hoveredIndex !== null) {
      setSlideIndex(0)
      const timer = setInterval(() => {
        setSlideIndex(prev => prev + 1)
      }, 1500)
      return () => clearInterval(timer)
    }
  }, [hoveredIndex])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const hoveredSegment = hoveredIndex !== null ? segments[hoveredIndex] : null
  const hoverImages = hoveredSegment?.images?.length ? hoveredSegment.images : (hoveredSegment?.image_url ? [hoveredSegment.image_url] : [])
  const currentSlideUrl = hoverImages.length > 0 ? hoverImages[slideIndex % hoverImages.length] : null

  return (
    <div className="flex flex-col items-center gap-6 py-6 relative">
      <div>
        <h3 className="text-center text-xl font-bold text-white">🎉 Spin to Win!</h3>
        <p className="text-center text-sm text-white/50 mt-1">
          One spin — one free product added to your order
        </p>
      </div>

      <div className="relative flex items-center justify-center min-h-[300px] w-full pt-[240px]">
        {/* Wheel container */}
        <div className="relative">
          {/* Pointer / arrow at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400" />
          </div>

          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="rounded-full cursor-crosshair"
            style={{ filter: spun ? 'brightness(0.9)' : 'none' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          />

          {/* Hover Preview Card — floats above the canvas */}
          <AnimatePresence>
            {hoveredSegment && !spinning && !spun && (
              <motion.div
                key={hoveredSegment.id}
                initial={{ opacity: 0, y: 8, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.93, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 w-48 sm:w-56 pointer-events-none"
                style={{ filter: 'drop-shadow(0 8px 32px rgba(124,58,237,0.45))' }}
              >
                {/* Card shell */}
                <div className="rounded-2xl border border-violet-500/40 bg-black/90 backdrop-blur-xl overflow-hidden">
                  {/* Slideshow image */}
                  <div className="relative w-full aspect-[4/3] bg-violet-950/40">
                    <AnimatePresence mode="wait">
                      {currentSlideUrl ? (
                        <motion.img
                          key={currentSlideUrl}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          src={currentSlideUrl}
                          alt={hoveredSegment.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Dot indicators */}
                    {hoverImages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {hoverImages.map((_, i) => (
                          <span
                            key={i}
                            className={`block h-1.5 rounded-full transition-all duration-300 ${
                              i === slideIndex % hoverImages.length
                                ? 'w-4 bg-violet-400'
                                : 'w-1.5 bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Top gradient */}
                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/40 to-transparent" />
                  </div>

                  {/* Product name */}
                  <div className="px-3 py-2.5 border-t border-violet-500/20 bg-gradient-to-b from-violet-950/30 to-black/60">
                    <p className="text-center text-xs font-bold text-white leading-snug line-clamp-2">
                      {hoveredSegment.name}
                    </p>
                    <p className="mt-0.5 text-center text-[10px] text-violet-300/70 font-medium tracking-wide uppercase">
                      Free reward
                    </p>
                  </div>
                </div>

                {/* Arrow pointing down */}
                <div className="flex justify-center">
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-violet-500/40" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!spun && (
          <motion.button
            key="spin-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            type="button"
            onClick={handleSpin}
            disabled={spinning || count === 0}
            id="spin-wheel-btn"
            className="relative overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-10 py-3.5 font-bold text-white text-base shadow-lg shadow-purple-900/20 disabled:opacity-70 disabled:cursor-not-allowed hover:from-violet-500 hover:to-purple-500 transition-all duration-200 border border-violet-500/50"
          >
            {spinning ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Spinning…
              </span>
            ) : (
              '✦ SPIN NOW'
            )}
          </motion.button>
        )}

        {spun && (
          <motion.p
            key="spun-msg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-violet-300"
          >
            🎊 You've spun! Revealing your reward…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
