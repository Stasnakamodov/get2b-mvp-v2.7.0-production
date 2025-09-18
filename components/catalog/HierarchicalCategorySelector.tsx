'use client'

import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Package, Search, Grid3X3, List, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CatalogCategory, CategoryTree } from '@/lib/types'

interface HierarchicalCategorySelectorProps {
  onCategorySelect: (category: CatalogCategory) => void
  onClose: () => void
  userId?: string
  authToken?: string
  selectedRoom?: 'orange' | 'blue'
}

export default function HierarchicalCategorySelector({ 
  onCategorySelect, 
  onClose, 
  userId, 
  authToken,
  selectedRoom = 'orange'
}: HierarchicalCategorySelectorProps) {
  const [categoryTrees, setCategoryTrees] = useState<CategoryTree[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Загрузка иерархических категорий
  useEffect(() => {
    loadHierarchicalCategories()
  }, [selectedRoom]) // Перезагружаем при смене комнаты

  const loadHierarchicalCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`🌳 [HierarchicalSelector] Загружаем иерархические категории для ${selectedRoom} комнаты`)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      // Преобразуем selectedRoom в room_type для API
      const roomType = selectedRoom === 'orange' ? 'verified' : 'user'
      const url = `/api/catalog/categories`

      const response = await fetch(url, {
        method: 'GET',
        headers
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Ошибка загрузки категорий')
      }

      console.log(`✅ [HierarchicalSelector] Загружено категорий: ${data.categoryTrees.length}`)
      setCategoryTrees(data.categoryTrees)

    } catch (error) {
      console.error('❌ [HierarchicalSelector] Ошибка загрузки категорий:', error)
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация категорий по поиску
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryTrees
    }

    return categoryTrees.filter(tree => 
      tree.main_category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tree.subcategories.some(sub => 
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [categoryTrees, searchQuery])

  const handleSubcategoryClick = (subcategory: CatalogCategory, mainCategory: CatalogCategory) => {
    console.log(`🎯 [HierarchicalSelector] Выбрана подкатегория: ${subcategory.name} из категории: ${mainCategory.name}`)
    // Добавляем информацию о пути для удобства
    const categoryWithPath = {
      ...subcategory,
      category_path: `${mainCategory.name} → ${subcategory.name}`
    }
    onCategorySelect(categoryWithPath)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка категорий...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadHierarchicalCategories} variant="outline">
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - упрощенный для inline отображения */}

      {/* Search and Controls */}
      <div className="border-b border-gray-200 p-2">
        <div className="flex items-center justify-between mb-2">
          {/* Поиск */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Поиск категорий..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 border-black focus:border-gray-400"
            />
          </div>

          {/* Переключатель вида */}
          <div className="flex border-2 border-black ml-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-l-2 border-black ${viewMode === 'list' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-600">
          Найдено: {filteredCategories.length} категорий
        </div>
      </div>

      {/* Categories Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Показываем основные категории с подкатегориями */}
        <CategoriesWithSubcategoriesView
          categoryTrees={filteredCategories}
          viewMode={viewMode}
          searchQuery={searchQuery}
          selectedRoom={selectedRoom}
          onSubcategorySelect={handleSubcategoryClick}
        />
      </div>
    </div>
  )
}

// Компонент для отображения категорий с подкатегориями
interface CategoriesWithSubcategoriesViewProps {
  categoryTrees: CategoryTree[]
  viewMode: 'grid' | 'list'
  searchQuery: string
  selectedRoom: 'orange' | 'blue'
  onSubcategorySelect: (subcategory: CatalogCategory, mainCategory: CatalogCategory) => void
}

