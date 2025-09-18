'use client'

import React, { useState, useEffect } from 'react'
import { Package, Search, Grid3X3, List, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SimpleCategorySelectorProps {
  onCategorySelect: (category: any) => void
  onClose: () => void
  selectedRoom?: 'orange' | 'blue'
}

export default function SimpleCategorySelector({ 
  onCategorySelect, 
  onClose, 
  selectedRoom = 'orange'
}: SimpleCategorySelectorProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Загрузка простых категорий
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/catalog/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.categories) {
        console.log(`✅ [SimpleCategorySelector] Загружено категорий: ${data.categories.length}`)
        setCategories(data.categories)
      } else {
        throw new Error('Ошибка загрузки категорий')
      }

    } catch (error) {
      console.error('❌ [SimpleCategorySelector] Ошибка загрузки категорий:', error)
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация категорий по поиску
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return categories
    }

    return categories.filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Загрузка категорий...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ошибка загрузки</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
            >
              Закрыть
            </Button>
          </div>
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={loadCategories} className="mt-4">
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              Выбор категории 
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedRoom === 'orange' ? 'Аккредитованные' : 'Личные'} поставщики)
              </span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
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
        <div className="flex-1 overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              {searchQuery ? 'Категории не найдены' : 'Нет доступных категорий'}
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-2"
            }>
              {filteredCategories.map((category) => (
                <div
                  key={category.id || category.name}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 bg-white
                    ${viewMode === 'list' ? 'flex items-center' : ''}
                  `}
                  onClick={() => onCategorySelect(category)}
                >
                  <div className={`flex items-center ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {viewMode === 'list' && (
                    <div className="text-sm text-gray-400">
                      Выбрать →
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}