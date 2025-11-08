'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, Star, MapPin, Package, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

// Компонент крутящихся изображений товаров
function RotatingProductImages({ categoryName }: { categoryName: string }) {
  const [products, setProducts] = useState<CategoryProduct[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/catalog/products-by-category/${encodeURIComponent(categoryName)}?limit=5`)

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.products?.length > 0) {
            // Фильтруем товары с изображениями
            const productsWithImages = data.products.filter((p: CategoryProduct) => p.image_url)
            setProducts(productsWithImages.slice(0, 5))
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [categoryName])

  // Автоматическая смена товаров каждые 2 секунды
  useEffect(() => {
    if (products.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [products.length])

  if (isLoading || products.length === 0) {
    return null
  }

  return (
    <div className="relative w-full h-32 overflow-hidden rounded-lg mb-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center bg-white"
        >
          <img
            src={products[currentIndex].image_url}
            alt={products[currentIndex].product_name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Индикаторы */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
        {products.map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex ? 'bg-orange-500 w-3' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function CatalogModalLanding({ open, onClose }: CatalogModalLandingProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category)
  }

  const handleBack = () => {
    if (selectedSupplier) {
      setSelectedSupplier(null)
    } else if (selectedCategory) {
      setSelectedCategory(null)
    }
  }

  const handleClose = () => {
    setSelectedCategory(null)
    setSelectedSupplier(null)
    onClose()
  }

  const currentSuppliers = selectedCategory ? mockSuppliers[selectedCategory.id] || [] : []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden p-0">
        {/* Хедер */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(selectedCategory || selectedSupplier) && (
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
                  {selectedSupplier ? selectedSupplier.name : selectedCategory ? selectedCategory.name : 'Каталог GET2B'}
                </h2>
                <p className="text-orange-100 text-sm">
                  {selectedSupplier
                    ? `${selectedSupplier.city}, ${selectedSupplier.country}`
                    : selectedCategory
                    ? `${selectedCategory.productsCount} товаров • ${selectedCategory.suppliersCount} поставщиков`
                    : 'Верифицированные поставщики из Китая и Турции'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Контент */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {!selectedCategory ? (
            // Сетка категорий
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 hover:border-orange-400 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  {/* Крутящиеся изображения товаров */}
                  <RotatingProductImages categoryName={category.name} />

                  {/* Иконка категории */}
                  <div className="text-4xl mb-2 text-center">{category.icon}</div>

                  <h3 className="text-base font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{category.suppliersCount} пост.</span>
                    <span>{category.productsCount} тов.</span>
                  </div>
                </button>
              ))}
            </div>
          ) : !selectedSupplier ? (
            // Список поставщиков категории
            <div className="space-y-4">
              {currentSuppliers.length > 0 ? (
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
                      <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
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
      </DialogContent>
    </Dialog>
  )
}