function CategoriesWithSubcategoriesView({ 
  categoryTrees, 
  viewMode, 
  searchQuery,
  selectedRoom,
  onSubcategorySelect 
}: CategoriesWithSubcategoriesViewProps) {
  if (categoryTrees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Категории не найдены</h3>
      </div>
    )
  }

  if (viewMode === 'list') {
    // Режим списка - показываем основные категории с подкатегориями в одной строке
    return (
      <div className="space-y-3">
        {categoryTrees.map((tree) => (
          <div
            key={tree.main_category.id || tree.main_category.key}
            className="border-2 border-gray-200 rounded-lg bg-white p-4"
          >
            {/* Основная категория */}
            <button
              onClick={() => onSubcategorySelect(tree.main_category, tree.main_category)}
              className="w-full flex items-center gap-4 mb-3 p-3 -m-3 rounded-lg hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex-1 text-left">
                <h3 className="font-medium text-lg text-gray-900 group-hover:text-blue-700">{tree.main_category.name}</h3>
                <p className="text-sm text-gray-600">{tree.main_category.description}</p>
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-medium">Перейти к товарам</span>
                <span className="ml-2">→</span>
              </div>
            </button>
            
            {/* Подкатегории в строку - скрыты пока у нас плоская структура */}
            {tree.subcategories && tree.subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tree.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.id || subcategory.key}
                    onClick={() => onSubcategorySelect(subcategory, tree.main_category)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                      {subcategory.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      {subcategory.products_count}
                    </span>
                    {subcategory.rooms_info?.has_verified && (
                      <span className="text-orange-600">🧡</span>
                    )}
                    {subcategory.rooms_info?.has_user && (
                      <span className="text-blue-600">🔵</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Режим сетки - оптимизированная сетка для лучшей читаемости
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {categoryTrees.map((tree) => (
        <CompactCategoryWithSubcategories
          key={tree.main_category.id || tree.main_category.key}
          tree={tree}
          searchQuery={searchQuery}
          selectedRoom={selectedRoom}
          onSubcategorySelect={onSubcategorySelect}
        />
      ))}
    </div>
  )
}

// Компактный компонент для отображения категории с подкатегориями
interface CompactCategoryWithSubcategoriesProps {
  tree: CategoryTree
  searchQuery: string
  selectedRoom: 'orange' | 'blue'
  onSubcategorySelect: (subcategory: CatalogCategory, mainCategory: CatalogCategory) => void
}

function CompactCategoryWithSubcategories({ 
  tree, 
  searchQuery,
  selectedRoom,
  onSubcategorySelect 
}: CompactCategoryWithSubcategoriesProps) {
  const { main_category, subcategories, total_products, total_suppliers } = tree

  // Фильтруем подкатегории по поиску
  const filteredSubcategories = subcategories.filter(sub =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Если есть поиск и ни основная категория, ни подкатегории не подходят - не показываем
  if (searchQuery.trim() && 
      !main_category.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
      filteredSubcategories.length === 0) {
    return null
  }

  return (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Основная категория как компактная карточка */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <h3 className="text-base font-medium text-gray-900 mb-1">{main_category.name}</h3>
            <p className="text-xs text-gray-600 line-clamp-2">{main_category.description}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>{total_products} тов.</span>
          <span>{total_suppliers} пост.</span>
          <span>{filteredSubcategories.length} разд.</span>
        </div>
      </div>

      {/* Подкатегории как компактные строки */}
      <div className="p-2">
        {filteredSubcategories.length > 0 ? (
          <div className="space-y-1">
            {filteredSubcategories.map((subcategory) => (
              <button
                key={subcategory.id || subcategory.key}
                onClick={() => onSubcategorySelect(subcategory, main_category)}
                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 group rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{subcategory.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 leading-tight">
                    {subcategory.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">{subcategory.products_count}</span>
                  {subcategory.rooms_info?.has_verified && (
                    <span className="text-orange-600">🧡</span>
                  )}
                  {subcategory.rooms_info?.has_user && (
                    <span className="text-blue-600">🔵</span>
                  )}
                  <ChevronRight className="w-4 h-4 group-hover:text-blue-600" />
                </div>
              </button>
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            Подкатегории не найдены
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            Нет подразделов
          </div>
        )}
      </div>
    </div>
  )
}



