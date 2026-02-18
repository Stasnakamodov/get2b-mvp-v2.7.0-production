/**
 * UI компонент модального окна поставщика
 * FSD: features/supplier-modal/ui
 *
 * Извлечено из app/dashboard/catalog/page.tsx
 * для улучшения структуры и переиспользуемости
 */

import React, { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { Supplier } from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'
import { ProductCard } from '@/src/widgets/catalog-suppliers'
import { logger } from '@/src/shared/lib'

type ViewMode = 'grid' | 'list'

interface SupplierModalProps {
  isOpen: boolean
  supplier: Supplier | null
  products: Product[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  totalCount?: number
  onClose: () => void
  onLoadMore?: () => void
  onStartProject?: (supplier: Supplier) => void
  onAddToCart?: (product: Product, quantity: number) => boolean
  onProductClick?: (product: Product) => void
}

/**
 * Модальное окно с информацией о поставщике и его товарами
 */
export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  supplier,
  products,
  loading,
  loadingMore = false,
  hasMore = false,
  totalCount = 0,
  onClose,
  onLoadMore,
  onStartProject,
  onAddToCart,
  onProductClick
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  if (!isOpen || !supplier) {
    return null
  }

  const handleAddToCart = (product: Product, quantity: number) => {
    if (onAddToCart) {
      const success = onAddToCart(product, quantity)
      if (!success) {
        alert('Нельзя добавить товар другого поставщика')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — centered logo + name like Toyota */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Centered logo + name */}
          <div className="flex flex-col items-center text-center">
            {supplier.logo_url ? (
              <img
                src={supplier.logo_url}
                alt={supplier.name}
                className="w-16 h-16 rounded-2xl object-cover mb-3 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                  {supplier.name?.charAt(0)}
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{supplier.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {[
                supplier.category,
                supplier.country && (supplier.city ? `${supplier.country}, ${supplier.city}` : supplier.country),
                supplier.rating != null && supplier.rating > 0 ? `★ ${supplier.rating.toFixed(1)}` : null,
              ].filter(Boolean).join('  ·  ')}
            </p>
          </div>

          {/* Toolbar: count + view toggle */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {products.length}{totalCount > products.length ? ` из ${totalCount}` : ''} товаров
            </span>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                aria-label="Сетка"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                aria-label="Список"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Товары поставщика */}
          <div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
                  : 'flex flex-col gap-3'
                }>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      supplierName={supplier.name}
                      isCompact={viewMode === 'grid'}
                      showActions={true}
                      onAddToCart={onAddToCart ? handleAddToCart : undefined}
                      onClick={onProductClick}
                    />
                  ))}
                </div>

                {hasMore && onLoadMore && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={onLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-700 dark:hover:text-orange-400 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {loadingMore ? 'Загрузка...' : 'Показать ещё'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                У этого поставщика пока нет товаров
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-2.5 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-700 dark:hover:text-orange-400 transition-colors font-medium"
          >
            Закрыть
          </button>

          {onStartProject && (
            <button
              onClick={() => onStartProject(supplier)}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
            >
              Начать проект
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
