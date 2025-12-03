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
import { SupplierCard, ProductCard } from '@/src/widgets/catalog-suppliers'
import { logger } from '@/src/shared/lib'

interface SupplierModalProps {
  isOpen: boolean
  supplier: Supplier | null
  products: Product[]
  loading: boolean
  onClose: () => void
  onStartProject?: (supplier: Supplier) => void
  onAddToCart?: (product: Product) => boolean
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
  onAddToCart
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {supplier.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="p-6">
          {/* Информация о поставщике */}
          <div className="mb-6">
            <SupplierCard
              supplier={supplier}
              onStartProject={onStartProject}
              showActions={true}
            />
          </div>

          {/* Товары поставщика */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Товары поставщика ({products.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    supplierName={supplier.name}
                    isCompact={true}
                    onAddToCart={onAddToCart ? handleAddToCart : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                У этого поставщика пока нет товаров
              </div>
            )}
          </div>
        </div>

        {/* Футер */}
        <div className="p-6 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Закрыть
          </button>

          {onStartProject && (
            <button
              onClick={() => onStartProject(supplier)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Начать проект
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
