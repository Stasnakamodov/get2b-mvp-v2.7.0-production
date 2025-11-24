'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Package } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface SubcategoryListProps {
  category: any
  onSubcategorySelect: (subcategory: any) => void
  onBack: () => void
  selectedRoom?: 'orange' | 'blue'
}

export default function SubcategoryList({
  category,
  onSubcategorySelect,
  onBack,
  selectedRoom = 'orange'
}: SubcategoryListProps) {
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Цвета для заголовка в зависимости от комнаты
  const roomColors = selectedRoom === 'orange'
    ? {
        primary: 'orange-500',
        primaryHover: 'orange-600',
        light: 'orange-100',
        border: 'orange-400',
        gradient: 'from-orange-500 to-orange-600',
        hoverGradient: 'hover:from-orange-50 hover:to-white'
      }
    : {
        primary: 'blue-500',
        primaryHover: 'blue-600',
        light: 'blue-100',
        border: 'blue-400',
        gradient: 'from-blue-500 to-blue-600',
        hoverGradient: 'hover:from-blue-50 hover:to-white'
      }

  useEffect(() => {
    loadSubcategories()
  }, [category])

  const loadSubcategories = async () => {
    try {
      setLoading(true)

      // Загружаем все категории с подкатегориями
      const response = await fetch('/api/catalog/categories')
      const data = await response.json()

      let subs: any[] = []

      if (data.categories) {
        // Находим текущую категорию и получаем её подкатегории
        const currentCategory = data.categories.find((cat: any) => cat.id === category.id)

        if (currentCategory && currentCategory.subcategories) {
          subs = currentCategory.subcategories
        } else {
        }
      }

      setSubcategories(subs)
    } catch (error) {
      console.error('❌ [SubcategoryList] Ошибка загрузки подкатегорий:', error)
      setSubcategories([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка подкатегорий...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к категориям
        </Button>
        <span className="text-gray-400">/</span>
        <h2 className="text-xl font-semibold text-gray-900">
          {category.icon} {category.name}
        </h2>
      </div>

      {/* Список подкатегорий */}
      {subcategories.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>В этой категории пока нет подкатегорий</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className={`
                group relative border border-gray-200 rounded-xl p-5 cursor-pointer
                transition-all duration-300 hover:border-${roomColors.border} hover:shadow-lg
                bg-white hover:bg-gradient-to-br ${roomColors.hoverGradient}
              `}
              onClick={() => onSubcategorySelect(subcategory)}
            >
              {/* Счетчик товаров */}
              <div className={`absolute top-3 right-3 bg-${roomColors.primary} text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm`}>
                {subcategory.products_count || 0}
              </div>

              <div className="text-left">
                {/* Иконка и название */}
                <div className="flex items-start mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${roomColors.gradient} rounded-xl flex items-center justify-center mr-3 shadow-md flex-shrink-0`}>
                    <span className="text-2xl">{subcategory.icon || '📦'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 group-hover:text-gray-800">
                      {subcategory.name}
                    </h3>
                    {subcategory.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {subcategory.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Полный путь */}
                {subcategory.full_path && (
                  <p className="text-xs text-gray-400 mt-2 truncate">
                    {subcategory.full_path}
                  </p>
                )}

                {/* Кнопка просмотра */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Нажмите для просмотра товаров
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
