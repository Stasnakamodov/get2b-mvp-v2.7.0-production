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
  // Размеры
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg'
  }

  // Отступы для иконок
  const paddingWithIcon = leftIcon
    ? inputSize === 'sm'
      ? 'pl-9'
      : inputSize === 'lg'
      ? 'pl-12'
      : 'pl-10'
    : ''

  const paddingWithRightIcon = rightIcon
    ? inputSize === 'sm'
      ? 'pr-9'
      : inputSize === 'lg'
      ? 'pr-12'
      : 'pr-10'
    : ''

  // Базовые стили
  const baseStyles = 'border rounded-lg focus:outline-none focus:ring-2 transition-colors'
  const stateStyles = error
    ? 'border-red-300 focus:ring-red-500'
    : 'border-gray-300 focus:ring-blue-500'
  const disabledStyles = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white'
  const widthStyles = fullWidth ? 'w-full' : ''

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Input с иконками */}
      <div className="relative">
        {/* Левая иконка */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
