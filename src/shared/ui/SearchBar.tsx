/**
 * Переиспользуемый компонент поиска
 * FSD: shared/ui
 *
 * Извлечено из widgets/catalog-suppliers/ui/SupplierGrid.tsx
 */

import React from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Компонент поиска с иконкой
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Поиск...',
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white shadow-sm
          focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100
          hover:border-gray-300 hover:shadow-md
          transition-all duration-200
          placeholder:text-gray-400"
      />
    </div>
  )
}
