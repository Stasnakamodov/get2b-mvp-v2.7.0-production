'use client'

import { X } from 'lucide-react'
import type { CatalogFilters } from '@/lib/catalog/types'

interface FilterTagsProps {
  filters: CatalogFilters
  selectedCategoryName?: string
  selectedSubcategoryName?: string
  onRemoveFilter: (key: keyof CatalogFilters) => void
}

export function FilterTags({ filters, selectedCategoryName, selectedSubcategoryName, onRemoveFilter }: FilterTagsProps) {
  const tags: { key: keyof CatalogFilters; label: string }[] = []

  if (filters.search) {
    tags.push({ key: 'search', label: `Поиск: "${filters.search}"` })
  }
  if (filters.category) {
    tags.push({ key: 'category', label: selectedCategoryName || filters.category })
  }
  if (filters.subcategory) {
    tags.push({ key: 'subcategory', label: selectedSubcategoryName || filters.subcategory })
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const parts: string[] = []
    if (filters.minPrice !== undefined) parts.push(`от ${filters.minPrice.toLocaleString('ru-RU')}`)
    if (filters.maxPrice !== undefined) parts.push(`до ${filters.maxPrice.toLocaleString('ru-RU')}`)
    tags.push({ key: 'minPrice', label: `Цена: ${parts.join(' ')}` })
  }
  if (filters.inStock) {
    tags.push({ key: 'inStock', label: 'В наличии' })
  }
  if (filters.country) {
    tags.push({ key: 'country', label: `Страна: ${filters.country}` })
  }

  if (tags.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map(tag => (
        <button
          key={tag.key}
          onClick={() => onRemoveFilter(tag.key)}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs hover:bg-orange-100 transition-colors"
        >
          {tag.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  )
}

export default FilterTags
