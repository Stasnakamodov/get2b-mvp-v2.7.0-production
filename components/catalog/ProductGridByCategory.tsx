'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { SearchBarWithCategories } from "@/src/shared/ui"
import ProductModal from "./ProductModal"
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  Star,
  ShoppingCart,
  Building2,
  Image as ImageIcon,
  Loader2,
  Check,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Product {
  id: string
  product_name: string
  description?: string
  price?: string
  currency?: string
  min_order?: string
  in_stock: boolean
  image_url?: string
  images?: string[]
  item_code?: string
  item_name?: string
  supplier_id: string
  supplier_name: string
  supplier_company_name?: string
  supplier_country?: string
  supplier_city?: string
  supplier_email?: string
  supplier_phone?: string
  supplier_website?: string
  supplier_rating?: number
  supplier_reviews?: number
  supplier_projects?: number
  room_type: 'verified' | 'user'
  room_icon: string
  room_description: string
}

interface CartItem extends Product {
  quantity: number
  total_price: number
}

interface ProductGridByCategoryProps {
  selectedCategory: string
  token: string
  onAddToCart: (product: Product, quantity?: number) => void
  cart: CartItem[]
  className?: string
  activeSupplier?: string | null
  isProductInCart?: (productId: string) => boolean
  selectedRoom?: string | null
  onProductClick?: (product: Product) => void
}

