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
      {showIcon && <Filter className="w-4 h-4 text-gray-500" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
