/**
 * Premium Badge Component
 * Design Philosophy: Clean, Flat, Typography-focused
 */

import React from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
  dot?: boolean
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  className = ''
}) => {
  // Flat colors - no gradients, no borders
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-gray-900 text-white',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  }

  // Minimal sizing
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-md
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {/* Dot indicator */}
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      )}

      {/* Icon */}
      {icon && (
        <span className="flex items-center">
          {icon}
        </span>
      )}

      {/* Content */}
      {children}
    </span>
  )
}
