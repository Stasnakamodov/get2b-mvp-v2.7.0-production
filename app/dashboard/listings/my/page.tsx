'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Megaphone, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  flattenListings,
  getListingsTotalCount,
  useInfiniteListings,
} from '@/hooks/useInfiniteListings'
import { ListingsGrid } from '../components/ListingsGrid'

export default function MyListingsPage() {
  const query = useInfiniteListings({ mine: true })
  const listings = useMemo(() => flattenListings(query.data), [query.data])
  const total = getListingsTotalCount(query.data)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href="/dashboard/listings">
              <ArrowLeft className="h-4 w-4 mr-2" /> К каталогу
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-orange-500" />
            Мои объявления
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего: <span className="font-semibold text-foreground">{total}</span>
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/listings/new">
            <Plus className="h-4 w-4" /> Создать
          </Link>
        </Button>
      </div>

      <ListingsGrid
        listings={listings}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={!!query.hasNextPage}
        fetchNextPage={query.fetchNextPage}
        badgeStatus
      />
    </div>
  )
}
