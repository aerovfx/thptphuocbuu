'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { memo, useMemo, useCallback } from 'react'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  userId?: string
  onClick?: () => void
  clickable?: boolean
}

function Avatar({ src, name, size = 'md', className = '', userId, onClick, clickable = false }: AvatarProps) {
  const router = useRouter()
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick()
    } else if (userId && clickable) {
      router.push(`/users/${userId}`)
    }
  }, [onClick, userId, clickable, router])

  const sizeClasses = useMemo(() => ({
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-32 h-32 text-4xl',
  }), [])

  const initial = useMemo(() => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [name])

  const baseClasses = useMemo(() => 
    clickable || userId ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
    [clickable, userId]
  )
  
  if (src) {
    const sizeValue = sizeClasses[size]
    return (
      <div 
        onClick={handleClick}
        className={`${sizeValue} ${className} ${baseClasses} relative rounded-full overflow-hidden flex-shrink-0`}
        style={{ position: 'relative' }}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 24px, 48px"
          unoptimized={src.startsWith('http')}
        />
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={`${sizeClasses[size]} ${className} ${baseClasses} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initial}
    </div>
  )
}

// Memoize Avatar to prevent unnecessary re-renders
export default memo(Avatar)

