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
    <div className={`flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden p-1 bg-white shadow-sm ${className}`}>
      <button
        onClick={() => onChange('grid')}
        className={`p-2.5 rounded-lg transition-all duration-200 ${
          mode === 'grid'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
            : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105 active:scale-95'
        }`}
        title="Сетка"
      >
        <Grid3X3 className="w-5 h-5" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2.5 rounded-lg transition-all duration-200 ${
          mode === 'list'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
            : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105 active:scale-95'
        }`}
        title="Список"
      >
        <List className="w-5 h-5" />
      </button>
    </div>
  )
}