export default function ProductGridByCategory({
  selectedCategory,
  token,
  onAddToCart,
  cart,
  className,
  activeSupplier,
  isProductInCart: isProductInCartProp,
  selectedRoom,
  onProductClick
}: ProductGridByCategoryProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [roomFilter, setRoomFilter] = useState<'all' | 'verified' | 'user'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [quickFilters, setQuickFilters] = useState({
    inStock: false,
    verified: false,
    topRated: false
  })
  const [showOnlyActiveSupplier, setShowOnlyActiveSupplier] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearchSticky, setIsSearchSticky] = useState(false)

  // Мемоизированная функция загрузки товаров
  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Используем новый API products-by-category который возвращает полные данные с поставщиками
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Добавляем токен для авторизации
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else {
      }

      const url = selectedCategory
        ? `/api/catalog/products-by-category/${encodeURIComponent(selectedCategory)}?search=${searchQuery || ''}&limit=6000`
        : `/api/catalog/products-by-category?search=${searchQuery || ''}&limit=6000`

      console.log('🔍 Загружаю категорию:', selectedCategory, 'URL:', url) // Отладка категории
      const response = await fetch(url, { headers })


      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📡 Ответ API:', { success: data.success, count: data.products?.length }) // Временная отладка

      if (data.error) {
        console.error('❌ [ProductGrid] Ошибка в ответе API:', data.error)
        throw new Error(data.error)
      }

      const products = data.products || []

      // Проверка структуры данных

      // Преобразуем данные в нужный формат
      const formattedProducts: Product[] = products.map((product: any) => {
        return {
        id: product.id,
        product_name: product.name || product.product_name,
        description: product.description,
        price: product.price,
        currency: product.currency || 'RUB',
        min_order: product.min_order,
        in_stock: product.in_stock || true,
        image_url: (() => {
          // Парсим поле images из JSON
          try {
            const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
            return Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : null;
          } catch (e) {
            return null;
          }
        })(),
        images: (() => {
          // Парсим поле images из JSON
          try {
            const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
            return Array.isArray(parsedImages) ? parsedImages : [];
          } catch (e) {
            return [];
          }
        })(),
        item_code: product.item_code,
        item_name: product.item_name,
        supplier_id: product.supplier_id,
        supplier_name: product.supplier_name,
        supplier_company_name: product.supplier_company_name,
        supplier_country: product.supplier_country,
        supplier_city: product.supplier_city,
        supplier_email: product.supplier_email,
        supplier_phone: product.supplier_phone,
        supplier_website: product.supplier_website,
        supplier_rating: product.supplier_rating,
        supplier_reviews: product.supplier_reviews,
        supplier_projects: product.supplier_projects,
        room_type: product.room_type || 'verified' as const,
        room_icon: product.room_icon || '🟠',
        room_description: product.room_description || 'Аккредитованный поставщик'
      }
    }
  )

      console.log('📦 Загружено товаров:', formattedProducts.length) // Временная отладка
      setProducts(formattedProducts)

    } catch (err) {
      console.error('❌ [ProductGrid] Ошибка загрузки товаров:', err)
      setError(err instanceof Error ? err.message : 'Ошибка загрузки товаров')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, token, searchQuery])

  // Загрузка товаров при изменении категории
  useEffect(() => {
    // Загружаем товары всегда, даже если категория пустая (для отображения всех товаров)
    loadProducts()
  }, [loadProducts])

  // Загрузка доступных категорий
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/catalog/categories?simple=true')
      if (response.ok) {
        const data = await response.json()
        const categories = data.categories || []
        // Фильтруем тестовые категории для продакшена
        const filteredCats = categories.filter((cat: string) =>
          !cat.startsWith('ТЕСТ') || cat === 'ТЕСТОВАЯ'
        )
        setAvailableCategories(filteredCats)
      }
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err)
      // Используем дефолтные категории в случае ошибки
      setAvailableCategories([
        'Электроника',
        'Текстиль и одежда',
        'Строительство',
        'Продукты питания',
        'Автотовары',
        'Дом и быт',
        'Здоровье и медицина',
        'Промышленность',
        'ТЕСТОВАЯ'
      ])
    }
  }, [])

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Отслеживание скролла для sticky search bar с плавным переходом
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Проверяем, прокручена ли страница больше чем на 150px
          const scrolled = window.scrollY > 150
          setIsSearchSticky(scrolled)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Мемоизированная сортировка товаров
  const sortProducts = useCallback((productsToSort: Product[], sortType: string): Product[] => {
    const sorted = [...productsToSort]

    switch (sortType) {
      case 'name_asc':
        return sorted.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''))

      case 'name_desc':
        return sorted.sort((a, b) => (b.product_name || '').localeCompare(a.product_name || ''))

      case 'price_asc':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0')
          const priceB = parseFloat(b.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0')
          return priceA - priceB
        })

      case 'price_desc':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0')
          const priceB = parseFloat(b.price?.replace(/[^\d.,]/g, '').replace(',', '.') || '0')
          return priceB - priceA
        })

      case 'rating':
        return sorted.sort((a, b) => (b.supplier_rating || 0) - (a.supplier_rating || 0))

      case 'room_type':
        return sorted.sort((a, b) => {
          if (a.room_type === 'verified' && b.room_type === 'user') return -1
          if (a.room_type === 'user' && b.room_type === 'verified') return 1
          return 0
        })

      case 'default':
      default:
        return sorted.sort((a, b) => {
          // 1. Приоритет типа комнаты
          if (a.room_type === 'verified' && b.room_type === 'user') return -1
          if (a.room_type === 'user' && b.room_type === 'verified') return 1

          // 2. По рейтингу поставщика
          const ratingA = a.supplier_rating || 0
          const ratingB = b.supplier_rating || 0
          if (ratingA !== ratingB) return ratingB - ratingA

          // 3. По количеству проектов поставщика
          const projectsA = a.supplier_projects || 0
          const projectsB = b.supplier_projects || 0
          return projectsB - projectsA
        })
    }
  }, [])

  // Мемоизированная фильтрация товаров - ЗАМЕНЯЕТ useEffect
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // НОВОЕ: Фильтрация по активному поставщику (используем supplier_id)
    if (activeSupplier && showOnlyActiveSupplier) {
      filtered = filtered.filter(product =>
        product.supplier_id === activeSupplier
      )
    }

    // Фильтрация по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(product =>
        product.product_name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.supplier_name?.toLowerCase().includes(query) ||
        product.item_code?.toLowerCase().includes(query)
      )
    }

    // Фильтрация по типу комнаты
    if (roomFilter !== 'all') {
      filtered = filtered.filter(product => product.room_type === roomFilter)
    }

    // Быстрые фильтры
    if (quickFilters.inStock) {
      filtered = filtered.filter(product => product.in_stock)
    }
    if (quickFilters.verified) {
      filtered = filtered.filter(product => product.room_type === 'verified')
    }

    // Сортировка
    return sortProducts(filtered, sortBy)
  }, [products, searchQuery, roomFilter, sortBy, activeSupplier, quickFilters, showOnlyActiveSupplier, sortProducts])

  const handleAddToCart = useCallback((product: Product) => {
    // Проверяем, можно ли добавить товар (проверка поставщика происходит внутри onAddToCart)
    onAddToCart(product)
  }, [onAddToCart])

  // Обработчик открытия модального окна с товаром - MUST be before early returns
  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }, [])

  const isProductInCart = (productId: string): boolean => {
    // Если передана функция проверки из props (для модального окна), используем её
    if (isProductInCartProp) {
      return isProductInCartProp(productId)
    }
    // Иначе используем стандартную проверку по cart (для страницы каталога)
    return cart.some(item => item.id === productId)
  }

  const getCartQuantity = (productId: string): number => {
    // Если это модальное окно с внешней функцией isProductInCart
    // значит у нас есть проектная корзина, используем её
    if (isProductInCart && isProductInCart(productId)) {
      const item = cart.find(item => item.id === productId)
      return item?.quantity || 0
    }
    // Иначе используем стандартную проверку по cart (для страницы каталога)
    const item = cart.find(item => item.id === productId)
    return item?.quantity || 0
  }

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-center items-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-500 dark:text-gray-400">Загружаем товары...</p>
          </div>
        </div>
      </div>
    )
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-xl p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">❌ Ошибка загрузки товаров</div>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button
            onClick={loadProducts}
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  // Находим информацию о текущем активном поставщике
  const activeSupplierInfo = products.find(p => p.supplier_id === activeSupplier)
  const activeSupplierName = activeSupplierInfo?.supplier_name || activeSupplierInfo?.supplier_company_name || activeSupplier
  const activeSupplierProductsCount = products.filter(p => p.supplier_id === activeSupplier).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Индикатор активного поставщика - Premium Design */}
      <AnimatePresence mode="wait">
        {activeSupplier && (
          <motion.div
            key="supplier-filter"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Декоративный элемент */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full -mr-16 -mt-16"></div>

          <div className="relative p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Левая часть с информацией */}
              <div className="flex items-start lg:items-center gap-3">
                {/* Иконка */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>

                {/* Текстовая информация */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                        {showOnlyActiveSupplier ? 'Фильтр активен' : 'В корзине'}
                      </span>
                      <span className="text-base font-bold text-gray-900">
                        {activeSupplierName}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                      {activeSupplierProductsCount} {activeSupplierProductsCount === 1 ? 'товар' : activeSupplierProductsCount < 5 ? 'товара' : 'товаров'}
                    </span>
                  </div>

                  {/* Подсказка на мобильных */}
                  <div className="mt-2 lg:hidden">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Очистите корзину для смены поставщика
                    </span>
                  </div>
                </div>
              </div>

              {/* Правая часть с действиями */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowOnlyActiveSupplier(!showOnlyActiveSupplier)}
                  className={`
                    relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 text-center overflow-hidden
                    ${showOnlyActiveSupplier
                      ? 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                    }
                  `}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {showOnlyActiveSupplier ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Показать всех
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Только этот поставщик
                      </>
                    )}
                  </span>
                  {/* Эффект волны при клике */}
                  {!showOnlyActiveSupplier && (
                    <motion.div
                      className="absolute inset-0 bg-white opacity-25"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </motion.button>

                {/* Подсказка на десктопе */}
                <div className="hidden lg:flex items-center gap-3">
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
                  <span className="text-xs text-gray-500 flex items-center gap-1.5 max-w-[180px]">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Очистите корзину для смены поставщика</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Большая поисковая строка - используем CSS sticky вместо JavaScript */}
      <div className="sticky top-0 z-40 -mx-6 px-6 relative"
        style={{
          backgroundColor: isSearchSticky ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: isSearchSticky ? 'blur(12px)' : 'none',
          boxShadow: isSearchSticky ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
          paddingTop: isSearchSticky ? '0.75rem' : '1rem',
          paddingBottom: isSearchSticky ? '0.75rem' : '1rem',
          transition: 'background-color 600ms cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 600ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 600ms cubic-bezier(0.4, 0, 0.2, 1), padding 600ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Плавная рамка снизу */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"
          style={{
            opacity: isSearchSticky ? 1 : 0,
            transition: 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        ></div>
        <div className={`relative transition-all duration-300 ${isSearchSticky ? 'max-w-7xl mx-auto' : ''}`}>
          {/* Новая поисковая строка с категориями */}
          <SearchBarWithCategories
            value={searchQuery}
            onChange={setSearchQuery}
            onCategoryClick={(category) => {
              // При клике на категорию, обновляем URL без перезагрузки страницы
              if (category) {
                router.push(`/dashboard/catalog?category=${encodeURIComponent(category)}`, { scroll: false })
              } else {
                // Если выбрали "Все товары", очищаем фильтр категории
                router.push('/dashboard/catalog', { scroll: false })
              }
            }}
            placeholder="Поиск товаров по названию, поставщику или артикулу..."
            categories={availableCategories}
          />

          {/* Индикатор корзины в поисковой строке */}
          {cart.length > 0 && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center">
              <div className="relative p-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-md">
                <ShoppingCart className="h-4 w-4 text-white" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-md">
                  {cart.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Панель управления */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-6">
          <p className="text-lg font-semibold text-gray-900">
            {filteredProducts.length} товаров
          </p>

          {/* Быстрые фильтры */}
          <div className="flex gap-2">
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, inStock: !prev.inStock }))}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                quickFilters.inStock
                  ? 'bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700'
                  : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              ✓ В наличии
            </button>
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, verified: !prev.verified }))}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                quickFilters.verified
                  ? 'bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700'
                  : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              🟠 Проверенные
            </button>
            <button
              onClick={() => setSortBy(sortBy === 'rating' ? 'default' : 'rating')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                sortBy === 'rating'
                  ? 'bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700'
                  : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              ⭐ По рейтингу
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Кнопка фильтров */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all ${
              showFilters
                ? 'bg-black text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Все фильтры</span>
            {(() => {
              const activeCount = Object.values(quickFilters).filter(v => v).length +
                (roomFilter !== 'all' ? 1 : 0) +
                (sortBy !== 'default' ? 1 : 0);
              return activeCount > 0 ? (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{activeCount}</span>
              ) : null;
            })()}
          </button>

          {/* Переключатель вида */}
          <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Сетка"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Список"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Тип поставщика</label>
                  <select
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value as 'all' | 'verified' | 'user')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">Все поставщики</option>
                    <option value="verified">🟠 Аккредитованные</option>
                    <option value="user">🔵 Мои поставщики</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Сортировка</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="default">По релевантности</option>
                    <option value="name_asc">Название А-Я</option>
                    <option value="name_desc">Название Я-А</option>
                    <option value="price_asc">Цена ↑</option>
                    <option value="price_desc">Цена ↓</option>
                    <option value="rating">По рейтингу</option>
                    <option value="room_type">По типу поставщика</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Наличие</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">Все товары</option>
                    <option value="in_stock">В наличии</option>
                    <option value="on_order">Под заказ</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Список товаров */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-2">📦</div>
          <p className="text-gray-600 mb-1">Товары не найдены</p>
          <p className="text-sm text-gray-500">
            {searchQuery ?
              'Попробуйте изменить параметры поиска' :
              'В этой категории пока нет товаров'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch'
            : 'space-y-2'
        }>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={viewMode === 'grid' ? 'h-full' : ''}
            >
              {viewMode === 'grid' ? (
                <ProductCardGrid
                  product={product}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                  isInCart={isProductInCart(product.id)}
                  cartQuantity={getCartQuantity(product.id)}
                  isDisabled={activeSupplier !== null && product.supplier_id !== activeSupplier && !isProductInCart(product.id)}
                />
              ) : (
                <ProductCardList
                  product={product}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                  isInCart={isProductInCart(product.id)}
                  cartQuantity={getCartQuantity(product.id)}
                  isDisabled={activeSupplier !== null && product.supplier_id !== activeSupplier && !isProductInCart(product.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно с подробной информацией о товаре */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProduct(null)
        }}
        onAddToCart={onAddToCart}
        isInCart={selectedProduct ? isProductInCart(selectedProduct.id) : false}
      />
    </div>
  )
}

// Debounce timeout для кнопок добавления в корзину
const ADD_TO_CART_DEBOUNCE_MS = 300

// Компонент карточки товара в режиме сетки с optimistic UI
function ProductCardGrid({
  product,
  onProductClick,
  onAddToCart,
  isInCart,
  cartQuantity,
  isDisabled
}: {
  product: Product
  onProductClick?: (product: Product) => void
  onAddToCart: (product: Product) => void
  isInCart: boolean
  cartQuantity: number
  isDisabled?: boolean
}) {
  const [isAdding, setIsAdding] = useState(false)
  const addingRef = useRef(false)

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    // Debounce: блокируем повторные клики
    if (addingRef.current || isDisabled || isInCart) return
    addingRef.current = true
    setIsAdding(true)

    // Optimistic UI: сразу показываем состояние "добавляется"
    onAddToCart(product)

    // Снимаем блокировку через debounce timeout
    setTimeout(() => {
      addingRef.current = false
      setIsAdding(false)
    }, ADD_TO_CART_DEBOUNCE_MS)
  }, [product, onAddToCart, isDisabled, isInCart])

  return (
    <div
      onClick={() => onProductClick && onProductClick(product)}
      className={`h-full flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden rounded-lg cursor-pointer ${
      isInCart
        ? 'bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200'
        : 'bg-white hover:bg-gray-50'
    }`}>
        {/* Изображение товара */}
        <div className="relative h-48 bg-gray-100 overflow-hidden flex-shrink-0">
          {(product.images && product.images.length > 0) ? (
            <img
              src={product.images[0]}
              alt={product.product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
          ) : product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`flex items-center justify-center h-full fallback-icon ${((product.images && product.images.length > 0) || product.image_url) ? 'hidden' : ''}`}>
            <ImageIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          </div>

          {/* Индикатор комнаты */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-medium bg-white/95 backdrop-blur-sm rounded-md shadow-sm">
              {product.room_icon} {product.room_type === 'verified' ? 'Проверенный' : 'Мой'}
            </span>
          </div>

          {/* Рейтинг */}
          {product.supplier_rating && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 text-xs font-medium bg-white/95 backdrop-blur-sm rounded-md shadow-sm flex items-center">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-current mr-1" />
                {product.supplier_rating}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          {/* Основной контент карточки - растягивается */}
          <div className="flex-grow space-y-2">
            {/* Название товара - ВСЕГДА занимает высоту 2 строк */}
            <h3 className="font-medium text-base text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
              {product.product_name}
            </h3>

            {/* Поставщик - фиксированная высота */}
            <p className="text-sm text-gray-500 line-clamp-1 min-h-[1.25rem]">
              {product.supplier_name}
            </p>

            {/* Цена - фиксированная высота блока */}
            <div className="min-h-[1.75rem]">
              {product.price && (
                <div className="font-semibold text-lg text-gray-900">
                  {product.price} {product.currency || ''}
                </div>
              )}
            </div>

            {/* MOQ и наличие - фиксированная высота */}
            <div className="flex items-center justify-between text-xs text-gray-500 min-h-[1rem]">
              {product.min_order && (
                <span>MOQ: {product.min_order}</span>
              )}
              {product.in_stock && (
                <span className="text-green-600 font-medium">В наличии</span>
              )}
            </div>
          </div>

          {/* Кнопка добавления в корзину - всегда внизу с optimistic UI */}
          <button
            onClick={handleAddToCart}
            disabled={isDisabled || isAdding}
            className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 mt-3 flex items-center justify-center gap-2 ${
              isInCart
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-md'
                : isAdding
                  ? 'bg-gradient-to-r from-violet-400 to-indigo-400 text-white cursor-wait'
                : isDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transform hover:scale-[1.02] hover:shadow-lg'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4" />
                В корзине ({cartQuantity})
              </>
            ) : isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Добавляю...
              </>
            ) : isDisabled ? (
              <>
                <X className="w-4 h-4" />
                Недоступно
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                В корзину
              </>
            )}
          </button>
        </div>
    </div>
  )
}

// Компонент карточки товара в режиме списка с optimistic UI
function ProductCardList({
  product,
  onProductClick,
  onAddToCart,
  isInCart,
  cartQuantity,
  isDisabled
}: {
  product: Product
  onProductClick?: (product: Product) => void
  onAddToCart: (product: Product) => void
  isInCart: boolean
  cartQuantity: number
  isDisabled?: boolean
}) {
  const [isAdding, setIsAdding] = useState(false)
  const addingRef = useRef(false)

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    // Debounce: блокируем повторные клики
    if (addingRef.current || isDisabled || isInCart) return
    addingRef.current = true
    setIsAdding(true)

    // Optimistic UI: сразу показываем состояние "добавляется"
    onAddToCart(product)

    // Снимаем блокировку через debounce timeout
    setTimeout(() => {
      addingRef.current = false
      setIsAdding(false)
    }, ADD_TO_CART_DEBOUNCE_MS)
  }, [product, onAddToCart, isDisabled, isInCart])

  return (
    <div
      onClick={() => onProductClick && onProductClick(product)}
      className={`hover:shadow-sm transition-all duration-200 rounded-lg cursor-pointer ${
      isInCart
        ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200'
        : 'bg-white hover:bg-gray-50'
    }`}>
      <div className="p-3">
        <div className="flex items-center space-x-3">
          {/* Изображение */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
              {(product.images && product.images.length > 0) ? (
                <img
                  src={product.images[0]}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`flex items-center justify-center h-full fallback-icon ${((product.images && product.images.length > 0) || product.image_url) ? 'hidden' : ''}`}>
                <ImageIcon className="h-6 w-6 text-gray-300" />
              </div>
            </div>
          </div>

          {/* Основная информация */}
          <div className="flex-grow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
                  {product.product_name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">{product.supplier_name}</span>
                  <span className="text-xs">{product.room_icon}</span>
                  {product.supplier_rating && (
                    <span className="text-xs text-gray-600 flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-current mr-0.5" />
                      {product.supplier_rating}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {product.price && (
                  <span className="font-semibold text-sm text-gray-900">
                    {product.price} {product.currency || ''}
                  </span>
                )}

                {product.min_order && (
                  <span>MOQ: {product.min_order}</span>
                )}

                {product.in_stock && (
                  <span className="text-green-600 font-medium">В наличии</span>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isDisabled || isAdding}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  isInCart
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                    : isAdding
                      ? 'bg-gradient-to-r from-violet-400 to-indigo-400 text-white cursor-wait'
                    : isDisabled
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 hover:shadow-md transform hover:scale-[1.02]'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    В корзине ({cartQuantity})
                  </>
                ) : isAdding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Добавляю...
                  </>
                ) : isDisabled ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    Недоступно
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    В корзину
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
