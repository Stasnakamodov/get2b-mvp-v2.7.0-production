/**
 * Шаг 5: Товары
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal/steps
 */

import React from 'react'
import type { SupplierFormData, ProductFormData } from '@/src/entities/supplier'

interface Step5ProductsProps {
  formData: SupplierFormData
  errors: Record<string, string>
  updateField: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void
  handleAddProduct: () => void
  handleRemoveProduct: (productId: string) => void
  handleUpdateProduct: (index: number, field: keyof ProductFormData, value: any) => void
}

export const Step5Products: React.FC<Step5ProductsProps> = ({
  formData,
  errors,
  handleAddProduct,
  handleRemoveProduct,
  handleUpdateProduct
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Товары ({formData.products.length})</h3>
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          type="button"
        >
          + Добавить товар
        </button>
      </div>

      {errors.products && (
        <p className="text-red-500 text-sm mb-2">{errors.products}</p>
      )}

      {formData.products.length > 0 ? (
        <div className="space-y-3">
          {formData.products.map((product, index) => (
            <div key={product.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium">Товар {index + 1}</h4>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  className="text-red-600 hover:text-red-700"
                  type="button"
                >
                  Удалить
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                  placeholder="Название товара"
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={product.price}
                  onChange={(e) => handleUpdateProduct(index, 'price', e.target.value)}
                  placeholder="Цена"
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Нет добавленных товаров
        </div>
      )}
    </div>
  )
}
