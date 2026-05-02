'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface VerificationResultProps {
  success: boolean
  errorMessage?: string
  onRetry?: () => void
}

export function VerificationResult({
  success,
  errorMessage,
  onRetry,
}: VerificationResultProps) {
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="px-5 pb-5"
      >
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-start gap-3">
          <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-300">Student Verified Successfully!</p>
            <p className="text-sm text-green-400/80 mt-1">
              Spin the wheel below to win a free product added to your order.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="px-5 pb-5 space-y-3"
    >
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 flex items-start gap-3">
        <XCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-300">Verification Failed</p>
          <p className="text-sm text-red-400/80 mt-1">
            {errorMessage || 'Upload a clear photo of your valid college / university ID card.'}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again with a different image
        </button>
      )}
    </motion.div>
  )
}
