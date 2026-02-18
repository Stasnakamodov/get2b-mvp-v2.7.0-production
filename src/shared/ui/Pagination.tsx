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
        className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:shadow-md hover:scale-105
          active:scale-95 transition-all duration-200"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Номера страниц */}
      <div className="flex items-center gap-2">
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
                className={`min-w-[44px] h-11 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                    : 'border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-300 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:shadow-md hover:scale-105 active:scale-95'
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
            return <span key={page} className="px-2 text-gray-400 dark:text-gray-500 font-semibold">...</span>
          }
          return null
        })}
      </div>

      {/* Кнопка вперед */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:shadow-md hover:scale-105
          active:scale-95 transition-all duration-200"
        aria-label="Следующая страница"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
