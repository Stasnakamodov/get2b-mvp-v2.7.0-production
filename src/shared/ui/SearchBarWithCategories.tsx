/**
 * Компонент поиска с выпадающим списком категорий
 * FSD: shared/ui
 *
 * Показывает категории при фокусе на поисковой строке
 */

import React, { useState, useRef, useEffect } from 'react'
import { Search, Grid3X3, ChevronRight, Package, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchBarWithCategoriesProps {
  value: string
  onChange: (value: string) => void
  onCategoryClick?: (category: string) => void
  placeholder?: string
  className?: string
  categories?: string[]
}

// Предустановленные категории (можно переопределить через props)
const DEFAULT_CATEGORIES = [
  'Электроника',
  'Текстиль и одежда',
  'Строительство',
  'Продукты питания',
  'Автотовары',
  'Дом и быт',
  'Здоровье и медицина',
  'Промышленность',
  'ТЕСТОВАЯ',
  'СПОРТ',
  'ИГРУШКИ',
  'КНИГИ',
  'МУЗЫКА'
]

// Иконки для категорий
const categoryIcons: Record<string, React.ReactNode> = {
  'Электроника': '💻',
  'Текстиль и одежда': '👕',
  'Строительство': '🏗️',
  'Продукты питания': '🍎',
  'Автотовары': '🚗',
  'Дом и быт': '🏠',
  'Здоровье и медицина': '🏥',
  'Здоровье и красота': '💄',
  'Промышленность': '🏭',
  'ТЕСТОВАЯ': '🧪',
  'СПОРТ': '⚽',
  'ИГРУШКИ': '🧸',
  'КНИГИ': '📚',
  'МУЗЫКА': '🎵'
}

export const SearchBarWithCategories: React.FC<SearchBarWithCategoriesProps> = ({
  value,
  onChange,
  onCategoryClick,
  placeholder = 'Поиск товаров по названию, поставщику или артикулу...',
  className = '',
  categories = DEFAULT_CATEGORIES
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Блокировка скролла страницы когда список открыт
  useEffect(() => {
    if (isOpen) {
      // Предотвращаем скролл колёсиком за пределами выпадающего списка
      const handleWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement
        const dropdown = containerRef.current?.querySelector('.dropdown-scroll')

        // Если скроллим внутри выпадающего списка - разрешаем
        if (dropdown && dropdown.contains(target)) {
          const { scrollTop, scrollHeight, clientHeight } = dropdown as HTMLElement
          const isAtTop = scrollTop === 0 && e.deltaY < 0
          const isAtBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0

          // Предотвращаем скролл страницы только когда достигли края списка
          if (!isAtTop && !isAtBottom) {
            return // Разрешаем скролл внутри списка
          }
        }

        // Предотвращаем скролл страницы
        e.preventDefault()
      }

      document.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        document.removeEventListener('wheel', handleWheel)
      }
    }
  }, [isOpen])

  // Обработка клика по категории
  const handleCategoryClick = (category: string) => {
    if (onCategoryClick) {
      onCategoryClick(category)
    }
    // Очищаем поисковую строку при навигации по категориям
    // (не засоряем searchQuery названием категории)
    onChange('')
    setIsOpen(false)
  }

  // Фильтрация категорий по поисковому запросу
  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Основная поисковая строка */}
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
          isFocused ? 'text-violet-500' : 'text-gray-400'
        }`} />

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            setIsOpen(true)
          }}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-white shadow-sm
            transition-all duration-200
            placeholder:text-gray-400
            ${isFocused
              ? 'border-violet-500 ring-4 ring-violet-100 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
        />

        {/* Кнопка очистки */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Выпадающий список категорий с анимацией */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Заголовок */}
            <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-violet-600" />
                  <span className="font-semibold text-gray-800">Категории товаров</span>
                </div>
                <span className="text-xs text-gray-500">
                  {value ? `Найдено: ${filteredCategories.length}` : `Всего: ${categories.length}`}
                </span>
              </div>
            </div>

            {/* Список категорий */}
            <div className="max-h-96 overflow-y-auto dropdown-scroll overscroll-contain">
              {filteredCategories.length > 0 ? (
                <div className="py-2">
                  {/* Показать все товары */}
                  {!value && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCategoryClick('')
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-violet-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏪</span>
                        <span className="font-medium text-gray-900">Все товары</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors" />
                    </button>
                  )}

                  {/* Разделитель */}
                  {!value && <div className="mx-4 my-1 border-t border-gray-100"></div>}

                  {/* Список категорий */}
                  {filteredCategories.map((category, index) => (
                    <motion.button
                      key={category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCategoryClick(category)
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-violet-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{categoryIcons[category] || <Package className="w-5 h-5 text-gray-400" />}</span>
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                          {category}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="w-12 h-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-500">Категории не найдены</p>
                  <p className="text-sm text-gray-400 mt-1">Попробуйте изменить запрос</p>
                </div>
              )}
            </div>

            {/* Подсказка внизу */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Кликните на категорию для быстрого перехода
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}