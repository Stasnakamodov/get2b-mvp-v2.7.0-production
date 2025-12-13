import { logger } from "@/src/shared/lib/logger"
'use client'

import React, { useState, useEffect } from 'react'
import { Search, Package, Building, Filter, Grid3X3, List } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from '@/lib/supabaseClient'
import type { CatalogCategory } from '@/lib/types'
interface Product {
  id: string
  name: string
  description: string
  price: string
  currency: string
  min_order: string
  in_stock: boolean
  image_url: string
  supplier: {
    id: string
    name: string
    company_name: string
    category: string
    country: string
    city: string
  }
  room_type: 'verified' | 'user'
  room_icon: string
  room_description: string
}

export default function NewCatalogPage() {
  // Состояния
  const [selectedRoom, setSelectedRoom] = useState<'verified' | 'user'>('verified')
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Загружаем категории при загрузке страницы
  useEffect(() => {
    loadCategories()
  }, [])

  // Загружаем товары при смене категории или комнаты
  useEffect(() => {
    if (selectedCategory) {
      loadProducts()
    }
  }, [selectedCategory, selectedRoom])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/catalog/categories')
      const data = await response.json()
      
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      logger.error('Ошибка загрузки категорий:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    if (!selectedCategory) return
    
    try {
      setLoadingProducts(true)
      
      // Получаем токен если нужен для user комнаты
      let authToken = null
      if (selectedRoom === 'user') {
        const { data: { session } } = await supabase.auth.getSession()
        authToken = session?.access_token
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(
        `/api/catalog/simple-products?category_id=${selectedCategory.id}&search=${searchQuery}`,
        { headers }
      )
      
      const data = await response.json()
      
      if (data.success) {
        // Фильтруем по выбранной комнате
        const filteredProducts = data.products.filter(
          (p: Product) => p.room_type === selectedRoom
        )
        setProducts(filteredProducts)
      }
    } catch (error) {
      logger.error('Ошибка загрузки товаров:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleCategorySelect = (category: CatalogCategory) => {
    setSelectedCategory(category)
    setProducts([])
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setProducts([])
  }

  const handleRoomChange = (room: 'verified' | 'user') => {
    setSelectedRoom(room)
    if (selectedCategory) {
      setProducts([]) // Очищаем товары для перезагрузки
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Заголовок и фильтр комнат */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {selectedCategory && (
              <Button
                onClick={handleBackToCategories}
                variant="outline"
                size="sm"
              >
                ← Назад к категориям
              </Button>
            )}
            <h1 className="text-2xl font-bold">
              {selectedCategory ? selectedCategory.name : 'Каталог товаров'}
            </h1>
          </div>

          {/* Переключатель комнат */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Комната:</span>
            <Button
              onClick={() => handleRoomChange('verified')}
              variant={selectedRoom === 'verified' ? 'default' : 'outline'}
              size="sm"
              className={selectedRoom === 'verified' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              🧡 Аккредитованные
            </Button>
            <Button
              onClick={() => handleRoomChange('user')}
              variant={selectedRoom === 'user' ? 'default' : 'outline'}
              size="sm"
              className={selectedRoom === 'user' ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              🔵 Личные
            </Button>
          </div>
        </div>

        {/* Поиск и инструменты */}
        {selectedCategory && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && loadProducts()}
              />
            </div>
            <Button onClick={loadProducts} variant="outline" size="sm">
              Найти
            </Button>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setViewMode('grid')}
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {!selectedCategory ? (
          /* Показываем категории */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                    <span className="text-xl">
                      {category.icon || '📦'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                      {category.name}
                    </h3>
                    
                    {category.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {category.products_count || 0} товаров
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {category.suppliers_count || 0} поставщиков
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Показываем товары выбранной категории */
          <div>
            {loadingProducts ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Загружаем товары...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {searchQuery 
                    ? `Товары не найдены по запросу "${searchQuery}"` 
                    : `В категории "${selectedCategory.name}" пока нет товаров`
                  }
                </p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={
                      viewMode === 'grid'
                        ? "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        : "bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                    }
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={viewMode === 'grid' ? "w-full h-32 object-cover rounded mb-3" : "w-16 h-16 object-cover rounded flex-shrink-0"}
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 line-clamp-2">
                          {product.name}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 ml-2">
                          {product.room_icon}
                        </span>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-600">
                          {product.price} {product.currency}
                        </span>
                        <span className="text-xs text-gray-400">
                          {product.supplier?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}