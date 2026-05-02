'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StudentCheckbox } from './StudentCheckbox'
import { StudentForm } from './StudentForm'
import { VerificationResult } from './VerificationResult'
import { SpinWheel } from './SpinWheel'
import { RewardDisplay } from './RewardDisplay'
import { CelebrationOverlay } from './CelebrationOverlay'

interface RewardProduct {
  id: string
  name: string
  image_url: string | null
  price: number
  original_price?: number | null
  slug?: string | null
}

interface StudentVerificationProps {
  onRewardWon: (product: RewardProduct) => void
  contextId?: string
}

type VerifyState = 'idle' | 'form' | 'verified' | 'failed'
type SpinState = 'idle' | 'loading' | 'ready' | 'won' | 'failed'

export function StudentVerification({ onRewardWon, contextId }: StudentVerificationProps) {
  const [isStudent, setIsStudent] = useState(false)
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [spinState, setSpinState] = useState<SpinState>('idle')
  const [failError, setFailError] = useState('')

  // Spin wheel data (from server)
  const [wheelSegments, setWheelSegments] = useState<RewardProduct[]>([])
  const [chosenIndex, setChosenIndex] = useState(0)
  const [wonProduct, setWonProduct] = useState<RewardProduct | null>(null)

  const [showCelebration, setShowCelebration] = useState(false)
  const [rewardAdded, setRewardAdded] = useState(false)
  const [statusLoaded, setStatusLoaded] = useState(false)

  // ── Check existing status on mount ──────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/student/status')
        if (!res.ok) { setStatusLoaded(true); return }
        const data = await res.json()

        if (data.studentVerified) {
          setIsStudent(true)
          setVerifyState('verified')

          // Check local storage for spin state
          const storageKeyReward = contextId ? `spinReward_${contextId}` : 'spinReward'
          const storageKeyUsed = contextId ? `spinUsed_${contextId}` : 'spinUsed'

          const storedReward = localStorage.getItem(storageKeyReward)
          const spinUsed = localStorage.getItem(storageKeyUsed) === 'true'

          if (spinUsed && storedReward) {
            try {
              const parsedReward = JSON.parse(storedReward)
              setWonProduct(parsedReward)
              setSpinState('won')
              setRewardAdded(true)
              // Auto-inject existing reward into parent
              onRewardWon(parsedReward)
            } catch (e) {
              setSpinState('idle')
            }
          } else {
            setSpinState('idle')
          }
        }
      } catch {
        // Silent
      } finally {
        setStatusLoaded(true)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Prefetch spin data from server when spin section becomes visible ────────
  const prefetchSpin = useCallback(async () => {
    if (spinState !== 'idle') return
    setSpinState('loading')
    try {
      const res = await fetch('/api/student/spin', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setSpinState('failed'); return }

      const segments: RewardProduct[] = data.wheelSegments ?? []
      const idx: number = data.chosenIndex ?? 0
      const reward: RewardProduct = data.reward

      setWheelSegments(segments.length > 0 ? segments : [reward])
      setChosenIndex(idx)
      setWonProduct(reward)
      setSpinState('ready')
    } catch {
      setSpinState('failed')
    }
  }, [spinState])

  useEffect(() => {
    if (verifyState === 'verified' && spinState === 'idle') {
      prefetchSpin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyState, spinState])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCheckboxChange = (checked: boolean) => {
    setIsStudent(checked)
    if (checked && verifyState === 'idle') setVerifyState('form')
  }

  const handleVerified = () => {
    setVerifyState('verified')
    setSpinState('idle') // will trigger prefetchSpin via effect
  }

  const handleFailed = (error: string) => {
    setVerifyState('failed')
    setFailError(error)
  }

  const handleRetry = () => {
    setVerifyState('form')
    setFailError('')
  }

  const handleSpinComplete = () => {
    setSpinState('won')
    setShowCelebration(true)
    if (wonProduct) {
      const storageKeyReward = contextId ? `spinReward_${contextId}` : 'spinReward'
      const storageKeyUsed = contextId ? `spinUsed_${contextId}` : 'spinUsed'

      localStorage.setItem(storageKeyUsed, 'true')
      localStorage.setItem(storageKeyReward, JSON.stringify(wonProduct))
      onRewardWon(wonProduct)
    }
  }

  const handleAddRewardToCart = () => {
    if (!wonProduct || rewardAdded) return
    setRewardAdded(true)
    onRewardWon(wonProduct)
  }

  if (!statusLoaded) return null

  const showForm = isStudent && verifyState === 'form'
  const showFailed = isStudent && verifyState === 'failed'
  const showVerified = verifyState === 'verified'
  const showSpinLoading = showVerified && spinState === 'loading'
  const showSpinWheel = showVerified && spinState === 'ready' && wheelSegments.length > 0
  const showReward = showVerified && spinState === 'won' && wonProduct != null

  return (
    <>
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay onDone={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>

      <div className="relative rounded-2xl border border-violet-500/50 bg-gradient-to-b from-violet-900/60 via-[#0A0A0A]/90 to-black backdrop-blur-md overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700/25 via-transparent to-transparent pointer-events-none" />
        {/* Checkbox toggle */}
        <StudentCheckbox
          checked={isStudent}
          onChange={handleCheckboxChange}
          disabled={verifyState === 'verified'}
        />

        {/* Expandable area */}
        <AnimatePresence initial={false}>
          {isStudent && (
            <motion.div
              key="student-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              {/* Form */}
              <AnimatePresence mode="wait">
                {showForm && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <StudentForm onVerified={handleVerified} onFailed={handleFailed} />
                  </motion.div>
                )}

                {showFailed && (
                  <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <VerificationResult success={false} errorMessage={failError} onRetry={handleRetry} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* After verification */}
              {showVerified && (
                <div>
                  <VerificationResult success={true} />

                  {/* Loading segments */}
                  {showSpinLoading && (
                    <div className="px-5 pb-5">
                      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-4 text-sm text-violet-300 text-center relative z-10">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent mr-2 align-middle" />
                        Preparing your spin wheel…
                      </div>
                    </div>
                  )}

                  {/* Spin wheel */}
                  {showSpinWheel && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="border-t border-violet-500/30 bg-gradient-to-b from-violet-950/40 to-transparent relative z-10"
                    >
                      <SpinWheel
                        segments={wheelSegments}
                        chosenIndex={chosenIndex}
                        onSpinComplete={handleSpinComplete}
                      />
                    </motion.div>
                  )}

                  {/* Reward */}
                  {showReward && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <RewardDisplay product={wonProduct!} onAddToCart={handleAddRewardToCart} />
                      {rewardAdded && (
                        <p className="text-center text-xs text-green-400 pb-4 -mt-2">
                          ✓ Reward added to your order!
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
