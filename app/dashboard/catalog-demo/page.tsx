'use client'

import { useState } from 'react'
import { VirtualProductList } from '@/components/catalog/VirtualProductList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Package, Zap } from 'lucide-react'

/**
 * Демо-страница для тестирования infinite scroll с виртуализацией
 *
 * URL: /dashboard/catalog-demo
 *
 * Тестирует:
 * - Загрузку 10000+ товаров
 * - Виртуализацию списка
 * - Infinite scroll
 * - Поиск и фильтрацию
 */
export default function CatalogDemoPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [category, setCategory] = useState<string | undefined>()

  // Дебаунс поиска
  const handleSearchChange = (value: string) => {
    setSearch(value)
    // Простой дебаунс
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
    return () => clearTimeout(timer)
  }

  // Выбор товара
  const handleProductSelect = (product: any) => {
    setSelectedProducts(prev =>
      prev.includes(product.id)
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    )
  }

  const categories = [
    'Электроника',
    'Текстиль и одежда',
    'Красота и здоровье',
    'Автотовары',
    'Спорт и отдых'
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-orange-500" />
            Каталог с Infinite Scroll
          </h1>
          <p className="text-gray-500 mt-2">
            Виртуализированный список с поддержкой 10000+ товаров
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">1483+</div>
              <div className="text-sm text-gray-500">Товаров в каталоге</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {selectedProducts.length}
              </div>
              <div className="text-sm text-gray-500">Выбрано товаров</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">50</div>
              <div className="text-sm text-gray-500">Товаров на страницу</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Поиск товаров..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category filters */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={!category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(undefined)}
                >
                  Все
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={category === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected products */}
        {selectedProducts.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">
                    Выбрано {selectedProducts.length} товаров
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                >
                  Очистить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Товары оранжевой комнаты
              {category && (
                <Badge variant="secondary">{category}</Badge>
              )}
              {debouncedSearch && (
                <Badge variant="outline">Поиск: {debouncedSearch}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VirtualProductList
              supplierType="verified"
              category={category}
              search={debouncedSearch}
              onProductSelect={handleProductSelect}
              selectedProductIds={selectedProducts}
              height={600}
              itemHeight={140}
              columns={1}
            />
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Как это работает</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-orange-500">1.</span>
                <span>
                  <strong>Cursor-based пагинация</strong> - API загружает по 50 товаров за раз
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">2.</span>
                <span>
                  <strong>Виртуализация</strong> - рендерятся только видимые элементы (~10-15 вместо 10000)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">3.</span>
                <span>
                  <strong>Infinite scroll</strong> - новые данные загружаются автоматически при скролле
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">4.</span>
                <span>
                  <strong>Кэширование</strong> - React Query кэширует данные на 30 секунд
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
