'use client'

import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  ShoppingCart,
  Heart,
  Globe,
} from 'lucide-react'
import { SORT_OPTIONS, SEARCH_DEBOUNCE_MS, SUPPLIER_COUNTRIES } from '@/lib/catalog/constants'
import { PriceFilterPopover } from './PriceFilterPopover'
import type { CatalogFilters, CatalogSort, CatalogViewMode, FacetCount } from '@/lib/catalog/types'

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
  wishlistCount?: number
  onWishlistClick?: () => void
  countryCounts?: FacetCount[]
}

export function CatalogHeader({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalProducts,
  cartItemsCount = 0,
  onCartClick,
  wishlistCount = 0,
  onWishlistClick,
  countryCounts,
}: CatalogHeaderProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')

  useEffect(() => {
    if (!filters.search && searchInput) {
      setSearchInput('')
    }
  }, [filters.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput || undefined })
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput, filters, onFiltersChange])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFiltersChange({ ...filters, search: searchInput || undefined })
    }
  }, [searchInput, filters, onFiltersChange])

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    onFiltersChange({ ...filters, search: undefined })
  }, [filters, onFiltersChange])

  const handleSortChange = useCallback((value: string) => {
    const option = SORT_OPTIONS.find(o =>
      `${o.value.field}-${o.value.order}` === value
    )
    if (option) {
      onSortChange(option.value)
    }
  }, [onSortChange])

  const handleResetFilters = useCallback(() => {
    setSearchInput('')
    onFiltersChange({})
  }, [onFiltersChange])

  const handlePriceApply = useCallback((min?: number, max?: number) => {
    onFiltersChange({ ...filters, minPrice: min, maxPrice: max })
  }, [filters, onFiltersChange])

  const handleCountryChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, country: value === '__all__' ? undefined : value })
  }, [filters, onFiltersChange])

  const activeFiltersCount = [
    filters.search,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.country,
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

      {/* Price filter - hidden on mobile */}
      <div className="hidden sm:block">
        <PriceFilterPopover
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onApply={handlePriceApply}
        />
      </div>

      {/* Country filter - hidden on mobile */}
      <div className="hidden sm:block">
        <Select
          value={filters.country || '__all__'}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Globe className="h-3 w-3 mr-1 shrink-0" />
            <SelectValue placeholder="Страна" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Все страны</SelectItem>
            {SUPPLIER_COUNTRIES.map(c => {
              const count = countryCounts?.find(fc => fc.name === c)?.count
              return (
                <SelectItem key={c} value={c}>
                  {c}{count !== undefined ? ` (${count})` : ''}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

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

      {/* View mode - hidden on mobile */}
      <div className="hidden sm:flex items-center border rounded-md shrink-0">
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

      {/* Wishlist */}
      <button
        onClick={onWishlistClick}
        className={`relative shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
          wishlistCount > 0
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Heart className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-current' : ''}`} />
        {wishlistCount > 0 && (
          <span>{wishlistCount}</span>
        )}
      </button>

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
