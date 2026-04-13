import { ReactNode } from 'react'

interface GlowButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'filled' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function GlowButton({
  children,
  onClick,
  className = '',
  variant = 'filled',
  size = 'md',
  disabled = false,
  type = 'button',
}: GlowButtonProps) {
  const sizeClasses = {
    sm: 'min-h-11 px-4 py-2.5 text-sm',
    md: 'min-h-12 px-6 py-3 text-base',
    lg: 'min-h-[3.25rem] px-8 py-3.5 text-base sm:text-lg',
  }

  const variantClasses = {
    filled: `
      bg-mugen-crimson text-mugen-white glow-crimson shadow-md
      hover:glow-gold-lg hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl
      active:translate-y-0 active:brightness-95 active:shadow-md
    `,
    outline: `
      border-2 border-mugen-crimson text-mugen-crimson shadow-sm
      hover:bg-mugen-glow/12 hover:border-mugen-glow hover:text-mugen-glow
      hover:shadow-[0_0_26px_rgba(255,211,77,0.42)] hover:-translate-y-0.5
      active:translate-y-0 active:shadow-sm
    `,
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        font-semibold rounded-lg cursor-pointer
        transition-all duration-300 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mugen-glow/75
        focus-visible:ring-offset-2 focus-visible:ring-offset-mugen-black
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:active:scale-100
        ${className}
      `}
    >
      {children}
    </button>
  )
}
