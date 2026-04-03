import { Suspense } from 'react'
import type { Metadata } from 'next'
import CatalogClient from './components/CatalogClient'
import { ProductGridSkeleton } from './components/ProductSkeleton'

export const metadata: Metadata = {
  title: 'Каталог товаров | GET2B',
  description: 'Каталог товаров от проверенных поставщиков. Поиск по категориям, фильтрация, сравнение цен.',
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 p-6">
        <div className="max-w-[1920px] mx-auto">
          <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6 animate-pulse" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    }>
      <CatalogClient />
    </Suspense>
  )
}
