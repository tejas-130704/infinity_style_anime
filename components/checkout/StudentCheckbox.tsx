'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronDown } from 'lucide-react'

interface StudentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function StudentCheckbox({ checked, onChange, disabled }: StudentCheckboxProps) {
  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        checked
          ? 'border-violet-500/50 bg-violet-500/5'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none disabled:cursor-default"
        aria-expanded={checked}
        id="student-checkbox-btn"
      >
        <div className="flex items-center gap-3">
          {/* Custom checkbox */}
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              checked
                ? 'bg-violet-500 border-violet-500'
                : 'border-white/30 bg-transparent'
            }`}
          >
            <AnimatePresence>
              {checked && (
                <motion.svg
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  viewBox="0 0 12 10"
                  fill="none"
                  className="w-3 h-3"
                >
                  <path
                    d="M1 5L4.5 8.5L11 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <GraduationCap
              className={`h-5 w-5 transition-colors duration-200 ${
                checked ? 'text-violet-400' : 'text-white/50'
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-white">Are you a student?</p>
              <p className="text-xs text-white/50 mt-0.5">
                Verify your college ID and unlock an exclusive spin-to-win reward!
              </p>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: checked ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown
            className={`h-4 w-4 transition-colors ${
              checked ? 'text-violet-400' : 'text-white/30'
            }`}
          />
        </motion.div>
      </button>
    </div>
  )
}
