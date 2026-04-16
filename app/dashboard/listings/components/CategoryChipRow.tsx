'use client'

import { useMemo } from 'react'
import type { CatalogCategory, FacetCount } from '@/lib/catalog/types'

interface CategoryChipRowProps {
  categories: CatalogCategory[]
  facetCounts: FacetCount[]
  selected?: string
  onSelect: (name?: string) => void
  isLoading?: boolean
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export function CategoryChipRow({
  categories,
  facetCounts,
  selected,
  onSelect,
  isLoading = false,
}: CategoryChipRowProps) {
  const chips = useMemo(() => {
    const countMap = new Map<string, number>()
    for (const fc of facetCounts) countMap.set(fc.name, fc.count)

    const total = facetCounts.reduce((sum, fc) => sum + fc.count, 0)

    const flat: Array<{ key: string; name: string; icon?: string; count: number }> = []
    for (const c of categories) {
      const ownCount = countMap.get(c.name) ?? 0
      const childCount = c.children
        ? c.children.reduce((s, ch) => s + (countMap.get(ch.name) ?? 0), 0)
        : 0
      const catTotal = ownCount + childCount
      if (catTotal > 0) {
        flat.push({ key: c.id, name: c.name, icon: c.icon, count: catTotal })
      }
      if (c.children) {
        for (const ch of c.children) {
          const cnt = countMap.get(ch.name) ?? 0
          if (cnt > 0) {
            flat.push({ key: ch.id, name: ch.name, icon: ch.icon, count: cnt })
          }
        }
      }
    }

    flat.sort((a, b) => b.count - a.count)

    return { total, items: flat }
  }, [categories, facetCounts])

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-28 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    )
  }

  const allActive = !selected

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`shrink-0 snap-start inline-flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium transition-all duration-200 ${
          allActive
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:text-orange-600'
        }`}
      >
        <span>Все</span>
        {chips.total > 0 && (
          <span
            className={`tabular-nums text-xs ${
              allActive ? 'text-white/80' : 'text-gray-400'
            }`}
          >
            {formatCount(chips.total)}
          </span>
        )}
      </button>

      {chips.items.map((chip) => {
        const isActive = selected === chip.name
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onSelect(isActive ? undefined : chip.name)}
            className={`shrink-0 snap-start inline-flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:text-orange-600'
            }`}
          >
            {chip.icon && <span className="text-base leading-none">{chip.icon}</span>}
            <span className="whitespace-nowrap">{chip.name}</span>
            <span
              className={`tabular-nums text-xs ${
                isActive ? 'text-white/80' : 'text-gray-400'
              }`}
            >
              {formatCount(chip.count)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
