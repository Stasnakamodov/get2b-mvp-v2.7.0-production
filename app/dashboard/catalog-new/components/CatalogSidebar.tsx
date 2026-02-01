'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CatalogCategory } from '@/lib/catalog/types'
import { DEFAULT_CATEGORIES } from '@/lib/catalog/constants'

interface CatalogSidebarProps {
  categories?: CatalogCategory[]
  selectedCategory?: string
  onCategorySelect: (category: string | undefined) => void
  isLoading?: boolean
}

/**
 * Боковая панель с деревом категорий
 */
export function CatalogSidebar({
  categories,
  selectedCategory,
  onCategorySelect,
  isLoading = false
}: CatalogSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Используем категории из props или дефолтные
  const displayCategories = categories || DEFAULT_CATEGORIES.map(cat => ({
    id: cat.key,
    key: cat.key,
    name: cat.name,
    icon: cat.icon,
    products_count: 0,
    children: []
  }))

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      onCategorySelect(undefined) // Снять выбор
    } else {
      onCategorySelect(categoryName)
    }
  }

  return (
    <div className="w-64 border-r bg-white dark:bg-gray-900 flex flex-col h-full">
      {/* Заголовок */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Folder className="w-5 h-5 text-orange-500" />
          Категории
        </h2>
      </div>

      {/* Кнопка "Все товары" */}
      <div className="p-2 border-b">
        <Button
          variant={!selectedCategory ? 'default' : 'ghost'}
          className={`w-full justify-start ${!selectedCategory ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
          onClick={() => onCategorySelect(undefined)}
        >
          Все товары
        </Button>
      </div>

      {/* Список категорий */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            // Skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
            ))
          ) : (
            displayCategories.map(category => (
              <div key={category.id}>
                {/* Категория */}
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* Иконка раскрытия (если есть подкатегории) */}
                  {category.children && category.children.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(category.id)
                      }}
                      className="p-0.5 hover:bg-gray-200 rounded"
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <span className="w-5" />
                  )}

                  {/* Иконка категории */}
                  <span className="text-lg">
                    {category.icon || (expandedCategories.has(category.id) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />)}
                  </span>

                  {/* Название */}
                  <button
                    className="flex-1 text-left text-sm font-medium truncate"
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    {category.name}
                  </button>

                  {/* Счётчик */}
                  {category.products_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {category.products_count}
                    </Badge>
                  )}
                </div>

                {/* Подкатегории */}
                {expandedCategories.has(category.id) && category.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.children.map(sub => (
                      <button
                        key={sub.id}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === sub.name
                            ? 'bg-orange-100 text-orange-700'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        onClick={() => handleCategoryClick(sub.name)}
                      >
                        <span className="w-4 h-4 rounded-full border-2 border-current" />
                        <span className="flex-1 text-left truncate">{sub.name}</span>
                        {sub.products_count > 0 && (
                          <span className="text-xs text-gray-400">
                            {sub.products_count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default CatalogSidebar
