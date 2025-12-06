/**
 * Premium Card Component
 * Design Philosophy: Borderless, Clean, Minimal
 */

import React from 'react'

type CardVariant = 'default' | 'elevated' | 'flat'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  variant?: CardVariant
  padding?: CardPadding
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
  className?: string
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  className = ''
}) => {
  // Minimal styles - no borders, subtle shadows only for depth
  const variantStyles = {
    default: 'bg-white',
    elevated: 'bg-white shadow-sm',
    flat: 'bg-transparent'
  }

  // Tighter padding for information density
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  // Subtle hover effects
  const interactiveStyles = hoverable || clickable
    ? 'transition-shadow duration-200 hover:shadow-md'
    : ''

  const cursorStyle = clickable || onClick ? 'cursor-pointer' : ''

  const handleClick = () => {
    if (onClick && (clickable || hoverable)) {
      onClick()
    }
  }

  return (
    <div
      className={`
        rounded-lg overflow-hidden
        ${variantStyles[variant]}
        ${interactiveStyles}
        ${cursorStyle}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
    >
      {/* Header */}
      {header && (
        <div className={`${paddingStyles[padding]} ${footer ? 'border-b border-gray-100' : ''}`}>
          {header}
        </div>
      )}

      {/* Body */}
      <div className={paddingStyles[padding]}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`${paddingStyles[padding]} border-t border-gray-100`}>
          {footer}
        </div>
      )}
    </div>
  )
}
