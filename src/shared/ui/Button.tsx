/**
 * Premium Button Component
 * Design Philosophy: Clean, Minimal, Apple-inspired
 */

import React from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  loading?: boolean
  fullWidth?: boolean
  children?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  // Premium minimal styles - no gradients, subtle shadows
  const variantStyles = {
    primary: 'bg-black text-white font-medium hover:bg-gray-900 active:bg-gray-800',
    secondary: 'bg-white text-gray-900 font-medium hover:bg-gray-50 active:bg-gray-100',
    danger: 'bg-white text-red-600 font-medium hover:bg-red-50 active:bg-red-100',
    ghost: 'bg-transparent text-gray-600 font-medium hover:bg-gray-50 active:bg-gray-100'
  }

  // Clean sizing - reduced padding for tighter feel
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  }

  const baseStyles = 'rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2'

  const widthStyles = fullWidth ? 'w-full' : ''

  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  )
}
