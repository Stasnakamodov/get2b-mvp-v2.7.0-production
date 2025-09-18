'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Star,
  Package,
  ShoppingCart,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Award,
  Eye,
  MessageCircle,
  Plus,
  Image as ImageIcon,
  Loader2
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
  onAddToCart: (product: Product) => void
  cart: CartItem[]
  className?: string
  selectedRoom?: 'orange' | 'blue'
  activeSupplier?: string | null
  isProductInCart?: (productId: string) => boolean
}

interface APIResponse {
  success: boolean
  category: string
  products: Product[]
  suppliers: any[]
  pagination: {
    limit: number
    offset: number
    total: number
    has_more: boolean
  }
  summary: {
    total_products: number
    suppliers_count: number
    verified_products: number
    user_products: number
    execution_time_ms: number
  }
  error?: string
  details?: string
}

export default function ProductGridByCategory({ 
  selectedCategory, 
  token,
  onAddToCart,
  cart,
  className,
  selectedRoom,
  activeSupplier,
  isProductInCart: isProductInCartProp
}: ProductGridByCategoryProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [roomFilter, setRoomFilter] = useState<'all' | 'verified' | 'user'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Загрузка товаров при изменении категории
  useEffect(() => {
    loadProducts()
  }, [selectedCategory, token])

  // Фильтрация товаров при изменении поискового запроса или фильтров
  useEffect(() => {
    console.log('🔍 [ProductGrid] activeSupplier изменился на:', activeSupplier)
    filterProducts()
  }, [products, searchQuery, roomFilter, sortBy, activeSupplier])

  const loadProducts = async () => {
    if (!selectedCategory) return
    
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
      }

      const response = await fetch(`/api/catalog/products-by-category/${encodeURIComponent(selectedCategory)}?search=${searchQuery || ''}&limit=100`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const products = data.products || []
      console.log(`📦 [ProductGrid] Товары категории "${selectedCategory}" загружены:`, products.length)
      
      // Логируем первый товар для проверки структуры данных
      if (products.length > 0) {
        console.log('🔍 [ProductGrid] Пример товара из API (RAW):', products[0])
        console.log('🔍 [ProductGrid] Supplier данные:', {
          supplier_name: products[0].supplier_name,
          supplier_company_name: products[0].supplier_company_name,
          supplier_id: products[0].supplier_id
        })
      }
      
      // Преобразуем данные в нужный формат
      const formattedProducts: Product[] = products.map((product: any) => {
        console.log('🔍 [DEBUG] Форматирование товара:', {
          original_supplier_name: product.supplier_name,
          original_supplier_company_name: product.supplier_company_name
        })
        
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

      console.log('🔍 [ProductGrid] Первый товар ПОСЛЕ форматирования:', formattedProducts[0])
      setProducts(formattedProducts)
      
    } catch (err) {
      console.error('❌ [ProductGrid] Ошибка загрузки товаров:', err)
      setError(err instanceof Error ? err.message : 'Ошибка загрузки товаров')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]

    // НОВОЕ: Фильтрация по активному поставщику
    if (activeSupplier) {
      filtered = filtered.filter(product => 
        product.supplier_name === activeSupplier || product.supplier_company_name === activeSupplier
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

    // Сортировка
    filtered = sortProducts(filtered, sortBy)

    setFilteredProducts(filtered)
  }

  const sortProducts = (productsToSort: Product[], sortType: string): Product[] => {
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
  }

  const handleAddToCart = (product: Product) => {
    onAddToCart(product)
  }

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Индикатор активного поставщика */}
      {activeSupplier && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">🔒</span>
            <span className="text-sm text-blue-800 dark:text-blue-300">
              Показаны товары только от поставщика: <strong>{activeSupplier}</strong>
            </span>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Очистите корзину для выбора другого поставщика
          </span>
        </div>
      )}
      
      {/* Заголовок и статистика */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {selectedCategory === 'all' ? 'Все товары' : selectedCategory}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredProducts.length} товаров найдено
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hidden sm:flex"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Фильтры
          </Button>
          <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
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
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Поиск</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Поиск товаров..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Комната</label>
                  <select
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value as 'all' | 'verified' | 'user')}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">Все комнаты</option>
                    <option value="verified">🟠 Оранжевая (Аккредитованные)</option>
                    <option value="user">🔵 Синяя (Личные)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Сортировка</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="default">По умолчанию</option>
                    <option value="name_asc">Название А-Я</option>
                    <option value="name_desc">Название Я-А</option>
                    <option value="price_asc">Цена по возрастанию</option>
                    <option value="price_desc">Цена по убыванию</option>
                    <option value="rating">По рейтингу</option>
                    <option value="room_type">По типу комнаты</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Быстрый поиск (всегда видимый) */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <Input
          placeholder="Быстрый поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Список товаров */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-gray-400 dark:text-gray-500 mb-3">📦</div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Товары не найдены</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 
              'Попробуйте изменить параметры поиска' : 
              'В этой категории пока нет товаров'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {viewMode === 'grid' ? (
                <ProductCardGrid 
                  product={product}
                  onAddToCart={handleAddToCart}
                  isInCart={isProductInCart(product.id)}
                  cartQuantity={getCartQuantity(product.id)}
                  isDisabled={activeSupplier !== null && product.supplier_name !== activeSupplier && product.supplier_company_name !== activeSupplier && !isProductInCart(product.id)}
                  activeSupplier={activeSupplier}
                />
              ) : (
                <ProductCardList 
                  product={product}
                  onAddToCart={handleAddToCart}
                  isInCart={isProductInCart(product.id)}
                  cartQuantity={getCartQuantity(product.id)}
                  isDisabled={activeSupplier !== null && product.supplier_name !== activeSupplier && product.supplier_company_name !== activeSupplier && !isProductInCart(product.id)}
                  activeSupplier={activeSupplier}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Компонент карточки товара в режиме сетки
function ProductCardGrid({ 
  product, 
  onAddToCart, 
  isInCart, 
  cartQuantity,
  isDisabled,
  activeSupplier
}: { 
  product: Product
  onAddToCart: (product: Product) => void
  isInCart: boolean
  cartQuantity: number
  isDisabled?: boolean
  activeSupplier?: string | null
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className={`h-full hover:shadow-xl transition-all duration-300 group overflow-hidden ${
        isInCart
          ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 border-2'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
      }`}>
        {/* Изображение товара */}
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
          {(product.images && product.images.length > 0) ? (
            <img 
              src={product.images[0]} 
              alt={product.product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                console.error(`❌ ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА ${product.product_name}:`, product.images?.[0]);
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
                console.error(`❌ ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА ${product.product_name}:`, product.image_url);
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
            <Badge className={
              product.room_type === 'verified' 
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-blue-100 text-blue-700 border-blue-200'
            }>
              <span className="mr-1">{product.room_icon}</span>
              {product.room_type === 'verified' ? 'Аккредитован' : 'Личный'}
            </Badge>
          </div>
          
          {/* Рейтинг */}
          {product.supplier_rating && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-600">
                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                <span className="font-medium">{product.supplier_rating}</span>
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
              {product.product_name}
            </h3>
            
            {/* Поставщик */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Building2 className="h-4 w-4" />
              <span className="line-clamp-1">{product.supplier_name}</span>
            </div>

            {/* Локация поставщика */}
            {(product.supplier_country || product.supplier_city) && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">
                  {[product.supplier_city, product.supplier_country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Цена и MOQ */}
          <div className="space-y-2">
            {product.price && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Цена</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {product.price} {product.currency || ''}
                </div>
              </div>
            )}
            
            {product.min_order && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">MOQ</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {product.min_order}
                </div>
              </div>
            )}

            {/* Наличие */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Наличие</span>
              </div>
              {isInCart ? (
                <Badge className="text-xs bg-green-600 text-white hover:bg-green-700">
                  В корзине
                </Badge>
              ) : (
                <Badge variant={product.in_stock ? 'default' : 'secondary'} className="text-xs">
                  {product.in_stock ? 'В наличии' : 'Под заказ'}
                </Badge>
              )}
            </div>
          </div>

          {/* Описание */}
          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Кнопка добавления в корзину */}
          <Button
            onClick={() => onAddToCart(product)}
            disabled={isDisabled}
            className={`w-full ${
              isInCart 
                ? 'bg-green-600 hover:bg-green-700' 
                : isDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
            }`}
            size="sm"
          >
            {isInCart ? (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                В корзине ({cartQuantity})
              </>
            ) : isDisabled ? (
              <>
                <span className="text-xs">Недоступно (другой поставщик)</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Добавить в корзину
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Компонент карточки товара в режиме списка
function ProductCardList({ 
  product, 
  onAddToCart, 
  isInCart, 
  cartQuantity,
  isDisabled,
  activeSupplier
}: { 
  product: Product
  onAddToCart: (product: Product) => void
  isInCart: boolean
  cartQuantity: number
  isDisabled?: boolean
  activeSupplier?: string | null
}) {
  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${
      isInCart
        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 border-2'
        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-6">
          {/* Изображение */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
              {(product.images && product.images.length > 0) ? (
                <img 
                  src={product.images[0]} 
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`❌ ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА ${product.product_name}:`, product.images?.[0]);
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
                    console.error(`❌ ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА ${product.product_name}:`, product.image_url);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`flex items-center justify-center h-full fallback-icon ${((product.images && product.images.length > 0) || product.image_url) ? 'hidden' : ''}`}>
                <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          </div>
          
          {/* Основная информация */}
          <div className="flex-grow space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">
                  {product.product_name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <div className="flex items-center space-x-1">
                    <Building2 className="h-4 w-4" />
                    <span>{product.supplier_name}</span>
                  </div>
                  {(product.supplier_country || product.supplier_city) && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[product.supplier_city, product.supplier_country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  <Badge className={
                    product.room_type === 'verified' 
                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }>
                    <span className="mr-1">{product.room_icon}</span>
                    {product.room_type === 'verified' ? 'Аккредитован' : 'Личный'}
                  </Badge>
                </div>
              </div>
              
              {product.supplier_rating && (
                <Badge variant="outline" className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{product.supplier_rating}</span>
                </Badge>
              )}
            </div>
            
            {product.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {product.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                {product.price && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {product.price} {product.currency || ''}
                    </span>
                  </div>
                )}
                
                {product.min_order && (
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>MOQ: {product.min_order}</span>
                  </div>
                )}
                
                <Badge variant={product.in_stock ? 'default' : 'secondary'} className="text-xs">
                  {product.in_stock ? 'В наличии' : 'Под заказ'}
                </Badge>
              </div>
              
              <Button
                onClick={() => onAddToCart(product)}
                disabled={isDisabled}
                className={
                  isInCart 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : isDisabled
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                }
                size="sm"
              >
                {isInCart ? (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    В корзине ({cartQuantity})
                  </>
                ) : isDisabled ? (
                  <>
                    <span className="text-xs">Недоступно</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    В корзину
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}