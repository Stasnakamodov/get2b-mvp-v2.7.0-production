'use client'

import React, { useState, useEffect } from 'react'
import { ChevronRight, Package, Search, Filter, Grid3X3, List } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CatalogCategory, CatalogCategoriesResponse } from '@/lib/types'

interface CategorySelectorProps {
  onCategorySelect: (category: CatalogCategory) => void
  onClose: () => void
  userId?: string
  authToken?: string
}

export default function CategorySelector({ onCategorySelect, onClose, userId, authToken }: CategorySelectorProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('products_count')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📊 [CategorySelector] Загружаем категории товаров')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch('/api/catalog/categories', {
        method: 'GET',
        headers
      })

      const data: CatalogCategoriesResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Ошибка загрузки категорий')
      }

      console.log(`✅ [CategorySelector] Загружено категорий: ${data.categories.length}`)
      setCategories(data.categories)

    } catch (error) {
      console.error('❌ [CategorySelector] Ошибка загрузки категорий:', error)
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация и сортировка категорий
  const filteredAndSortedCategories = React.useMemo(() => {
    let filtered = categories.filter(category =>
      (category.name || category.category).toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || a.category).localeCompare(b.name || b.category)
        case 'name_desc':
          return (b.name || b.category).localeCompare(a.name || a.category)
        case 'products_count':
          return b.products_count - a.products_count
        case 'suppliers_count':
          return b.suppliers_count - a.suppliers_count
        default:
          return b.products_count - a.products_count
      }
    })

    return filtered
  }, [categories, searchQuery, sortBy])

  const handleCategoryClick = (category: CatalogCategory) => {
    console.log(`🎯 [CategorySelector] Выбрана категория: ${category.name || category.category}`)
    onCategorySelect(category)
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
          <Button onClick={loadCategories} variant="outline">
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b-2 border-black p-6">
        <h2 className="text-2xl font-light text-black tracking-wide flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-600" />
          Выберите категорию товаров
        </h2>
        <div className="w-24 h-0.5 bg-black mt-2"></div>
        <p className="text-gray-600 mt-2 font-light">
          Найдите нужные товары по категории
        </p>
      </div>

      {/* Controls */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
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

          <div className="flex items-center gap-4 ml-6">
            {/* Сортировка */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border-2 border-black">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products_count">По кол-ву товаров</SelectItem>
                  <SelectItem value="suppliers_count">По кол-ву поставщиков</SelectItem>
                  <SelectItem value="name_asc">По названию (А-Я)</SelectItem>
                  <SelectItem value="name_desc">По названию (Я-А)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Переключатель вида */}
            <div className="flex border-2 border-black">
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
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-600">
          Найдено: {filteredAndSortedCategories.length} категорий
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Категории не найдены</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Попробуйте изменить запрос поиска' : 'Нет доступных категорий товаров'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "space-y-3"
          }>
            {filteredAndSortedCategories.map((category) => (
              <CategoryCard 
                key={category.name || category.category}
                category={category}
                viewMode={viewMode}
                onClick={() => handleCategoryClick(category)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Компонент карточки категории
interface CategoryCardProps {
  category: CatalogCategory
  viewMode: 'grid' | 'list'
  onClick: () => void
}

function CategoryCard({ category, viewMode, onClick }: CategoryCardProps) {
  if (viewMode === 'list') {
    return (
      <button
        onClick={onClick}
        className="w-full border-2 border-gray-200 hover:border-blue-400 p-4 bg-white transition-all duration-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl">{category.icon}</div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900">{category.name || category.category}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{category.products_count} товаров</span>
          <span>{category.suppliers_count} поставщиков</span>
          <div className="flex items-center gap-1">
            {category.rooms_info.has_verified && <span className="text-orange-600">🧡</span>}
            {category.rooms_info.has_user && <span className="text-blue-600">🔵</span>}
          </div>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="border-2 border-gray-200 hover:border-blue-400 p-6 bg-white transition-all duration-200 hover:shadow-md text-left"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-3xl">{category.icon}</div>
        <div className="flex items-center gap-1">
          {category.rooms_info.has_verified && (
            <span className="text-orange-600 text-lg">🧡</span>
          )}
          {category.rooms_info.has_user && (
            <span className="text-blue-600 text-lg">🔵</span>
          )}
        </div>
      </div>
      
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {category.name || category.category}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {category.description}
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Товаров:</span>
          <span className="font-medium">{category.products_count}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Поставщиков:</span>
          <span className="font-medium">{category.suppliers_count}</span>
        </div>
        {category.price_range && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Цены:</span>
            <span className="font-medium text-green-600">{category.price_range}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center justify-center text-blue-600">
        <span className="text-sm font-medium">Выбрать</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  )
}

