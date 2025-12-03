/**
 * Переиспользуемый компонент спиннера
 * FSD: shared/ui
 *
 * Извлечено из widgets/catalog-suppliers/ui/SupplierGrid.tsx
 */

import React from 'react'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'
type SpinnerVariant = 'primary' | 'secondary' | 'white'

interface SpinnerProps {
  size?: SpinnerSize
  variant?: SpinnerVariant
  label?: string
  centered?: boolean
  fullScreen?: boolean
  className?: string
}

/**
 * Компонент индикатора загрузки (спиннера)
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label,
  centered = false,
  fullScreen = false,
  className = ''
}) => {
  // Размеры
  const sizeStyles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  }

  // Варианты цветов
  const variantStyles = {
    primary: 'border-gray-300 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-gray-400 border-t-white'
  }

  const spinnerElement = (
    <div
      className={`
        animate-spin rounded-full
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label={label || 'Загрузка...'}
    />
  )

  // С текстом
  if (label) {
    const content = (
      <div className="flex flex-col items-center gap-3">
        {spinnerElement}
        <span className="text-gray-600 text-sm">{label}</span>
      </div>
    )

    if (fullScreen) {
      return (
        <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
          {content}
        </div>
      )
    }

    if (centered) {
      return (
        <div className="flex items-center justify-center h-64">
          {content}
        </div>
      )
    }

    return content
  }

  // Без текста
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        {spinnerElement}
      </div>
    )
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center h-64">
        {spinnerElement}
      </div>
    )
  }

  return spinnerElement
}
