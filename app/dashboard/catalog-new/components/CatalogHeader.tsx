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
    <>
      {/* Search */}
      <div className="relative flex-1 min-w-0 max-w-md">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          placeholder="Поиск товаров..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="pl-8 pr-8 h-8 text-sm"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* In Stock filter */}
      <Button
        variant={filters.inStock ? 'default' : 'outline'}
        size="sm"
        className={`h-8 text-xs shrink-0 ${filters.inStock ? 'bg-green-500 hover:bg-green-600' : ''}`}
        onClick={() => onFiltersChange({
          ...filters,
          inStock: filters.inStock ? undefined : true
        })}
      >
        В наличии
      </Button>

      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" className="h-8 text-xs shrink-0" onClick={handleResetFilters}>
          <X className="h-3.5 w-3.5 mr-1" />
          Сбросить
        </Button>
      )}

      <div className="flex-1" />

      {/* Sort */}
      <Select
        value={`${sort.field}-${sort.order}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
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

      {/* View mode */}
      <div className="flex items-center border rounded-md shrink-0">
        <Button
          variant={viewMode === 'grid-4' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-r-none h-8 w-8 p-0 ${viewMode === 'grid-4' ? 'bg-orange-500' : ''}`}
          onClick={() => onViewModeChange('grid-4')}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={viewMode === 'grid-2' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-none border-x h-8 w-8 p-0 ${viewMode === 'grid-2' ? 'bg-orange-500' : ''}`}
          onClick={() => onViewModeChange('grid-2')}
        >
          <Grid2X2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-l-none h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-orange-500' : ''}`}
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Cart */}
      <button
        onClick={onCartClick}
        className={`relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          cartItemsCount > 0
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <ShoppingCart className="h-4 w-4" />
        {cartItemsCount > 0 && (
          <span>{cartItemsCount}</span>
        )}
      </button>
    </>
  )
}

export default CatalogHeader
