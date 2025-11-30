/**
 * Компонент отображения категорий каталога
 * Часть FSD архитектуры - widgets/catalog-suppliers
 */

import React from 'react'
import { ChevronRight, Package, Users, ShoppingCart } from 'lucide-react'
import type { CatalogCategory } from '@/src/entities/supplier'
import { formatPrice } from '@/src/shared/config'

interface CategoryViewProps {
  categories: CatalogCategory[]
  loading?: boolean
  error?: string | null
  onCategoryClick?: (category: CatalogCategory) => void
  onSubcategoryClick?: (category: CatalogCategory, subcategory: CatalogCategory) => void
  selectedCategory?: CatalogCategory | null
  selectedSubcategory?: CatalogCategory | null
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categories,
  loading = false,
  error = null,
  onCategoryClick,
  onSubcategoryClick,
  selectedCategory,
  selectedSubcategory
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span>Загрузка категорий...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Package className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-500">Категории не найдены</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((category) => {
        const isSelected = selectedCategory?.id === category.id
        const hasSubcategories = category.has_subcategories || (category.subcategories && category.subcategories.length > 0)

        return (
          <div
            key={category.id || category.key}
            className={`
              relative border rounded-lg p-5 cursor-pointer transition-all
              ${isSelected
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
              }
            `}
            onClick={() => onCategoryClick?.(category)}
          >
            {/* Иконка категории */}
            <div className="text-3xl mb-3">{category.icon || '📦'}</div>

            {/* Название категории */}
            <h3 className="font-semibold text-lg mb-2">
              {category.name || category.category}
            </h3>

            {/* Статистика */}
            <div className="space-y-1 text-sm text-gray-600">
              {category.products_count > 0 && (
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{category.products_count} товаров</span>
                </div>
              )}

              {category.suppliers_count > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{category.suppliers_count} поставщиков</span>
                </div>
              )}

              {category.price_range && (
                <div className="flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{category.price_range}</span>
                </div>
              )}
            </div>

            {/* Комнаты */}
            {category.rooms_info && (
              <div className="flex gap-2 mt-3">
                {category.rooms_info.has_verified && (
                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                    🟠 Аккредитованные
                  </span>
                )}
                {category.rooms_info.has_user && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    🔵 Пользовательские
                  </span>
                )}
              </div>
            )}

            {/* Индикатор подкатегорий */}
            {hasSubcategories && (
              <div className="absolute top-4 right-4">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            )}

            {/* Подкатегории (если выбрана категория) */}
            {isSelected && category.subcategories && category.subcategories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Подкатегории:</p>
                <div className="space-y-1">
                  {category.subcategories.slice(0, 3).map(subcat => (
                    <button
                      key={subcat.id || subcat.key}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSubcategoryClick?.(category, subcat)
                      }}
                      className={`
                        w-full text-left px-3 py-2 text-sm rounded transition-colors
                        ${selectedSubcategory?.id === subcat.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }
                      `}
                    >
                      {subcat.name}
                      {subcat.products_count > 0 && (
                        <span className="ml-2 opacity-75">
                          ({subcat.products_count})
                        </span>
                      )}
                    </button>
                  ))}
                  {category.subcategories.length > 3 && (
                    <p className="text-xs text-gray-500 pl-3 pt-1">
                      +{category.subcategories.length - 3} ещё
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Компонент выбора подкатегорий
 */
export const SubcategorySelector: React.FC<{
  subcategories: CatalogCategory[]
  selectedSubcategory?: CatalogCategory | null
  onSelect: (subcategory: CatalogCategory) => void
  onClose: () => void
}> = ({ subcategories, selectedSubcategory, onSelect, onClose }) => {
  if (subcategories.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Выберите подкатегорию</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {subcategories.map(subcat => (
          <button
            key={subcat.id || subcat.key}
            onClick={() => onSelect(subcat)}
            className={`
              p-3 rounded-lg border transition-all text-left
              ${selectedSubcategory?.id === subcat.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
            `}
          >
            <p className="font-medium text-sm">{subcat.name}</p>
            {subcat.products_count > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {subcat.products_count} товаров
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}