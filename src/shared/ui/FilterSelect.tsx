/**
 * Переиспользуемый компонент фильтра
 * FSD: shared/ui
 *
 * Извлечено из widgets/catalog-suppliers/ui/SupplierGrid.tsx
 */

import React from 'react'
import { Filter } from 'lucide-react'

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  showIcon?: boolean
  className?: string
}

/**
 * Компонент выпадающего списка с иконкой фильтра
 */
export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Все',
  showIcon = true,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 dark:text-gray-100 shadow-sm
          focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40
          hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md
          transition-all duration-200
          font-medium cursor-pointer"
      >
        <option value="all">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
