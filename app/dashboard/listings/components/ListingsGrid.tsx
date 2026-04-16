'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Megaphone, Plus, RotateCcw } from 'lucide-react'
import type { ListingItem } from '@/hooks/useInfiniteListings'
import { ListingCard } from './ListingCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface ListingsGridProps {
  listings: ListingItem[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  badgeStatus?: boolean
  hasActiveFilters?: boolean
  onResetFilters?: () => void
}

export function ListingsGrid({
  listings,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  badgeStatus = false,
  hasActiveFilters = false,
  onResetFilters,
}: ListingsGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading && listings.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[220px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/20">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20 mb-5">
          <Megaphone className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {hasActiveFilters ? 'По этим фильтрам пока ничего нет' : 'Объявлений пока нет'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {hasActiveFilters
            ? 'Попробуйте изменить категорию или поисковый запрос, либо сбросьте фильтры.'
            : 'Станьте первым — опубликуйте заявку и получайте предложения от поставщиков напрямую.'}
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button asChild className="gap-2">
            <Link href="/dashboard/listings/new">
              <Plus className="h-4 w-4" /> Создать объявление
            </Link>
          </Button>
          {hasActiveFilters && onResetFilters && (
            <Button type="button" variant="outline" onClick={onResetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Сбросить фильтры
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} badgeStatus={badgeStatus} />
        ))}
      </div>

      {hasNextPage && (
        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
          {isFetchingNextPage && (
            <span className="text-sm text-muted-foreground">Загрузка…</span>
          )}
        </div>
      )}
    </div>
  )
}
