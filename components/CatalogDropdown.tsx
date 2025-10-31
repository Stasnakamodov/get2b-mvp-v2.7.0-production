'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, X, Search, ShoppingCart, Camera, Upload, Image as ImageIcon, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  icon?: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  category_id: string
  products_count?: number
}

interface CatalogDropdownProps {
  cartItemsCount?: number
  onCartClick?: () => void
}

export default function CatalogDropdown({ cartItemsCount = 0, onCartClick }: CatalogDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [placeholder, setPlaceholder] = useState('Каталог Get2b')
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false)
  const [isUrlSearchOpen, setIsUrlSearchOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [searchUrl, setSearchUrl] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showNoResults, setShowNoResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [productSearchResults, setProductSearchResults] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const shortText = 'Каталог Get2b'
  const fullText = 'Найдите свои товары в Каталоге Get2b или оставьте заявку что-бы мы нашли нужного поставщика товара'

  // Ensure we're mounted (for portal)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Анимация печатающегося текста каждые 2 минуты
  useEffect(() => {
    let typingInterval: NodeJS.Timeout
    let erasingInterval: NodeJS.Timeout
    let cycleTimeout: NodeJS.Timeout

    const typeText = () => {
      let currentIndex = shortText.length
      setPlaceholder(shortText)

      typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          currentIndex++
          setPlaceholder(fullText.substring(0, currentIndex))
        } else {
          clearInterval(typingInterval)
          // Держим полный текст 5 секунд, затем стираем
          setTimeout(() => {
            eraseText()
          }, 5000)
        }
      }, 50) // Скорость печати: 50ms на символ
    }

    const eraseText = () => {
      let currentIndex = fullText.length

      erasingInterval = setInterval(() => {
        if (currentIndex > shortText.length) {
          // Стираем до "Каталог Get2B"
          currentIndex--
          setPlaceholder(fullText.substring(0, currentIndex))
        } else if (currentIndex > 0) {
          // Продолжаем стирать "Каталог Get2B" до пустоты
          currentIndex--
          setPlaceholder(fullText.substring(0, currentIndex))
        } else {
          // Дошли до пустоты
          clearInterval(erasingInterval)
          setPlaceholder('')

          // Через 300ms появляется "Каталог Get2B" слева
          setTimeout(() => {
            setPlaceholder(shortText)
            // Запускаем следующий цикл через 2 минуты
            cycleTimeout = setTimeout(() => {
              typeText()
            }, 120000) // 2 минуты = 120000ms
          }, 300)
        }
      }, 30) // Скорость стирания: 30ms на символ (быстрее)
    }

    // Запускаем первый цикл через 45 секунд после загрузки
    cycleTimeout = setTimeout(() => {
      typeText()
    }, 45000) // 45 секунд = 45000ms

    return () => {
      clearInterval(typingInterval)
      clearInterval(erasingInterval)
      clearTimeout(cycleTimeout)
    }
  }, [])

  // ОПТИМИЗАЦИЯ: Загружаем ТОЛЬКО категории при открытии (быстро!)
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      loadCategories()
    }
  }, [isOpen])

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedCategory(null)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ОПТИМИЗАЦИЯ: Загружаем только категории БЕЗ подкатегорий (быстро!)
  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/catalog/categories?includeSubcategories=false')
      const data = await response.json()

      if (data.categories) {
        setCategories(data.categories)
        if (data.categories.length > 0) {
          // Загружаем подкатегории для первой категории
          loadSubcategories(data.categories[0])
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    } finally {
      setLoading(false)
    }
  }

  // НОВАЯ ФУНКЦИЯ: Ленивая загрузка подкатегорий для конкретной категории
  const loadSubcategories = async (category: Category) => {
    try {
      setLoadingSubcategories(true)
      setSelectedCategory(category)

      // Если подкатегории уже загружены, не загружаем повторно
      if (category.subcategories && category.subcategories.length > 0) {
        setLoadingSubcategories(false)
        return
      }

      const response = await fetch(`/api/catalog/categories/${category.id}/subcategories`)
      const data = await response.json()

      if (data.subcategories) {
        // Обновляем категорию с загруженными подкатегориями
        setCategories(prev => prev.map(cat =>
          cat.id === category.id
            ? { ...cat, subcategories: data.subcategories }
            : cat
        ))
        setSelectedCategory({ ...category, subcategories: data.subcategories })
      }
    } catch (error) {
      console.error('Ошибка загрузки подкатегорий:', error)
    } finally {
      setLoadingSubcategories(false)
    }
  }

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    router.push(`/dashboard/catalog?category=${selectedCategory?.id}&subcategory=${subcategory.id}`)
    setIsOpen(false)
    setSelectedCategory(null)
  }

  // Обработчики drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleImageUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleImageUpload(files[0])
    }
  }

  const handleImageUpload = (file: File) => {
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите изображение')
      return
    }

    // Проверка размера файла (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10MB')
      return
    }

    // Создание preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageSearch = async () => {
    if (!uploadedImage) {
      alert('Пожалуйста, загрузите изображение')
      return
    }

    setIsSearching(true)
    setProductSearchResults([])

    try {
      // Убираем префикс data:image/...;base64,
      const base64Image = uploadedImage.split(',')[1] || uploadedImage

      // Отправляем изображение на анализ
      const response = await fetch('/api/catalog/search-by-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка поиска')
      }

      console.log('✅ Результаты поиска по изображению:', data)

      // Сохраняем результаты
      setProductSearchResults(data.products || [])
      setSearchQuery(data.searchQuery || data.description || '')

      // Закрываем модальное окно загрузки изображения
      setIsImageSearchOpen(false)
      setUploadedImage(null)

      // Если товары найдены
      if (data.products && data.products.length > 0) {
        // Получаем категорию первого найденного товара
        const firstProduct = data.products[0]
        const productCategory = firstProduct.category

        console.log('🎯 Переходим в категорию:', productCategory)

        // Перенаправляем в каталог с этой категорией
        router.push(`/dashboard/catalog?category=${encodeURIComponent(productCategory)}`)
        setIsOpen(false)
      } else {
        // Если ничего не найдено, показываем dropdown с предложением
        setIsOpen(true)
        alert(`Определено: ${data.description}\n\nТовары не найдены. Попробуйте другое изображение или оставьте заявку.`)
      }
    } catch (error) {
      console.error('Ошибка поиска по изображению:', error)
      alert('Произошла ошибка при поиске. Попробуйте снова.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleUrlSearch = async () => {
    if (!searchUrl.trim()) {
      alert('Пожалуйста, введите ссылку')
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setShowNoResults(false)

    try {
      // TODO: Реализовать API для поиска товара по URL
      // Пока имитируем поиск
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Имитация пустого результата
      setSearchResults([])
      setShowNoResults(true)
    } catch (error) {
      console.error('Ошибка поиска:', error)
      alert('Произошла ошибка при поиске')
    } finally {
      setIsSearching(false)
    }
  }

  // Поиск товаров по тексту
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)

    // Очищаем предыдущий таймаут
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Если поле пустое, очищаем результаты
    if (!value.trim()) {
      setProductSearchResults([])
      return
    }

    // Запускаем поиск с debounce 500ms
    searchTimeoutRef.current = setTimeout(async () => {
      await searchProducts(value)
    }, 500)
  }

  const searchProducts = async (query: string) => {
    if (!query.trim()) return

    setSearchLoading(true)
    try {
      // Используем существующий API для поиска товаров
      const response = await fetch(`/api/catalog/products?search=${encodeURIComponent(query)}&supplier_type=verified&limit=20`)
      const data = await response.json()

      if (data.products) {
        setProductSearchResults(data.products)
      } else {
        setProductSearchResults([])
      }
    } catch (error) {
      console.error('Ошибка поиска товаров:', error)
      setProductSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleProductClick = (product: any) => {
    // Переходим на страницу каталога с поиском
    router.push(`/dashboard/catalog?search=${encodeURIComponent(searchQuery)}`)
    setIsOpen(false)
    setSearchQuery('')
    setProductSearchResults([])
  }

  const renderDropdown = () => {
    if (!isOpen || !mounted || !buttonRef.current) return null

    const buttonRect = buttonRef.current.getBoundingClientRect()

    // Если есть поисковый запрос, показываем результаты поиска
    const showSearchResults = searchQuery.trim().length > 0

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          width: '800px',
          zIndex: 999999,
          top: `${buttonRect.bottom + 8}px`,
          left: `${buttonRect.left}px`
        }}
      >
          {showSearchResults ? (
            // Панель результатов поиска
            <div className="p-6" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Результаты поиска: "{searchQuery}"
              </h3>

              {searchLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-gray-600 text-sm">Поиск товаров...</p>
                </div>
              ) : productSearchResults.length > 0 ? (
                <div className="space-y-3">
                  {productSearchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex gap-4">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-700 mb-1">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {product.price && (
                              <span className="text-sm font-semibold text-green-600">
                                {product.price} ₽
                              </span>
                            )}
                            {product.supplier_name && (
                              <span className="text-xs text-gray-500">
                                • {product.supplier_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        router.push(`/dashboard/catalog?search=${encodeURIComponent(searchQuery)}`)
                        setIsOpen(false)
                      }}
                      className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Смотреть все результаты →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Товары не найдены</p>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setIsRequestFormOpen(true)
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Оставить заявку на поиск
                  </button>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Загрузка каталога...</p>
            </div>
          ) : (
            <div className="flex" style={{ height: '500px' }}>
              {/* Левая панель - Категории */}
              <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto flex flex-col">
                <div className="flex-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => loadSubcategories(category)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                        selectedCategory?.id === category.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon || '📦'}</span>
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>

                {/* Кнопка "Найти товар" внизу левой панели */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setIsRequestFormOpen(true)
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Search className="h-5 w-5" />
                    Найти товар
                  </button>
                </div>
              </div>

              {/* Правая панель - Подкатегории */}
              <div className="w-2/3 p-6 overflow-y-auto">
                {loadingSubcategories ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-gray-600 text-sm">Загрузка подкатегорий...</p>
                  </div>
                ) : selectedCategory ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedCategory.icon} {selectedCategory.name}
                    </h3>

                    {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCategory.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(subcategory)}
                            className="text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 group-hover:text-blue-700">
                                {subcategory.name}
                              </span>
                              {subcategory.products_count !== undefined && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-700">
                                  {subcategory.products_count}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        В этой категории пока нет подкатегорий
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Выберите категорию
                  </p>
                )}
              </div>
            </div>
          )}

        {/* Кнопка закрытия */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>,
      document.body
    )
  }

  return (
    <>
      <div className="relative flex-1">
        {/* Строка поиска по каталогу с корзиной */}
        <div ref={buttonRef} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />

          <input
            type="text"
            placeholder={searchQuery ? '' : placeholder}
            value={searchQuery}
            onChange={(e) => {
              handleSearchQueryChange(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => {
              if (!searchQuery) setIsOpen(true)
            }}
            className="w-full pl-10 pr-32 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 hover:border-blue-400 transition-colors"
          />

          {/* Кнопка глобуса (планетка) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsUrlSearchOpen(true)
            }}
            className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full transition-all shadow-md hover:shadow-lg"
            title="Поиск по ссылке из интернета"
          >
            <Globe className="h-5 w-5 text-white" />
          </button>

          {/* Кнопка камеры справа (вплотную к корзине слева) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsImageSearchOpen(true)
            }}
            className="absolute right-11 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Поиск по изображению"
          >
            <Camera className="h-5 w-5 text-blue-600" />
          </button>

          {/* Кнопка корзины справа внутри строки поиска */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (cartItemsCount > 0 && onCartClick) {
                // Если корзина с товарами - открываем боковую панель
                onCartClick()
              } else {
                // Если корзина пустая - переходим в каталог
                router.push('/dashboard/catalog')
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-md">
                  {cartItemsCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Выпадающее меню через портал */}
        {renderDropdown()}
      </div>

      {/* Модальное окно формы запроса товара */}
      {isRequestFormOpen && mounted && createPortal(
        <>
          {/* Затемнение фона */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsRequestFormOpen(false)}
          />

          {/* Модальное окно */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <Search className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">Запрос на поиск товара</h2>
                </div>
                <button
                  onClick={() => setIsRequestFormOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Форма */}
              <div className="p-6 space-y-6">
                <p className="text-gray-600">
                  Опишите какой товар вы ищете, приложите фотографии и мы найдём для вас подходящих поставщиков
                </p>

                {/* Название товара */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название или описание товара *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Кабель USB-C, 2 метра, белый"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Детальное описание */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Детальное описание
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Укажите характеристики, требования к качеству, объёмы закупки..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Загрузка фотографий */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фотографии товара
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="product-images"
                    />
                    <label htmlFor="product-images" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">
                          Нажмите или перетащите фотографии сюда
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG до 10MB
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Контактные данные */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ваше имя *
                    </label>
                    <input
                      type="text"
                      placeholder="Иван Иванов"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="example@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Footer с кнопками */}
              <div className="flex gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
                <button
                  onClick={() => setIsRequestFormOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    // TODO: Отправка формы
                    setIsRequestFormOpen(false)
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Отправить запрос
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Модальное окно поиска по изображению */}
      {isImageSearchOpen && mounted && createPortal(
        <>
          {/* Затемнение фона */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => {
              setIsImageSearchOpen(false)
              setUploadedImage(null)
            }}
          />

          {/* Модальное окно */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <Camera className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">Поиск товара по изображению</h2>
                </div>
                <button
                  onClick={() => {
                    setIsImageSearchOpen(false)
                    setUploadedImage(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {!uploadedImage ? (
                  <>
                    <p className="text-gray-600 mb-6">
                      Загрузите фотографию товара, и мы найдём похожие товары в нашем каталоге
                    </p>

                    {/* Drag and Drop область */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-blue-600" />
                        </div>

                        <div>
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            {isDragging ? 'Отпустите файл здесь' : 'Перетащите изображение сюда'}
                          </p>
                          <p className="text-sm text-gray-500">
                            или нажмите, чтобы выбрать файл
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <ImageIcon className="w-4 h-4" />
                          <span>PNG, JPG, WEBP до 10MB</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-6">
                      Отлично! Нажмите "Найти похожие товары" для поиска в каталоге
                    </p>

                    {/* Preview загруженного изображения */}
                    <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-full h-64 object-contain bg-gray-50"
                      />
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setIsImageSearchOpen(false)
                    setUploadedImage(null)
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Отмена
                </button>
                {uploadedImage && (
                  <button
                    onClick={handleImageSearch}
                    disabled={isSearching}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Анализируем изображение...
                      </>
                    ) : (
                      'Найти похожие товары'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Модальное окно поиска по ссылке */}
      {isUrlSearchOpen && mounted && createPortal(
        <>
          {/* Затемнение фона */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => {
              setIsUrlSearchOpen(false)
              setSearchUrl('')
              setSearchResults([])
              setShowNoResults(false)
            }}
          />

          {/* Модальное окно */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-purple-600" />
                  <h2 className="text-2xl font-bold">Поиск товара по ссылке</h2>
                </div>
                <button
                  onClick={() => {
                    setIsUrlSearchOpen(false)
                    setSearchUrl('')
                    setSearchResults([])
                    setShowNoResults(false)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <p className="text-gray-600">
                  Вставьте ссылку на товар из любого интернет-магазина, и мы найдём похожие товары в нашем каталоге или предложим найти поставщика
                </p>

                {/* Поле ввода URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ссылка на товар *
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/product/12345"
                    value={searchUrl}
                    onChange={(e) => setSearchUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSearching) {
                        handleUrlSearch()
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg"
                    disabled={isSearching}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Поддерживаются ссылки с Wildberries, Ozon, AliExpress и других маркетплейсов
                  </p>
                </div>

                {/* Кнопка поиска */}
                {!showNoResults && (
                  <button
                    onClick={handleUrlSearch}
                    disabled={isSearching || !searchUrl.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Ищем товар...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5" />
                        Найти похожие товары
                      </>
                    )}
                  </button>
                )}

                {/* Результаты поиска - если не найдено */}
                {showNoResults && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Похожих товаров не найдено
                        </h3>
                        <p className="text-gray-600 mb-4">
                          К сожалению, мы не нашли похожих товаров в нашем каталоге
                        </p>
                      </div>

                      {/* Предложение найти поставщика */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 mb-3">
                          <strong>Не беда!</strong> Мы можем найти для вас поставщика этого товара
                        </p>
                        <button
                          onClick={() => {
                            setIsUrlSearchOpen(false)
                            setIsRequestFormOpen(true)
                            setSearchUrl('')
                            setShowNoResults(false)
                          }}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Оставить заявку на поиск поставщика
                        </button>
                      </div>

                      {/* Кнопка попробовать снова */}
                      <button
                        onClick={() => {
                          setSearchUrl('')
                          setShowNoResults(false)
                        }}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        ← Попробовать другую ссылку
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
