'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
}

const CONFETTI_COLORS = [
  '#a855f7', '#7c3aed', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#f97316', '#06b6d4',
]

export function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const particles = useRef<Particle[]>([])
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Spawn 200 confetti particles
    for (let i = 0; i < 200; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        life: 1,
        maxLife: 160 + Math.random() * 80,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 6,
      })
    }

    startTimeRef.current = performance.now()

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let allDead = true
      particles.current.forEach((p) => {
        if (p.life <= 0) return
        allDead = false

        p.x += p.vx
        p.y += p.vy
        p.vy += 0.06 // gravity
        p.rotation += p.rotationSpeed
        p.life -= 1 / p.maxLife

        ctx.save()
        ctx.globalAlpha = Math.min(p.life * 3, 1)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      })

      if (!allDead) {
        rafRef.current = requestAnimationFrame(render)
      }
    }

    rafRef.current = requestAnimationFrame(render)

    const timer = setTimeout(onDone, 3200)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] pointer-events-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </motion.div>
  )
}
