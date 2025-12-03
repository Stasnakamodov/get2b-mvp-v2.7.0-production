/**
 * Переиспользуемый компонент карточки
 * FSD: shared/ui
 *
 * Извлечено из widgets/catalog-suppliers/ui/SupplierCard.tsx и ProductCard.tsx
 */

import React from 'react'

type CardVariant = 'default' | 'bordered' | 'elevated'
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

/**
 * Компонент карточки с поддержкой header/footer и различных стилей
 */
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
  // Варианты стилей
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    bordered: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-md'
  }

  // Размеры padding
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  // Стили для интерактивных карточек
  const interactiveStyles = hoverable || clickable
    ? 'transition-all hover:shadow-lg'
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
        rounded-lg
        ${variantStyles[variant]}
        ${interactiveStyles}
        ${cursorStyle}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
    >
      {/* Header */}
      {header && (
        <div className={`${paddingStyles[padding]} border-b border-gray-200`}>
          {header}
        </div>
      )}

      {/* Body */}
      <div className={paddingStyles[padding]}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`${paddingStyles[padding]} border-t border-gray-200 bg-gray-50`}>
          {footer}
        </div>
      )}
    </div>
  )
}
