'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, X, Search, ShoppingCart, Camera, Upload, Image as ImageIcon } from 'lucide-react'
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleImageSearch = () => {
    // TODO: Реализовать поиск по изображению в каталоге
    console.log('Поиск по изображению:', uploadedImage)
    setIsImageSearchOpen(false)
    setUploadedImage(null)
    // Здесь будет логика поиска похожих товаров
  }

  const renderDropdown = () => {
    if (!isOpen || !mounted || !buttonRef.current) return null

    const buttonRect = buttonRef.current.getBoundingClientRect()

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
          {loading ? (
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
            placeholder={placeholder}
            onClick={() => setIsOpen(true)}
            readOnly
            className="w-full pl-10 pr-24 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer hover:border-blue-400 transition-colors"
          />

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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Найти похожие товары
                  </button>
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
