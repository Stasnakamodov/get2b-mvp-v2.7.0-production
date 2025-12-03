/**
 * Переиспользуемый компонент пагинации
 * FSD: shared/ui
 *
 * Извлечено из widgets/catalog-suppliers/ui/SupplierGrid.tsx
 */

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Компонент пагинации с номерами страниц
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) {
    return null
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* Кнопка назад */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Номера страниц */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
          // Показываем только несколько страниц вокруг текущей
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
                aria-label={`Страница ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          } else if (
            page === currentPage - 2 ||
            page === currentPage + 2
          ) {
            return <span key={page} className="px-1">...</span>
          }
          return null
        })}
      </div>

      {/* Кнопка вперед */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        aria-label="Следующая страница"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
