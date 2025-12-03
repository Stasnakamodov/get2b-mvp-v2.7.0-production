/**
 * Переиспользуемый компонент бейджа
 * FSD: shared/ui
 *
 * Извлечено из widgets/catalog-suppliers/ui/SupplierCard.tsx
 */

import React from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  pill?: boolean
  icon?: React.ReactNode
  dot?: boolean
  className?: string
}

/**
 * Компонент бейджа для отображения статусов, категорий и меток
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pill = true,
  icon,
  dot = false,
  className = ''
}) => {
  // Варианты цветов
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700'
  }

  // Размеры
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  // Форма
  const shapeStyles = pill ? 'rounded-full' : 'rounded'

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${shapeStyles}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {/* Dot индикатор */}
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      )}

      {/* Иконка */}
      {icon && (
        <span className="flex items-center">
          {icon}
        </span>
      )}

      {/* Контент */}
      {children}
    </span>
  )
}
