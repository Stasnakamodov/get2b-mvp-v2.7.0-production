'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CatalogCategory, FacetCount } from '@/lib/catalog/types'
import { DEFAULT_CATEGORIES } from '@/lib/catalog/constants'

interface CatalogSidebarProps {
  categories?: CatalogCategory[]
  selectedCategory?: string
  selectedSubcategory?: string
  onCategorySelect: (category: string | undefined, subcategory?: string) => void
  isLoading?: boolean
  facetCounts?: FacetCount[]
}

function formatCount(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return String(n)
}

/**
 * Sidebar with category tree navigation
 */
export function CatalogSidebar({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  isLoading = false,
  facetCounts,
}: CatalogSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const displayCategories = categories || DEFAULT_CATEGORIES.map(cat => ({
    id: cat.key,
    key: cat.key,
    name: cat.name,
    icon: cat.icon,
    products_count: 0,
    children: []
  }))

  // Auto-expand selected category
  useEffect(() => {
    if (selectedCategory) {
      const cat = displayCategories.find(c => c.name === selectedCategory)
      if (cat && cat.children && cat.children.length > 0) {
        setExpandedCategories(prev => {
          if (prev.has(cat.id)) return prev
          const next = new Set(prev)
          next.add(cat.id)
          return next
        })
      }
    }
  }, [selectedCategory, displayCategories])

  // Build a map of facet counts by category name for quick lookup
  const facetCountMap = new Map<string, number>()
  if (facetCounts) {
    for (const fc of facetCounts) {
      facetCountMap.set(fc.name, fc.count)
    }
  }

  // Helper: get count for a category (facet-based when available, static otherwise)
  const getCategoryCount = (cat: CatalogCategory) => {
    if (facetCounts) {
      return facetCountMap.get(cat.name) ?? 0
    }
    return cat.products_count
  }

  const totalProducts = facetCounts
    ? facetCounts.reduce((sum, fc) => sum + fc.count, 0)
    : displayCategories.reduce((sum, cat) => sum + cat.products_count, 0)

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
    if (selectedCategory === categoryName && !selectedSubcategory) {
      onCategorySelect(undefined)
    } else {
      onCategorySelect(categoryName)
    }
  }

  const handleSubcategoryClick = (parentCategoryName: string, subcategoryId: string) => {
    if (selectedSubcategory === subcategoryId) {
      onCategorySelect(parentCategoryName)
    } else {
      onCategorySelect(parentCategoryName, subcategoryId)
    }
  }

  return (
    <div className="w-80 border-r bg-white dark:bg-gray-900 flex flex-col h-full">
      {/* Header with total count */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Folder className="w-5 h-5 text-orange-500" />
          Категории
        </h2>
        {totalProducts > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {totalProducts.toLocaleString('ru-RU')} товаров
          </p>
        )}
      </div>

      {/* All products button */}
      <div className="px-3 pt-3 pb-1">
        <button
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            !selectedCategory
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => onCategorySelect(undefined, undefined)}
        >
          Все товары
          {totalProducts > 0 && !selectedCategory && (
            <span className="ml-2 text-white/80 text-xs">({formatCount(totalProducts)})</span>
          )}
        </button>
      </div>

      {/* Category list */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 bg-gray-100 animate-pulse rounded-xl mb-1" />
            ))
          ) : (
            displayCategories.map(category => {
              const isSelected = selectedCategory === category.name && !selectedSubcategory
              const isParentOfSelected = selectedCategory === category.name && !!selectedSubcategory
              const isExpanded = expandedCategories.has(category.id)
              const hasChildren = category.children && category.children.length > 0
              const dynamicCount = getCategoryCount(category)

              return (
                <div key={category.id}>
                  {/* Category row */}
                  <div
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-300 dark:border-orange-800'
                        : isParentOfSelected
                          ? 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {/* Expand toggle */}
                    {hasChildren ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(category.id)
                        }}
                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    ) : (
                      <span className="w-4.5" />
                    )}

                    {/* Emoji icon */}
                    <span className="text-lg leading-none shrink-0">
                      {category.icon || '📦'}
                    </span>

                    {/* Name */}
                    <button
                      className="flex-1 text-left text-sm font-medium leading-snug"
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      {category.name}
                    </button>

                    {/* Count badge */}
                    {dynamicCount > 0 && (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-5 font-normal ${
                          isSelected
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-200'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {formatCount(dynamicCount)}
                      </Badge>
                    )}
                  </div>

                  {/* Subcategories */}
                  {isExpanded && hasChildren && (
                    <div className="ml-5 mt-1 mb-1 pl-3 border-l-2 border-gray-100 dark:border-gray-700 space-y-0.5">
                      {category.children!.map(sub => {
                        const isSubSelected = selectedSubcategory === sub.id
                        return (
                          <button
                            key={sub.id}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isSubSelected
                                ? 'bg-orange-50 text-orange-700 font-medium dark:bg-orange-900/30 dark:text-orange-300'
                                : 'hover:bg-gray-50 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-800 dark:text-gray-400'
                            }`}
                            onClick={() => handleSubcategoryClick(category.name, sub.id)}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSubSelected ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`} />
                            <span className="flex-1 text-left leading-snug">{sub.name}</span>
                            {sub.products_count > 0 && (
                              <span className={`text-[10px] ${
                                isSubSelected ? 'text-orange-500' : 'text-gray-400'
                              }`}>
                                {sub.products_count}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default CatalogSidebar
