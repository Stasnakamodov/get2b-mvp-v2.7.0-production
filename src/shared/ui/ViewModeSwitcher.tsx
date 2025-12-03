/**
 * Переиспользуемый компонент переключения режима отображения
 * FSD: shared/ui
 *
 * Извлечено из widgets/catalog-suppliers/ui/SupplierGrid.tsx
 */

import React from 'react'
import { Grid3X3, List } from 'lucide-react'

export type ViewMode = 'grid' | 'list'

interface ViewModeSwitcherProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

/**
 * Компонент переключения между сеткой и списком
 */
export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  mode,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => onChange('grid')}
        className={`p-2 transition-colors ${
          mode === 'grid'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
        title="Сетка"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 transition-colors ${
          mode === 'list'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
        title="Список"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}
