'use client'

interface BluelockAccentProps {
  children: React.ReactNode
  variant?: 'default' | 'glow' | 'gradient'
  className?: string
}

/**
 * Component for BLUELOCK-inspired accent styling
 * Adds bright green glow effects and gradients
 */
export default function BluelockAccent({
  children,
  variant = 'default',
  className = '',
}: BluelockAccentProps) {
  const variantClasses = {
    default: 'text-bluelock-green',
    glow: 'text-bluelock-green text-bluelock-glow',
    gradient: 'bg-bluelock-accent bg-clip-text text-transparent',
  }

  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

