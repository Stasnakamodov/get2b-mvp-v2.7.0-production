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

      // Загружаем все категории
      const response = await fetch('/api/catalog/categories')
      const data = await response.json()

      let subs: any[] = []

      if (data.categories) {
        // Фильтруем подкатегории для выбранной категории
        subs = data.categories.filter((cat: any) =>
          cat.parent_id === category.id && cat.level === 1
        )

        console.log(`✅ [SubcategoryList] Найдено подкатегорий для ${category.name}:`, subs.length)
      }

      // ВРЕМЕННЫЙ WORKAROUND: Если PostgREST cache не обновился, используем захардкоженные подкатегории
      if (subs.length === 0) {
        console.log('⚠️ [SubcategoryList] PostgREST cache не обновлён, используем временные подкатегории')
        subs = getTemporarySubcategories(category.name)
      }

      setSubcategories(subs)
    } catch (error) {
      console.error('❌ [SubcategoryList] Ошибка загрузки подкатегорий:', error)
      setSubcategories([])
    } finally {
      setLoading(false)
    }
  }

  // ВРЕМЕННАЯ функция для демонстрации работы 3-уровневой навигации
  const getTemporarySubcategories = (categoryName: string) => {
    const tempSubcats: { [key: string]: any[] } = {
      'Электроника': [
        { id: 'temp-1', name: 'Смартфоны и планшеты', icon: '📱', products_count: 5, description: 'Мобильные устройства' },
        { id: 'temp-2', name: 'Компьютеры и ноутбуки', icon: '💻', products_count: 8, description: 'ПК и ноутбуки' },
        { id: 'temp-3', name: 'Бытовая техника', icon: '🏠', products_count: 4, description: 'Техника для дома' },
        { id: 'temp-4', name: 'Электроника общего назначения', icon: '🔌', products_count: 4, description: 'Разная электроника' },
      ],
      'Автотовары': [
        { id: 'temp-5', name: 'Автохимия', icon: '🧴', products_count: 3, description: 'Химия для авто' },
        { id: 'temp-6', name: 'Автозапчасти', icon: '🔧', products_count: 4, description: 'Запчасти для авто' },
        { id: 'temp-7', name: 'Шины и диски', icon: '🛞', products_count: 2, description: 'Колёса и диски' },
        { id: 'temp-8', name: 'Аксессуары', icon: '🚗', products_count: 0, description: 'Аксессуары для авто' },
      ],
      'Промышленность': [
        { id: 'temp-9', name: 'Станки и оборудование', icon: '⚙️', products_count: 0, description: 'Промышленные станки' },
        { id: 'temp-10', name: 'Инструменты', icon: '🔨', products_count: 0, description: 'Промышленные инструменты' },
        { id: 'temp-11', name: 'Электротехника', icon: '⚡', products_count: 0, description: 'Электротехника' },
        { id: 'temp-12', name: 'Расходные материалы', icon: '📦', products_count: 0, description: 'Расходники' },
      ],
      'Здоровье и медицина': [
        { id: 'temp-13', name: 'Медицинские изделия', icon: '🏥', products_count: 0, description: 'Медизделия' },
        { id: 'temp-14', name: 'Фармацевтика', icon: '💊', products_count: 0, description: 'Лекарства' },
        { id: 'temp-15', name: 'Медицинское оборудование', icon: '🩺', products_count: 0, description: 'Медоборудование' },
      ],
      'Текстиль и одежда': [
        { id: 'temp-16', name: 'Ткани', icon: '🧵', products_count: 0, description: 'Ткани оптом' },
        { id: 'temp-17', name: 'Одежда оптом', icon: '👕', products_count: 0, description: 'Одежда' },
        { id: 'temp-18', name: 'Домашний текстиль', icon: '🛏️', products_count: 0, description: 'Текстиль для дома' },
        { id: 'temp-19', name: 'Спецодежда', icon: '🦺', products_count: 0, description: 'Спецодежда' },
      ],
      'Строительство': [
        { id: 'temp-20', name: 'Строительные материалы', icon: '🧱', products_count: 0, description: 'Стройматериалы' },
        { id: 'temp-21', name: 'Инструменты', icon: '🔨', products_count: 0, description: 'Строительные инструменты' },
        { id: 'temp-22', name: 'Сантехника', icon: '🚿', products_count: 0, description: 'Сантехника' },
        { id: 'temp-23', name: 'Электрика', icon: '💡', products_count: 0, description: 'Электрика' },
      ],
      'Продукты питания': [
        { id: 'temp-24', name: 'Напитки', icon: '🥤', products_count: 0, description: 'Напитки оптом' },
        { id: 'temp-25', name: 'Бакалея', icon: '🌾', products_count: 0, description: 'Бакалея' },
        { id: 'temp-26', name: 'Консервация', icon: '🥫', products_count: 0, description: 'Консервы' },
        { id: 'temp-27', name: 'Молочные продукты', icon: '🥛', products_count: 0, description: 'Молочка' },
      ],
      'Дом и быт': [
        { id: 'temp-28', name: 'Посуда', icon: '🍽️', products_count: 0, description: 'Посуда' },
        { id: 'temp-29', name: 'Мебель', icon: '🪑', products_count: 0, description: 'Мебель' },
        { id: 'temp-30', name: 'Декор', icon: '🎨', products_count: 0, description: 'Декор для дома' },
        { id: 'temp-31', name: 'Хозяйственные товары', icon: '🧹', products_count: 0, description: 'Хозтовары' },
      ],
    }

    return tempSubcats[categoryName] || []
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
          <p className="text-sm mt-2">Подкатегории появятся после обновления PostgREST cache</p>
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
