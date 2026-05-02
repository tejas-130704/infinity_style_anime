import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  strength?: 'light' | 'medium' | 'strong'
}

export function GlassCard({
  children,
  className = '',
  onClick,
  strength = 'medium',
}: GlassCardProps) {
  const strengthClasses = {
    light: 'glass',
    medium: 'glass',
    strong: 'glass-strong',
  }

  return (
    <div
      onClick={onClick}
      className={`${strengthClasses[strength]} rounded-lg p-6 transition-all duration-300 hover:shadow-glow-lg cursor-pointer ${className}`}
    >
      {children}
    </div>
  )
}
