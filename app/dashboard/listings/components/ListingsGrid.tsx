'use client'

import { useEffect, useRef } from 'react'
import { Megaphone } from 'lucide-react'
import type { ListingItem } from '@/hooks/useInfiniteListings'
import { ListingCard } from './ListingCard'
import { Skeleton } from '@/components/ui/skeleton'

interface ListingsGridProps {
  listings: ListingItem[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  badgeStatus?: boolean
}

export function ListingsGrid({
  listings,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  badgeStatus = false,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[220px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-orange-50 p-4 mb-4">
          <Megaphone className="h-10 w-10 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Объявления не найдены</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Попробуйте изменить фильтры или категорию. Или станьте первым — опубликуйте свою заявку.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
