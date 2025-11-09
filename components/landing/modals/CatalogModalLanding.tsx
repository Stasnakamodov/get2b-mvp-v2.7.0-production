'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Star, MapPin, Package, ShoppingCart, Grid3x3, Users } from 'lucide-react'
import { motion } from 'framer-motion'

// Типы данных
interface Category {
  id: string
  name: string
  icon: string
  description: string
  productsCount: number
  suppliersCount: number
}

interface CategoryProduct {
  id: string
  product_name: string
  image_url?: string
  price?: string
  currency?: string
}

interface Supplier {
  id: string
  name: string
  companyName: string
  country: string
  city: string
  rating: number
  reviewsCount: number
  projectsCount: number
  description: string
  products: Product[]
}

interface Product {
  id: string
  name: string
  price: string
  currency: string
  minOrder: string
  image: string
}

interface CatalogModalLandingProps {
  open: boolean
  onClose: () => void
}

// Данные категорий
const categories: Category[] = [
  {
    id: '1',
    name: 'Автотовары',
    icon: '🚗',
    description: 'Автомобильные запчасти и аксессуары',
    productsCount: 1250,
    suppliersCount: 45
  },
  {
    id: '2',
    name: 'Электроника',
    icon: '📱',
    description: 'Электронные устройства и компоненты',
    productsCount: 2340,
    suppliersCount: 78
  },
  {
    id: '3',
    name: 'Дом и быт',
    icon: '🏠',
    description: 'Товары для дома и быта',
    productsCount: 1890,
    suppliersCount: 56
  },
  {
    id: '4',
    name: 'Здоровье и медицина',
    icon: '⚕️',
    description: 'Медицинское оборудование и товары для здоровья',
    productsCount: 980,
    suppliersCount: 34
  },
  {
    id: '5',
    name: 'Продукты питания',
    icon: '🍎',
    description: 'Пищевая продукция и ингредиенты',
    productsCount: 1560,
    suppliersCount: 67
  },
  {
    id: '6',
    name: 'Промышленность',
    icon: '🏭',
    description: 'Промышленное оборудование и материалы',
    productsCount: 3450,
    suppliersCount: 92
  },
  {
    id: '7',
    name: 'Строительство',
    icon: '🏗️',
    description: 'Строительные материалы и инструменты',
    productsCount: 2780,
    suppliersCount: 81
  },
  {
    id: '8',
    name: 'Текстиль и одежда',
    icon: '👕',
    description: 'Текстильная продукция и одежда',
    productsCount: 4120,
    suppliersCount: 103
  }
]

