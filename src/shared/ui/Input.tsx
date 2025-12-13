/**
 * Переиспользуемый компонент ввода
 * FSD: shared/ui
 *
 * Извлечено из SearchBar.tsx и других паттернов
 */

import React from 'react'

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: InputSize
  fullWidth?: boolean
}

/**
 * Компонент текстового поля с поддержкой иконок, состояний и валидации
 */
export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  inputSize = 'md',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  // Размеры с улучшенным spacing
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }

  // Отступы для иконок
  const paddingWithIcon = leftIcon
    ? inputSize === 'sm'
      ? 'pl-10'
      : inputSize === 'lg'
      ? 'pl-14'
      : 'pl-12'
    : ''

  const paddingWithRightIcon = rightIcon
    ? inputSize === 'sm'
      ? 'pr-10'
      : inputSize === 'lg'
      ? 'pr-14'
      : 'pr-12'
    : ''

  // Базовые стили с современными эффектами
  const baseStyles = 'border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-sm hover:shadow-md'
  const stateStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-300'
  const disabledStyles = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60 hover:shadow-sm' : 'bg-white'
  const widthStyles = fullWidth ? 'w-full' : ''

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Input с иконками */}
      <div className="relative">
        {/* Левая иконка */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          {...props}
          disabled={disabled}
          className={`
            ${baseStyles}
            ${sizeStyles[inputSize]}
            ${stateStyles}
            ${disabledStyles}
            ${widthStyles}
            ${paddingWithIcon}
            ${paddingWithRightIcon}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
        />

        {/* Правая иконка */}
        {rightIcon && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Helper text или ошибка */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}
