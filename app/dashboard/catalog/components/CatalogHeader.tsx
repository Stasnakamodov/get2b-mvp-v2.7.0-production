'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  List,
  X,
  ShoppingCart,
  Heart,
  Globe,
  Camera,
  Link2,
  Upload,
  Send,
  Loader2,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { SORT_OPTIONS, SEARCH_DEBOUNCE_MS, SUPPLIER_COUNTRIES } from '@/lib/catalog/constants'
import { PriceFilterPopover } from './PriceFilterPopover'
import type { CatalogProduct, CatalogFilters, CatalogSort, CatalogViewMode, FacetCount } from '@/lib/catalog/types'

export type SearchMode = 'normal' | 'image-search' | 'url-search'

const PLACEHOLDERS = [
  'Поиск товаров, поставщиков, артикулов...',
  'Загрузите фото — найдем товар...',
  'Вставьте ссылку — найдем аналоги дешевле...',
  'Ищите по фото, ссылке или названию...',
]

type ActiveTool = 'search' | 'photo' | 'link' | 'supplier' | null

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
  onSearchResults?: (products: CatalogProduct[], mode: SearchMode) => void
  onSupplierInquiry?: (query: string) => Promise<boolean>
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
  onSearchResults,
  onSupplierInquiry,
}: CatalogHeaderProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [mounted, setMounted] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [supplierQuery, setSupplierQuery] = useState('')
  const [supplierSubmitted, setSupplierSubmitted] = useState(false)
  const modalInputRef = useRef<HTMLInputElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Sync external filter clear
  useEffect(() => {
    if (!filters.search && searchInput) {
      setSearchInput('')
    }
  }, [filters.search])

  // Debounced search (only when modal is closed — live filtering)
  useEffect(() => {
    if (isModalOpen) return
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput || undefined })
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, isModalOpen, filters, onFiltersChange])

  // Animated placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isModalOpen])

  const openModal = () => {
    setIsModalOpen(true)
    setActiveTool('search')
    setTimeout(() => modalInputRef.current?.focus(), 100)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setActiveTool(null)
  }

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      onFiltersChange({ ...filters, search: searchInput.trim() })
      closeModal()
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
    if (option) onSortChange(option.value)
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

  // Image search
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимум 10MB')
        return
      }
      setSelectedImage(file)
    }
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
    })

  const handleImageSearch = async () => {
    if (!selectedImage) return
    setIsLoading(true)
    try {
      const base64 = await fileToBase64(selectedImage)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/catalog/search-by-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64 }),
      })
      if (!res.ok) throw new Error('Ошибка поиска')
      const data = await res.json()
      onSearchResults?.(data.products || [], 'image-search')
      setSelectedImage(null)
      closeModal()
    } catch {
      alert('Не удалось выполнить поиск. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlSearch = async () => {
    if (!urlInput.trim()) return
    setIsLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/catalog/search-by-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: urlInput }),
      })
      if (!res.ok) throw new Error('Ошибка поиска')
      const data = await res.json()
      onSearchResults?.(data.products || [], 'url-search')
      setUrlInput('')
      closeModal()
    } catch {
      alert('Не удалось выполнить поиск. Проверьте URL.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSupplierSubmit = async () => {
    if (!supplierQuery.trim()) return
    setIsLoading(true)
    try {
      if (onSupplierInquiry) {
        const ok = await onSupplierInquiry(supplierQuery.trim())
        if (ok) {
          setSupplierSubmitted(true)
          setSupplierQuery('')
          setTimeout(() => { setSupplierSubmitted(false); closeModal() }, 2000)
        }
      }
    } catch {
      alert('Не удалось отправить заявку. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }

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
      {/* ===== Search bar (pill-style like spectorg) ===== */}
      <div className="relative flex-1 min-w-0 group">
        <div
          onClick={openModal}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow cursor-text w-full"
        >
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1 text-sm text-gray-400 truncate transition-all duration-300">
            {searchInput || PLACEHOLDERS[placeholderIndex]}
          </span>
          {searchInput && (
            <span className="text-sm text-gray-900 font-medium truncate max-w-[200px]">
              {searchInput}
            </span>
          )}

          {/* Tool icons */}
          <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveTool('photo'); setIsModalOpen(true) }}
              className="p-1.5 rounded-full hover:bg-blue-50 transition-colors"
              title="Поиск по фото"
            >
              <Camera className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveTool('link'); setIsModalOpen(true) }}
              className="p-1.5 rounded-full hover:bg-green-50 transition-colors"
              title="Поиск по ссылке"
            >
              <Link2 className="h-3.5 w-3.5 text-gray-400 hover:text-green-600" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveTool('supplier'); setIsModalOpen(true) }}
              className="p-1.5 rounded-full hover:bg-orange-50 transition-colors"
              title="Найти поставщика"
            >
              <Globe className="h-3.5 w-3.5 text-gray-400 hover:text-orange-600" />
            </button>
          </div>
        </div>

        {/* Clear button when search is active */}
        {searchInput && (
          <button
            onClick={(e) => { e.stopPropagation(); handleClearSearch() }}
            className="absolute right-24 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs shrink-0 gap-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Фильтры
              {activeFiltersCount > 0 && (
                <span className="ml-0.5 bg-gray-900 text-white text-[10px] rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none px-1.5 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3 space-y-3">
            {/* In Stock */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">В наличии</span>
              <Button
                variant={filters.inStock ? 'default' : 'outline'}
                size="sm"
                className={`h-8 rounded-lg text-xs ${filters.inStock ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={() => onFiltersChange({ ...filters, inStock: filters.inStock ? undefined : true })}
              >
                {filters.inStock ? 'Да' : 'Все'}
              </Button>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <span className="text-sm text-gray-700">Цена</span>
              <PriceFilterPopover
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onApply={handlePriceApply}
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <span className="text-sm text-gray-700">Страна</span>
              <Select value={filters.country || '__all__'} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-full h-9 rounded-lg text-xs border-gray-200">
                  <Globe className="h-3 w-3 mr-1.5 shrink-0" />
                  <SelectValue placeholder="Все страны" />
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

            {/* Sort */}
            <div className="space-y-1.5">
              <span className="text-sm text-gray-700">Сортировка</span>
              <Select value={`${sort.field}-${sort.order}`} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full h-9 rounded-lg text-xs">
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
            </div>

            {/* Reset */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" className="w-full h-8 rounded-lg text-xs" onClick={handleResetFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Сбросить все фильтры
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {/* View mode */}
        <div className="hidden sm:flex items-center rounded-xl overflow-hidden border border-gray-200 shrink-0">
          <Button
            variant={viewMode === 'grid-4' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-none h-9 w-9 p-0 ${viewMode === 'grid-4' ? 'bg-gray-900 text-white' : ''}`}
            onClick={() => onViewModeChange('grid-4')}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-none border-l h-9 w-9 p-0 ${viewMode === 'list' ? 'bg-gray-900 text-white' : ''}`}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Wishlist */}
        <button
          onClick={onWishlistClick}
          className={`relative shrink-0 flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-300 ${
            wishlistCount > 0
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-current' : ''}`} />
          {wishlistCount > 0 && <span>{wishlistCount}</span>}
        </button>

        {/* Cart */}
        <button
          onClick={onCartClick}
          className={`relative shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            cartItemsCount > 0
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {cartItemsCount > 0 && <span>{cartItemsCount}</span>}
        </button>
      </div>

      {/* ===== Search Modal (portal) ===== */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />

          {/* Modal content */}
          <div
            ref={modalContentRef}
            className="relative bg-white shadow-2xl animate-in slide-in-from-top duration-300 z-10"
          >
            {/* Search input row */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSearch} className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={modalInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={PLACEHOLDERS[placeholderIndex]}
                    className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 placeholder:text-gray-400"
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTool(activeTool === 'photo' ? 'search' : 'photo')}
                      className={`p-2 rounded-full transition-colors ${
                        activeTool === 'photo' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Поиск по фото"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool(activeTool === 'supplier' ? 'search' : 'supplier')}
                      className={`p-2 rounded-full transition-colors ${
                        activeTool === 'supplier' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Найти поставщика"
                    >
                      <Globe className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool(activeTool === 'link' ? 'search' : 'link')}
                      className={`p-2 rounded-full transition-colors ${
                        activeTool === 'link' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Поиск по ссылке"
                    >
                      <Link2 className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Tool: Text search — promo */}
            {activeTool === 'search' && (
              <div className="p-5 max-w-4xl mx-auto">
                <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold text-base mb-1">Не можете найти товар?</h3>
                    <p className="text-gray-500 text-sm mb-3">Введите запрос и нажмите Enter для поиска по каталогу</p>
                    {searchInput.trim() && (
                      <button
                        onClick={() => { onFiltersChange({ ...filters, search: searchInput.trim() }); closeModal() }}
                        className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                      >
                        Найти &laquo;{searchInput.trim()}&raquo;
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tool: Photo search */}
            {activeTool === 'photo' && (
              <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold text-base mb-0.5">Поиск по фотографии</h3>
                    <p className="text-gray-500 text-sm">Загрузите фото товара — найдём аналоги в каталоге</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200 hover:border-gray-300 transition-colors">
                  <label className="flex flex-col items-center gap-3 cursor-pointer">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                      <Upload className="w-7 h-7 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <span className="text-gray-900 text-sm font-medium block mb-0.5">
                        {selectedImage ? selectedImage.name : 'Загрузить фотографию'}
                      </span>
                      <span className="text-gray-400 text-xs">JPG, PNG или WEBP до 10MB</span>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleImageSearch}
                    disabled={!selectedImage || isLoading}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Ищем...</> : <>Найти товар <ChevronRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Tool: URL search */}
            {activeTool === 'link' && (
              <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
                    <Link2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold text-base mb-0.5">Поиск по ссылке</h3>
                    <p className="text-gray-500 text-sm">Вставьте ссылку на товар — найдём аналоги дешевле</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-200">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://aliexpress.com/item/..."
                    className="w-full bg-transparent border-none outline-none text-gray-900 text-sm placeholder:text-gray-400"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleUrlSearch}
                    disabled={!urlInput.trim() || isLoading}
                    className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Ищем...</> : <>Найти аналоги <ChevronRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Tool: Supplier search */}
            {activeTool === 'supplier' && (
              <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 bg-orange-600 rounded-xl flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold text-base mb-0.5">Найти поставщика</h3>
                    <p className="text-gray-500 text-sm">Опишите нужный товар — найдём надёжного поставщика</p>
                  </div>
                </div>
                {supplierSubmitted ? (
                  <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                    <div className="text-3xl mb-2">✅</div>
                    <h4 className="text-green-800 font-semibold text-base mb-1">Заявка отправлена!</h4>
                    <p className="text-green-600 text-sm">Мы свяжемся с вами в ближайшее время</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-200">
                      <textarea
                        value={supplierQuery}
                        onChange={(e) => setSupplierQuery(e.target.value)}
                        placeholder="Опишите товар, который вам нужен..."
                        rows={3}
                        className="w-full bg-transparent border-none outline-none text-gray-900 text-sm placeholder:text-gray-400 resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSupplierSubmit}
                        disabled={!supplierQuery.trim() || isLoading}
                        className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-orange-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Отправляем...</> : <>Оставить заявку <Send className="h-4 w-4" /></>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default CatalogHeader
