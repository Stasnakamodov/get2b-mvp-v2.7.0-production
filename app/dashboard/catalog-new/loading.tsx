import { Loader2 } from 'lucide-react'

/**
 * Loading UI для каталога
 * Показывается при серверной загрузке страницы
 */
export default function CatalogLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-900 border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar skeleton */}
        <div className="w-64 bg-white dark:bg-gray-900 border-r p-4 hidden md:block">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Загрузка каталога...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
