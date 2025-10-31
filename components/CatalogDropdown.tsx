'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, X, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

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

export default function CatalogDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Ensure we're mounted (for portal)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Загружаем категории при открытии
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

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/catalog/categories')
      const data = await response.json()

      if (data.categories) {
        setCategories(data.categories)
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0])
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    router.push(`/dashboard/catalog?category=${selectedCategory?.id}&subcategory=${subcategory.id}`)
    setIsOpen(false)
    setSelectedCategory(null)
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
              <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
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

              {/* Правая панель - Подкатегории */}
              <div className="w-2/3 p-6 overflow-y-auto">
                {selectedCategory ? (
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
    <div className="relative flex-1">
      {/* Строка поиска по каталогу */}
      <div ref={buttonRef} className="relative">
        <input
          type="text"
          placeholder="Каталог Get2b"
          onClick={() => setIsOpen(true)}
          readOnly
          className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer hover:border-blue-400 transition-colors"
        />
        <Package className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      {/* Выпадающее меню через портал */}
      {renderDropdown()}
    </div>
  )
}
