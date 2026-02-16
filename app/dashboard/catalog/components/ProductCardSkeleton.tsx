'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface ProductCardSkeletonProps {
  viewMode?: 'grid' | 'list'
}

export function ProductCardSkeleton({ viewMode = 'grid' }: ProductCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 p-3 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex flex-col items-end justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3.5 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

export default ProductCardSkeleton