// Примеры поставщиков для демонстрации
const mockSuppliers: { [key: string]: Supplier[] } = {
  '2': [ // Электроника
    {
      id: 's1',
      name: 'TechSupply China',
      companyName: 'Shenzhen Tech Solutions Ltd',
      country: 'Китай',
      city: 'Шэньчжэнь',
      rating: 4.8,
      reviewsCount: 127,
      projectsCount: 245,
      description: 'Ведущий поставщик электроники и компонентов из Китая. Специализируется на смартфонах, планшетах и аксессуарах.',
      products: [
        {
          id: 'p1',
          name: 'Беспроводные наушники TWS',
          price: '8.50',
          currency: '¥',
          minOrder: '100 шт',
          image: '/placeholder.png'
        },
        {
          id: 'p2',
          name: 'Power Bank 20000mAh',
          price: '15.00',
          currency: '¥',
          minOrder: '50 шт',
          image: '/placeholder.png'
        },
        {
          id: 'p3',
          name: 'USB-C кабель 2м',
          price: '2.30',
          currency: '¥',
          minOrder: '200 шт',
          image: '/placeholder.png'
        }
      ]
    },
    {
      id: 's2',
      name: 'Electronics Hub',
      companyName: 'Guangzhou Electronics Co',
      country: 'Китай',
      city: 'Гуанчжоу',
      rating: 4.6,
      reviewsCount: 89,
      projectsCount: 167,
      description: 'Надежный партнер в сфере электроники. Большой ассортимент гаджетов и комплектующих.',
      products: [
        {
          id: 'p4',
          name: 'Смарт-часы X5',
          price: '25.00',
          currency: '¥',
          minOrder: '30 шт',
          image: '/placeholder.png'
        },
        {
          id: 'p5',
          name: 'Bluetooth колонка',
          price: '12.50',
          currency: '¥',
          minOrder: '50 шт',
          image: '/placeholder.png'
        }
      ]
    }
  ],
  '8': [ // Текстиль и одежда
    {
      id: 's3',
      name: 'Fashion Textile',
      companyName: 'Hangzhou Fashion Group',
      country: 'Китай',
      city: 'Ханчжоу',
      rating: 4.9,
      reviewsCount: 203,
      projectsCount: 412,
      description: 'Производитель качественного текстиля и одежды. Работаем с известными брендами по всему миру.',
      products: [
        {
          id: 'p6',
          name: 'Футболка хлопок 100%',
          price: '3.80',
          currency: '¥',
          minOrder: '500 шт',
          image: '/placeholder.png'
        },
        {
          id: 'p7',
          name: 'Толстовка с капюшоном',
          price: '12.00',
          currency: '¥',
          minOrder: '200 шт',
          image: '/placeholder.png'
        }
      ]
    }
  ]
}

