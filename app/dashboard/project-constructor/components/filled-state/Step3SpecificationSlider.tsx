'use client'

import React, { useState } from 'react'
import { Package, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

interface SpecificationItem {
  item_name?: string
  name?: string
  item_code?: string
  price: number
  quantity: number
  total: number
  [key: string]: any
}

interface Step3SpecificationSliderProps {
  data: any
  onPreview: (type: string, data: any) => void
}

export function Step3SpecificationSlider({ data, onPreview }: Step3SpecificationSliderProps) {
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const productsPerView = 3

  const items = data?.items || []
  const currency = data?.currency || 'RUB'
  const supplier = data?.supplier || items?.[0]?.item_name || 'Не указано'

  if (!items || items.length === 0) {
    return null
  }

  const totalPages = Math.ceil(items.length / productsPerView)
  const currentPage = Math.floor(currentProductIndex / productsPerView)

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-6xl space-y-6">
        {/* Слайдер товаров */}
        <div className="mb-6">
          {/* Заголовок слайдера */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Товары ({items.length})
            </h3>
          </div>

          {/* Контейнер слайдера */}
          <div className="relative">
            {/* Кнопка "Назад" */}
            {currentProductIndex > 0 && (
              <button
                onClick={() => setCurrentProductIndex(prev => Math.max(0, prev - productsPerView))}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}

            {/* Кнопка "Вперед" */}
            {currentProductIndex + productsPerView < items.length && (
              <button
                onClick={() => setCurrentProductIndex(prev => Math.min(items.length - productsPerView, prev + productsPerView))}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            )}

            {/* Текущие товары (по 3) */}
            <div className="grid grid-cols-3 gap-4 mx-12">
              {Array.from({ length: productsPerView }, (_, i) => {
                const itemIndex = currentProductIndex + i
                const item = items[itemIndex]

                if (!item) return null

                return (
                  <div
                    key={itemIndex}
                    className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-400 hover:scale-105"
                    onClick={() => onPreview('product', data)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Товар {itemIndex + 1}
                        </div>
                        <div className="text-xs text-gray-500">Спецификация</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">📦</span>
                        <span className="text-gray-800 font-medium text-sm truncate">
                          {item.item_name || item.name || 'Товар без названия'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🏷️</span>
                        <span className="text-gray-800 text-sm">
                          {(item as any).item_code || 'Без артикула'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">💰</span>
                        <span className="text-gray-800 text-sm">
                          {item.price} {currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">📊</span>
                        <span className="text-gray-800 text-sm">
                          {item.quantity} шт
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">💳</span>
                        <span className="text-gray-800 font-semibold text-sm">
                          {item.total} {currency}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-green-600 mt-3 flex items-center gap-1">
                      <span>Нажмите для просмотра</span>
                      <Eye className="h-3 w-3" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Индикаторы слайдера */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, groupIndex) => (
              <button
                key={groupIndex}
                onClick={() => setCurrentProductIndex(groupIndex * productsPerView)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  currentPage === groupIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Сводная информация */}
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Сводка</div>
              <div className="text-xs text-gray-500">Общая информация</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🏪</span>
              <span className="text-gray-800 font-medium">{supplier}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">📦</span>
              <span className="text-gray-800">{items.length} позиций</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">💰</span>
              <span className="text-gray-800">{currency}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
