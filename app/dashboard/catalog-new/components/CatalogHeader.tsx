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
  Grid3X3,
  Grid2X2,
  List,
  X,
  ShoppingCart
} from 'lucide-react'
import { SORT_OPTIONS, SEARCH_DEBOUNCE_MS } from '@/lib/catalog/constants'
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

  // Синхронизация searchInput при внешнем сбросе filters.search (например, при клике по категории)
  useEffect(() => {
    if (!filters.search && searchInput) {
      setSearchInput('')
    }
  }, [filters.search]) // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Нижняя строка: быстрые фильтры и сортировка */}
      <div className="px-4 py-2 flex items-center gap-3 flex-wrap border-t">
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
      </div>
    </div>
  )
}

export default CatalogHeader