// Компонент горизонтальной карусели товаров
function ProductsCarousel({ onProductClick }: { onProductClick: (product: any) => void }) {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        // Загружаем товары из ВСЕХ категорий
        const allProducts: CategoryProduct[] = []

        const response = await fetch(`/api/catalog/products-by-category/all?limit=100`)
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 Загружено товаров из API:', data.products?.length)

          if (data.success && data.products?.length > 0) {
            // Фильтруем товары с валидными изображениями более строго
            const productsWithImages = data.products.filter((p: any) => {
              if (!p.image_url || typeof p.image_url !== 'string') return false
              const url = p.image_url.trim().toLowerCase()
              if (url.length === 0) return false
              if (url.includes('placeholder')) return false
              if (url.includes('example.com')) return false
              // Проверяем что это похоже на URL изображения
              if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) return false
              return true
            })

            console.log('✅ Товаров с валидными изображениями:', productsWithImages.length)
            allProducts.push(...productsWithImages)
          }
        }

        // Берем случайные товары для разнообразия
        const shuffled = allProducts.sort(() => Math.random() - 0.5)
        setProducts(shuffled.slice(0, 40))
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const card = e.currentTarget.closest('[data-card-id]')
    if (card) {
      (card as HTMLElement).style.display = 'none'
    }
  }

  // Не показываем карусель если загружается или слишком мало товаров
  if (isLoading) return null
  if (products.length < 5) {
    console.log('⚠️ Недостаточно товаров для карусели:', products.length)
    return null
  }

  return (
    <div className="flex-shrink-0 border-t border-gray-100 bg-white py-4 px-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔥</span>
        <h3 className="text-sm font-medium text-gray-900">Популярные товары</h3>
        <span className="text-xs text-gray-400">• {products.length}</span>
      </div>

      {/* Анимированная карусель */}
      <div className="relative overflow-hidden -mx-6 px-6">
        <motion.div
          className="flex gap-4"
          animate={{
            x: [0, -(products.length * 160)]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: products.length * 3.5,
              ease: "linear"
            }
          }}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Дублируем товары для бесшовной карусели */}
          {[...products, ...products].map((product, idx) => (
            <button
              key={idx}
              type="button"
              data-card-id={`product-${idx}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🔥 Клик на товар:', product.product_name)
                onProductClick(product)
              }}
              className="flex-shrink-0 w-36 h-36 rounded-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <img
                src={product.image_url}
                alt={product.product_name}
                className="w-full h-full object-cover pointer-events-none"
                loading="eager"
                onError={handleImageError}
              />
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export function CatalogModalLanding({ open, onClose }: CatalogModalLandingProps) {
  const [viewMode, setViewMode] = useState<'products' | 'suppliers'>('products')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [realSuppliers, setRealSuppliers] = useState<any[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [categoryProducts, setCategoryProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const handleCategoryClick = async (category: Category) => {
    setSelectedCategory(category)

    // В режиме поставщиков загружаем поставщиков
    if (viewMode === 'suppliers') {
      await loadSuppliersForCategory(category.name)
    }
    // В режиме товаров загружаем товары категории
    else if (viewMode === 'products') {
      await loadCategoryProducts(category.name)
    }
  }

  const loadCategoryProducts = async (categoryName: string) => {
    try {
      setLoadingProducts(true)
      console.log('📦 Загружаем товары категории:', categoryName)

      const response = await fetch(`/api/catalog/products-by-category/${encodeURIComponent(categoryName)}?limit=100`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Получены товары:', data)

        if (data.success && data.products?.length > 0) {
          // Фильтруем товары с валидными изображениями
          const productsWithValidImages = data.products.filter((p: any) => {
            if (!p.image_url || typeof p.image_url !== 'string') return false
            const url = p.image_url.trim().toLowerCase()
            if (url.length === 0) return false
            if (url.includes('placeholder')) return false
            if (url.includes('example.com')) return false
            // Проверяем что это похоже на URL изображения
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) return false
            return true
          })

          console.log('✅ Товаров с валидными изображениями:', productsWithValidImages.length, 'из', data.products.length)
          setCategoryProducts(productsWithValidImages)
        } else {
          setCategoryProducts([])
          console.log('⚠️ Товаров не найдено')
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки товаров:', error)
      setCategoryProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadSuppliersForCategory = async (categoryName: string) => {
    try {
      setLoadingSuppliers(true)
      console.log('📦 Загружаем поставщиков для категории:', categoryName)

      const response = await fetch(`/api/catalog/products-by-category/${encodeURIComponent(categoryName)}?limit=100`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Получены данные:', data)

        if (data.success && data.suppliers?.length > 0) {
          // Адаптируем данные из API к формату компонента
          const adaptedSuppliers = data.suppliers.map((s: any) => ({
            id: s.supplier_id,
            name: s.supplier_name || 'Поставщик',
            companyName: s.supplier_company_name || '',
            country: s.supplier_country || '',
            city: s.supplier_city || '',
            rating: s.supplier_rating || 0,
            reviewsCount: s.supplier_reviews || 0,
            projectsCount: s.supplier_projects || 0,
            description: s.room_description || `Поставщик категории "${categoryName}"`,
            products: (s.products || []).map((p: any) => ({
              id: p.id,
              name: p.product_name || p.item_name || 'Товар',
              price: p.price || '0',
              currency: p.currency || '¥',
              minOrder: p.min_order || '1 шт',
              image: p.image_url || ''
            }))
          }))

          setRealSuppliers(adaptedSuppliers)
          console.log('✅ Загружено поставщиков:', adaptedSuppliers.length)
        } else {
          setRealSuppliers([])
          console.log('⚠️ Поставщиков не найдено')
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки поставщиков:', error)
      setRealSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }

  const handleProductClick = (product: any) => {
    console.log('🔍 Клик на товар из карусели:', product)
    // Открываем детальную карточку товара
    setSelectedProduct(product)
  }

  const handleBack = () => {
    if (selectedSupplier) {
      setSelectedSupplier(null)
    } else if (selectedProduct) {
      setSelectedProduct(null)
    } else if (selectedCategory) {
      setSelectedCategory(null)
      setRealSuppliers([])
      setCategoryProducts([])
    }
  }

  const handleClose = () => {
    setSelectedCategory(null)
    setSelectedSupplier(null)
    setSelectedProduct(null)
    setRealSuppliers([])
    setCategoryProducts([])
    onClose()
  }

  // Используем реальных поставщиков из API, если есть, иначе моковые данные
  const currentSuppliers = realSuppliers.length > 0
    ? realSuppliers
    : selectedCategory
    ? mockSuppliers[selectedCategory.id] || []
    : []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
        {/* Хедер - фиксированная высота */}
        <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(selectedCategory || selectedSupplier || selectedProduct) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-white hover:bg-white/20 -ml-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {selectedSupplier
                    ? selectedSupplier.name
                    : selectedProduct
                    ? selectedProduct.product_name
                    : selectedCategory
                    ? selectedCategory.name
                    : 'Каталог GET2B'}
                </h2>
                <p className="text-orange-100 text-sm">
                  {selectedSupplier
                    ? `${selectedSupplier.city}, ${selectedSupplier.country}`
                    : selectedProduct
                    ? `${selectedProduct.category_name || selectedProduct.category} • ${selectedProduct.supplier_name || 'Поставщик'}`
                    : selectedCategory
                    ? `${selectedCategory.productsCount} товаров • ${selectedCategory.suppliersCount} поставщиков`
                    : 'Верифицированные поставщики из Китая и Турции'
                  }
                </p>
              </div>
            </div>

            {/* Переключатель режимов - только на главной странице */}
            {!selectedCategory && !selectedSupplier && !selectedProduct && (
              <div className="flex gap-2 bg-white/10 rounded-lg p-1 w-[320px]">
                <button
                  onClick={() => setViewMode('products')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                    viewMode === 'products'
                      ? 'bg-white text-orange-600 font-semibold'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  Товары
                </button>
                <button
                  onClick={() => setViewMode('suppliers')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
                    viewMode === 'suppliers'
                      ? 'bg-white text-orange-600 font-semibold'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Поставщики
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Контент - скроллящаяся область с flex-1 */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {selectedProduct ? (
            // Карточка выбранного товара
            <div className="grid lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {/* Изображение товара - 2 колонки */}
              <div className="lg:col-span-2">
                <div className="sticky top-0 bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 border border-orange-200 shadow-sm">
                  <div className="aspect-square flex items-center justify-center">
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.product_name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Информация о товаре - 3 колонки */}
              <div className="lg:col-span-3 space-y-6">
                {/* Заголовок и описание */}
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    {selectedProduct.product_name}
                  </h3>
                  {selectedProduct.description && (
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>

                {/* Цена - большой акцент */}
                {selectedProduct.price && (
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium mb-1">Цена</p>
                        <p className="text-4xl font-bold text-white">
                          {selectedProduct.price} <span className="text-2xl">{selectedProduct.currency || '¥'}</span>
                        </p>
                      </div>
                      {selectedProduct.min_order && (
                        <div className="text-right">
                          <p className="text-orange-100 text-sm font-medium mb-1">Минимум</p>
                          <p className="text-xl font-semibold text-white">{selectedProduct.min_order}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Детали товара в карточках */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedProduct.item_code && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                      <p className="text-gray-500 text-xs font-medium mb-1">Артикул</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">{selectedProduct.item_code}</p>
                    </div>
                  )}

                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                    <p className="text-gray-500 text-xs font-medium mb-1">Категория</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedProduct.category_name || selectedProduct.category}</p>
                  </div>

                  {selectedProduct.supplier_name && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                      <p className="text-gray-500 text-xs font-medium mb-1">Поставщик</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedProduct.supplier_name}</p>
                    </div>
                  )}

                  {selectedProduct.supplier_country && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                      <p className="text-gray-500 text-xs font-medium mb-1">Страна</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        {selectedProduct.supplier_country}
                      </p>
                    </div>
                  )}
                </div>

                {/* Кнопка действия */}
                <div className="space-y-3 pt-4">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-7 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <ShoppingCart className="w-6 h-6 mr-2" />
                    Добавить в проект
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    Зарегистрируйтесь, чтобы добавить товар в проект
                  </p>
                </div>
              </div>
            </div>
          ) : !selectedCategory ? (
            // Сетка категорий
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 hover:border-orange-400 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 flex flex-col items-center"
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">{category.name}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2 text-center">{category.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 w-full">
                    <span>{category.suppliersCount} пост.</span>
                    <span>{category.productsCount} тов.</span>
                  </div>
                </button>
              ))}
            </div>
          ) : !selectedSupplier ? (
            // Список поставщиков ИЛИ товаров категории - в зависимости от режима
            viewMode === 'products' ? (
              // Режим товаров - показываем товары категории
              <div>
                {loadingProducts ? (
                  // Индикатор загрузки
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Загружаем товары...
                    </h3>
                    <p className="text-gray-600">
                      Пожалуйста, подождите
                    </p>
                  </div>
                ) : categoryProducts.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Товары категории ({categoryProducts.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categoryProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className="bg-white border-2 border-gray-200 hover:border-orange-400 rounded-lg p-4 transition-all duration-200 hover:shadow-md text-left"
                        >
                          <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            <img
                              src={product.image_url}
                              alt={product.product_name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                console.log('❌ Ошибка загрузки изображения:', product.image_url)
                                const target = e.currentTarget
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                            {product.product_name}
                          </h4>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-bold text-orange-600">
                              {product.price} {product.currency || '¥'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {product.supplier_name || 'Поставщик'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Товары не найдены
                    </h3>
                    <p className="text-gray-600 mb-4">
                      В этой категории пока нет товаров
                    </p>
                    <Button
                      onClick={() => setSelectedCategory(null)}
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Вернуться к категориям
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Режим поставщиков - показываем список поставщиков
              <div className="space-y-4">
              {loadingSuppliers ? (
                // Индикатор загрузки
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Загружаем поставщиков...
                  </h3>
                  <p className="text-gray-600">
                    Пожалуйста, подождите
                  </p>
                </div>
              ) : currentSuppliers.length > 0 ? (
                currentSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="border-2 border-orange-200 rounded-xl p-6 bg-gradient-to-r from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-lg bg-orange-200 border-2 border-orange-300 flex items-center justify-center text-orange-700 font-bold text-lg">
                            {supplier.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-orange-800">{supplier.name}</h3>
                            <p className="text-sm text-orange-600">{supplier.companyName}</p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{supplier.description}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {supplier.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {supplier.rating.toFixed(1)} ({supplier.reviewsCount})
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {supplier.projectsCount} проектов
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => setSelectedSupplier(supplier)}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Товары ({supplier.products.length})
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Демонстрационная версия
                  </h3>
                  <p className="text-gray-600 mb-4">
                    В этой категории пока нет поставщиков для демонстрации.
                    <br />
                    Попробуйте категории "Электроника" или "Текстиль и одежда".
                  </p>
                  <Button
                    onClick={() => setSelectedCategory(null)}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Вернуться к категориям
                  </Button>
                </div>
              )}
            </div>
            )
          ) : (
            // Товары выбранного поставщика
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-900 mb-2">О поставщике</h3>
                <p className="text-sm text-gray-700">{selectedSupplier.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Товары поставщика ({selectedSupplier.products.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSupplier.products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border-2 border-gray-200 hover:border-orange-400 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.currentTarget
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                              }
                            }}
                          />
                        ) : (
                          <Package className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-bold text-orange-600">
                          {product.price} {product.currency}
                        </span>
                        <span className="text-xs text-gray-500">
                          Мин: {product.minOrder}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        В корзину
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Это демонстрационная версия</p>
                    <p className="leading-relaxed">
                      Чтобы добавить товары в проект и начать работу с реальным каталогом GET2B — зарегистрируйтесь, заполнив форму выше!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Горизонтальная карусель товаров - фиксированная высота */}
        <ProductsCarousel onProductClick={handleProductClick} />
      </DialogContent>
    </Dialog>
  )
}
