'use client'

import React, { useState, useMemo } from 'react'
import { Package, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import type { CatalogCategory } from '@/lib/catalog/types'

interface CategorySidebarProps {
  categories: CatalogCategory[]
  selectedCategory: string
  selectedSubcategory: string
  onCategorySelect: (category: string, subcategory?: string) => void
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleExpanded = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryName)) next.delete(categoryName)
      else next.add(categoryName)
      return next
    })
  }

  // Auto-expand when subcategory is selected
  React.useEffect(() => {
    if (selectedCategory) {
      setExpandedCategories(prev => new Set([...prev, selectedCategory]))
    }
  }, [selectedCategory])

  const isSelected = !selectedCategory && !selectedSubcategory

  return (
    <div className="space-y-1">
      {/* All products */}
      <Button
        variant={isSelected ? "default" : "ghost"}
        className={`w-full justify-start h-12 max-md:h-10 ${
          isSelected ? "" : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        onClick={() => onCategorySelect('')}
      >
        <Package className="h-5 w-5 mr-3 max-md:h-4 max-md:w-4 max-md:mr-2" />
        <span className="font-semibold max-md:text-sm">Все товары</span>
      </Button>

      {categories.map(category => {
        const hasChildren = category.children && category.children.length > 0
        const isExpanded = expandedCategories.has(category.name)
        const isCatSelected = selectedCategory === category.name && !selectedSubcategory
        const icon = category.icon || '📦'

        if (category.products_count === 0) return null

        return (
          <div key={category.id}>
            <div className="flex items-center">
              <Button
                variant="ghost"
                className={`flex-1 justify-start h-12 max-md:h-10 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isCatSelected ? "bg-gray-100 dark:bg-gray-800 font-semibold" : ""
                }`}
                onClick={() => {
                  if (hasChildren) {
                    toggleExpanded(category.name)
                  } else {
                    onCategorySelect(category.name)
                  }
                }}
              >
                <span className="text-xl mr-2 max-md:text-lg">{icon}</span>
                <span className="font-medium flex-1 text-left text-sm max-md:text-xs">{category.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{category.products_count}</span>
                {hasChildren && (
                  isExpanded
                    ? <ChevronDown className="h-4 w-4 text-gray-400" />
                    : <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>

            {hasChildren && isExpanded && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                {/* Select all in category */}
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-10 max-md:h-9 text-sm max-md:text-xs ${
                    isCatSelected ? "bg-gray-100 dark:bg-gray-800 font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => onCategorySelect(category.name)}
                >
                  <span className="flex-1 text-left">Все в {category.name}</span>
                </Button>
                {category.children!
                  .filter(sub => sub.products_count > 0)
                  .map(sub => {
                    const isSubSelected = selectedCategory === category.name && selectedSubcategory === sub.name
                    return (
                      <Button
                        key={sub.id}
                        variant="ghost"
                        className={`w-full justify-start h-10 max-md:h-9 text-sm max-md:text-xs ${
                          isSubSelected ? "bg-gray-100 dark:bg-gray-800 font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => onCategorySelect(category.name, sub.name)}
                      >
                        <span className="flex-1 text-left">{sub.name}</span>
                        <span className="text-xs text-gray-400">{sub.products_count}</span>
                      </Button>
                    )
                  })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
