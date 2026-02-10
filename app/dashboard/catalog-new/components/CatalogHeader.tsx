'use client'

import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  Grid2X2,
  List,
  X,
  ShoppingCart
} from 'lucide-react'
import { SORT_OPTIONS, DEFAULT_CATEGORIES, SEARCH_DEBOUNCE_MS } from '@/lib/catalog/constants'
import type { CatalogFilters, CatalogSort, CatalogViewMode } from '@/lib/catalog/types'

interface CatalogHeaderProps {
  filters: CatalogFilters
  onFiltersChange: (filters: CatalogFilters) => void
  sort: CatalogSort
  onSortChange: (sort: CatalogSort) => void
  viewMode: CatalogViewMode
  onViewModeChange: (mode: CatalogViewMode) => void
  totalProducts: number
  cartItemsCount?: number
  onCartClick?: () => void
}

/**
 * Шапка каталога с поиском, фильтрами и сортировкой
 */
export function CatalogHeader({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalProducts,
  cartItemsCount = 0,
  onCartClick
}: CatalogHeaderProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput || undefined })
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput, filters, onFiltersChange])

  // Обработчик поиска по Enter
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFiltersChange({ ...filters, search: searchInput || undefined })
    }
  }, [searchInput, filters, onFiltersChange])

  // Очистка поиска
  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    onFiltersChange({ ...filters, search: undefined })
  }, [filters, onFiltersChange])

  // Изменение категории (очищаем subcategory при смене)
  const handleCategoryChange = useCallback((value: string) => {
    onFiltersChange({
      ...filters,
      category: value === 'all' ? undefined : value,
      subcategory: undefined
    })
  }, [filters, onFiltersChange])

  // Изменение сортировки
  const handleSortChange = useCallback((value: string) => {
    const option = SORT_OPTIONS.find(o =>
      `${o.value.field}-${o.value.order}` === value
    )
    if (option) {
      onSortChange(option.value)
    }
  }, [onSortChange])

  // Сброс фильтров
  const handleResetFilters = useCallback(() => {
    setSearchInput('')
    onFiltersChange({})
  }, [onFiltersChange])

  // Количество активных фильтров
  const activeFiltersCount = [
    filters.search,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.country
  ].filter(Boolean).length

  return (
    <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-10">
      {/* Верхняя строка: поиск и корзина */}
      <div className="px-4 py-3 flex items-center gap-4">
        {/* Поиск */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск товаров..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Корзина */}
        <Button
          variant="outline"
          className="relative"
          onClick={onCartClick}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-orange-500">
              {cartItemsCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Нижняя строка: фильтры и сортировка */}
      <div className="px-4 py-2 flex items-center gap-3 flex-wrap border-t">
        {/* Категория */}
        <Select
          value={filters.category || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {DEFAULT_CATEGORIES.map(cat => (
              <SelectItem key={cat.key} value={cat.name}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick: In Stock */}
        <Button
          variant={filters.inStock ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFiltersChange({
            ...filters,
            inStock: filters.inStock ? undefined : true
          })}
          className={filters.inStock ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          В наличии
        </Button>

        {/* Кнопка фильтров */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-orange-500 hover:bg-orange-600' : ''}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-orange-600">{activeFiltersCount}</Badge>
          )}
        </Button>

        {/* Сброс фильтров */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Сбросить
          </Button>
        )}

        {/* Разделитель */}
        <div className="flex-1" />

        {/* Сортировка */}
        <Select
          value={`${sort.field}-${sort.order}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem
                key={`${option.value.field}-${option.value.order}`}
                value={`${option.value.field}-${option.value.order}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Переключатель вида */}
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === 'grid-4' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-r-none ${viewMode === 'grid-4' ? 'bg-orange-500' : ''}`}
            onClick={() => onViewModeChange('grid-4')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid-2' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-none border-x ${viewMode === 'grid-2' ? 'bg-orange-500' : ''}`}
            onClick={() => onViewModeChange('grid-2')}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-l-none ${viewMode === 'list' ? 'bg-orange-500' : ''}`}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Счётчик товаров */}
        <span className="text-sm text-gray-500">
          {totalProducts.toLocaleString()} товаров
        </span>
      </div>

      {/* Расширенные фильтры */}
      {showFilters && (
        <div className="px-4 py-3 border-t bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Цена от */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Цена:</span>
              <Input
                type="number"
                placeholder="от"
                className="w-24"
                value={filters.minPrice || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  minPrice: e.target.value ? Number(e.target.value) : undefined
                })}
              />
              <span>—</span>
              <Input
                type="number"
                placeholder="до"
                className="w-24"
                value={filters.maxPrice || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined
                })}
              />
            </div>

            {/* В наличии */}
            <Button
              variant={filters.inStock ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltersChange({
                ...filters,
                inStock: filters.inStock ? undefined : true
              })}
              className={filters.inStock ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              В наличии
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogHeader
