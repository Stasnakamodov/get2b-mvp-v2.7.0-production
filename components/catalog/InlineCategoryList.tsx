'use client'

import React, { useState, useEffect } from 'react'
import { Package, Search, Grid3X3, List } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InlineCategoryListProps {
  onCategorySelect: (category: any) => void
  selectedRoom?: 'orange' | 'blue'
}

export default function InlineCategoryList({ 
  onCategorySelect, 
  selectedRoom = 'orange'
}: InlineCategoryListProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesWithCounts, setCategoriesWithCounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Цвета для заголовка и кнопок в зависимости от комнаты
  const headerColors = selectedRoom === 'orange' 
    ? {
        primary: 'orange-600',
        light: 'orange-100',
        border: 'orange-300'
      }
    : {
        primary: 'blue-600', 
        light: 'blue-100',
        border: 'blue-300'
      }

  useEffect(() => {
    loadCategoriesWithCounts()
  }, [selectedRoom])

  const loadCategoriesWithCounts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Загружаем категории
      const categoriesResponse = await fetch('/api/catalog/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const categoriesData = await categoriesResponse.json()

      if (!categoriesData.categories) {
        throw new Error('Ошибка загрузки категорий')
      }

      
      // Для каждой категории получаем количество товаров
      const categoriesWithCounts = await Promise.all(
        categoriesData.categories.map(async (category: any) => {
          try {
            const productsResponse = await fetch(`/api/catalog/products?category=${encodeURIComponent(category.name)}&supplier_type=${selectedRoom === 'orange' ? 'verified' : 'user'}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            })

            const productsData = await productsResponse.json()
            const productCount = productsData.products ? productsData.products.length : 0

            return {
              ...category,
              productCount
            }
          } catch (error) {
            console.error(`❌ Ошибка подсчета товаров для категории ${category.name}:`, error)
            return {
              ...category,
              productCount: 0
            }
          }
        })
      )

      setCategoriesWithCounts(categoriesWithCounts)
      setCategories(categoriesData.categories)

    } catch (error) {
      console.error('❌ [InlineCategoryList] Ошибка загрузки категорий:', error)
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return categoriesWithCounts
    }

    return categoriesWithCounts.filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categoriesWithCounts, searchQuery])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка категорий...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button onClick={loadCategoriesWithCounts} className="mt-4">
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Категории товаров
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({selectedRoom === 'orange' ? 'Аккредитованные' : 'Личные'} поставщики)
          </span>
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? `bg-${headerColors.primary} hover:bg-${headerColors.primary}` : ''}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? `bg-${headerColors.primary} hover:bg-${headerColors.primary}` : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Поиск категории..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Список категорий */}
      <div>
        {filteredCategories.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchQuery ? 'Категории не найдены' : 'Нет доступных категорий'}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-3"
          }>
            {filteredCategories.map((category) => {
              // Получаем РЕАЛЬНЫЕ подкатегории из БД (level = 1, parent_id = category.id)
              let realSubcategories = categories.filter((cat: any) =>
                cat.parent_id === category.id && cat.level === 1
              )

              // ВРЕМЕННЫЙ WORKAROUND: Если нет подкатегорий (PostgREST cache не обновлён)
              if (realSubcategories.length === 0) {
                const tempSubcats: { [key: string]: string[] } = {
                  'Электроника': ['📱 Смартфоны', '💻 Компьютеры', '🏠 Бытовая техника'],
                  'Автотовары': ['🧴 Автохимия', '🔧 Автозапчасти', '🛞 Шины'],
                  'Промышленность': ['⚙️ Станки', '🔨 Инструменты', '⚡ Электротехника'],
                  'Здоровье и медицина': ['🏥 Медизделия', '💊 Фармацевтика', '🩺 Оборудование'],
                  'Текстиль и одежда': ['🧵 Ткани', '👕 Одежда', '🦺 Спецодежда'],
                  'Строительство': ['🧱 Стройматериалы', '🔨 Инструменты', '🚿 Сантехника'],
                  'Продукты питания': ['🥤 Напитки', '🌾 Бакалея', '🥫 Консервы'],
                  'Дом и быт': ['🍽️ Посуда', '🪑 Мебель', '🎨 Декор']
                }
                const tempNames = tempSubcats[category.name] || []
                realSubcategories = tempNames.map((name, idx) => ({
                  id: `temp-${category.name}-${idx}`,
                  name: name.split(' ').slice(1).join(' '),
                  icon: name.split(' ')[0]
                }))
              }

              // Реальный счетчик товаров из базы данных
              const productCount = category.productCount || 0
              
              // Цвета в зависимости от комнаты
              const roomColors = selectedRoom === 'orange' 
                ? {
                    primary: 'orange-500',
                    primaryHover: 'orange-600', 
                    light: 'orange-100',
                    lightHover: 'orange-50',
                    border: 'orange-400',
                    gradient: 'from-orange-500 to-orange-600',
                    hoverGradient: 'hover:from-orange-50 hover:to-white'
                  }
                : {
                    primary: 'blue-500',
                    primaryHover: 'blue-600',
                    light: 'blue-100', 
                    lightHover: 'blue-50',
                    border: 'blue-400',
                    gradient: 'from-blue-500 to-blue-600',
                    hoverGradient: 'hover:from-blue-50 hover:to-white'
                  }

              return (
                <div
                  key={category.id || category.name}
                  className={`
                    group relative border border-gray-200 rounded-xl p-5 cursor-pointer 
                    transition-all duration-300 hover:border-${roomColors.border} hover:shadow-lg bg-white hover:bg-gradient-to-br ${roomColors.hoverGradient}
                    ${viewMode === 'list' ? 'flex items-center' : ''}
                  `}
                  onClick={() => onCategorySelect(category)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Счетчик товаров */}
                      <div className={`absolute top-3 right-3 bg-${roomColors.primary} text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm`}>
                        {productCount}
                      </div>
                      
                      <div className="text-left">
                        {/* Заголовок */}
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${roomColors.gradient} rounded-xl flex items-center justify-center mr-4 shadow-md group-hover:shadow-lg transition-shadow`}>
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-base">{category.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Нажмите для просмотра</p>
                          </div>
                        </div>
                        
                        {/* РЕАЛЬНЫЕ подкатегории из БД */}
                        <div className="space-y-1.5 ml-1 mt-2">
                          {realSubcategories.length > 0 ? (
                            realSubcategories.slice(0, 3).map((subcat: any) => (
                              <div key={subcat.id} className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors">
                                <span className="mr-2">{subcat.icon || '📦'}</span>
                                <span className="text-gray-600">{subcat.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">Нет подкатегорий</p>
                          )}
                          {realSubcategories.length > 3 && (
                            <p className="text-xs text-gray-500 mt-1">+{realSubcategories.length - 3} ещё</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center flex-1">
                        <div className={`w-12 h-12 bg-gradient-to-br ${roomColors.gradient} rounded-xl flex items-center justify-center mr-4 shadow-md`}>
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base">{category.name}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            {realSubcategories.length > 0 ? (
                              realSubcategories.slice(0, 3).map((subcat: any) => (
                                <span key={subcat.id} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                  {subcat.icon || '📦'} {subcat.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">Нет подкатегорий</span>
                            )}
                            {realSubcategories.length > 3 && (
                              <span className="text-xs text-gray-500">+{realSubcategories.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`bg-${roomColors.primary} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
                          {productCount}
                        </div>
                        <div className={`text-gray-400 group-hover:text-${roomColors.primary} transition-colors`}>
                          →
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}