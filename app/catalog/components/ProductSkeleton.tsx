'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProductSkeleton() {
  return (
    <Card className="shadow-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[360px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[480px] animate-pulse">
      <div className="w-full h-44 sm:h-52 md:h-56 lg:h-64 bg-gray-200 dark:bg-gray-700" />
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
        <div className="space-y-2 pt-2 mt-auto">
          <div className="h-10 sm:h-11 md:h-12 bg-gray-300 dark:bg-gray-600 rounded w-full" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  )
}
