/**
 * UI компонент модального окна поставщика
 * FSD: features/supplier-modal/ui
 *
 * Извлечено из app/dashboard/catalog/page.tsx
 * для улучшения структуры и переиспользуемости
 */

import React from 'react'
import type { Supplier } from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'
import { ProductCard } from '@/src/widgets/catalog-suppliers'
import { logger } from '@/src/shared/lib'

interface SupplierModalProps {
  isOpen: boolean
  supplier: Supplier | null
  products: Product[]
  loading: boolean
  onClose: () => void
  onStartProject?: (supplier: Supplier) => void
  onAddToCart?: (product: Product) => boolean
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
  onClose,
  onStartProject,
  onAddToCart,
  onProductClick
}) => {
  if (!isOpen || !supplier) {
    return null
  }

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      const success = onAddToCart(product)
      if (success) {
        logger.info('Товар добавлен в корзину')
      } else {
        alert('Нельзя добавить товар другого поставщика')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate pr-4">{supplier.name}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Информация о поставщике */}
          <div className="mb-8">
            <div className="flex gap-8 items-stretch">
              {/* Логотип */}
              {supplier.logo_url && (
                <div className="flex-shrink-0 self-stretch">
                  <img
                    src={supplier.logo_url}
                    alt={supplier.name}
                    className="w-52 h-full rounded-2xl object-cover shadow-lg border-4 border-white dark:border-gray-800"
                  />
                </div>
              )}

              {/* Информация */}
              <div className="flex-1 space-y-6">
                {/* Категория */}
                <div className="flex items-center gap-3 flex-wrap">
                  {supplier.category && (
                    <span className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl">
                      {supplier.category}
                    </span>
                  )}

                  {supplier.room_type === 'verified' && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 text-sm font-semibold rounded-xl">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Аккредитован
                    </span>
                  )}
                </div>

                {/* Описание */}
                {supplier.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                    {supplier.description}
                  </p>
                )}

                {/* Информационная строка */}
                <div className="flex items-center gap-4 flex-wrap">
                  {supplier.country && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-base">{supplier.country}{supplier.city ? `, ${supplier.city}` : ''}</span>
                    </div>
                  )}

                  {supplier.rating != null && supplier.rating > 0 && (
                    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950 px-4 py-2 rounded-xl">
                      <svg className="w-5 h-5 text-orange-500 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-gray-900 dark:text-orange-100 text-base">{supplier.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Кнопка действия */}
                {onStartProject && (
                  <div className="pt-2">
                    <button
                      onClick={() => onStartProject(supplier)}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg text-base"
                    >
                      Начать проект с поставщиком
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Товары поставщика */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Каталог товаров ({products.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    supplierName={supplier.name}
                    isCompact={true}
                    showActions={true}
                    onAddToCart={onAddToCart ? handleAddToCart : undefined}
                    onClick={onProductClick}
                  />
                ))}
              </div>
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
