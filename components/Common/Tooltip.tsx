'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface TooltipProps {
  content: string | React.ReactNode
  children?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: string
  className?: string
  trigger?: 'hover' | 'click'
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  maxWidth = '300px',
  className = '',
  trigger = 'hover',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip()
    } else {
      showTooltip()
    }
  }

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2
        break
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2
        break
      case 'left':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.left + scrollX - tooltipRect.width - 8
        break
      case 'right':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.right + scrollX + 8
        break
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < 8) left = 8
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8
    }
    if (top < scrollY + 8) top = scrollY + 8
    if (top + tooltipRect.height > scrollY + viewportHeight - 8) {
      top = scrollY + viewportHeight - tooltipRect.height - 8
    }

    setTooltipPosition({ top, left })
  }

  useEffect(() => {
    if (isVisible) {
      updatePosition()
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isVisible])

  const handleMouseEnter = trigger === 'hover' ? showTooltip : undefined
  const handleMouseLeave = trigger === 'hover' ? hideTooltip : undefined
  const handleClick = trigger === 'click' ? toggleTooltip : undefined

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`inline-flex items-center ${className}`}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl border border-gray-700 pointer-events-none font-poppins"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            maxWidth,
          }}
        >
          <div className="relative">
            {typeof content === 'string' ? (
              <p className="text-gray-100 leading-relaxed">{content}</p>
            ) : (
              content
            )}
            {trigger === 'click' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  hideTooltip()
                }}
                className="absolute -top-1 -right-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b'
                : position === 'bottom'
                ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t'
                : position === 'left'
                ? 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t'
                : 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b'
            }`}
          />
        </div>
      )}
    </>
  )
}

/**
 * HelpIcon Component - Icon với tooltip
 */
interface HelpIconProps {
  content: string | React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  size?: number
}

export function HelpIcon({
  content,
  position = 'top',
  className = '',
  size = 16,
}: HelpIconProps) {
  return (
    <Tooltip content={content} position={position} trigger="hover">
      <HelpCircle
        className={`text-gray-400 hover:text-blue-400 cursor-help transition-colors ${className}`}
        size={size}
      />
    </Tooltip>
  )
}

/**
 * InlineHelp Component - Text với tooltip icon bên cạnh
 */
interface InlineHelpProps {
  label: string
  helpText: string | React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function InlineHelp({
  label,
  helpText,
  position = 'top',
  className = '',
}: InlineHelpProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-poppins">{label}</span>
      <HelpIcon content={helpText} position={position} />
    </div>
  )
}

