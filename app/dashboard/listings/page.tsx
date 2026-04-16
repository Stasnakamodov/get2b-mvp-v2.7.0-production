'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Flame, Megaphone, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import {
  flattenListings,
  getListingsTotalCount,
  useInfiniteListings,
  type ListingsSort,
} from '@/hooks/useInfiniteListings'
import { useListingFacets } from '@/hooks/useListingFacets'
import { ListingsGrid } from './components/ListingsGrid'
import { CategoryChipRow } from './components/CategoryChipRow'
import type { CatalogCategory, FacetCount } from '@/lib/catalog/types'

export default function ListingsPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [sort, setSort] = useState<ListingsSort>('newest')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>()

  const { categories } = useCatalogCategories()

  const allCategoryNodes = useMemo(() => {
    const flat: CatalogCategory[] = []
    for (const c of categories) {
      flat.push(c)
      if (c.children) {
        for (const ch of c.children) {
          flat.push({
            id: ch.id,
            key: ch.key,
            name: ch.name,
            icon: ch.icon,
            products_count: ch.products_count,
          })
        }
      }
    }
    return flat
  }, [categories])

  const selectedCategory = useMemo(
    () =>
      selectedCategoryName
        ? allCategoryNodes.find((c) => c.name === selectedCategoryName)
        : undefined,
    [selectedCategoryName, allCategoryNodes]
  )

  const facetsQuery = useListingFacets({
    search: search || undefined,
    urgent: urgentOnly ? true : undefined,
  })

  const facetCounts: FacetCount[] = useMemo(() => {
    const cats = facetsQuery.data?.categories ?? {}
    return allCategoryNodes
      .map((c) => ({ name: c.name, count: cats[c.id] ?? 0 }))
      .filter((fc) => fc.count > 0)
  }, [facetsQuery.data, allCategoryNodes])

  const listingsQuery = useInfiniteListings({
    categoryId: selectedCategory?.id,
    search: search || undefined,
    urgent: urgentOnly ? true : undefined,
    sort,
  })

  const visibleListings = useMemo(
    () => flattenListings(listingsQuery.data),
    [listingsQuery.data]
  )

  const totalCount = getListingsTotalCount(listingsQuery.data)

  const hasActiveFilters =
    !!search || urgentOnly || !!selectedCategoryName

  const handleResetFilters = () => {
    setSearch('')
    setSearchInput('')
    setUrgentOnly(false)
    setSelectedCategoryName(undefined)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  return (
    <main className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/20">
                <Megaphone className="h-5 w-5 text-white" />
              </span>
              Каталог объявлений
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Заявки от клиентов на покупку — связывайтесь напрямую через ЧатХаб
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/listings/my">Мои объявления</Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/dashboard/listings/new">
                <Plus className="h-4 w-4" /> Создать объявление
              </Link>
            </Button>
          </div>
        </header>

        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative w-full sm:max-w-[480px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск по названию или описанию"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant={urgentOnly ? 'default' : 'outline'}
              onClick={() => setUrgentOnly((v) => !v)}
              className="gap-1.5"
            >
              <Flame className="h-4 w-4" />
              Срочные
            </Button>
            <Select value={sort} onValueChange={(v) => setSort(v as ListingsSort)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">По дате (новые)</SelectItem>
                <SelectItem value="urgent">Срочные сверху</SelectItem>
                <SelectItem value="deadline">По дедлайну</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Найти</Button>
          </div>
        </form>

        <CategoryChipRow
          categories={categories}
          facetCounts={facetCounts}
          selected={selectedCategoryName}
          onSelect={setSelectedCategoryName}
          isLoading={facetsQuery.isLoading}
        />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Найдено: <span className="font-semibold text-foreground">{totalCount}</span>
            {selectedCategoryName && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => setSelectedCategoryName(undefined)}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  сбросить «{selectedCategoryName}»
                </button>
              </>
            )}
          </span>
        </div>

        <ListingsGrid
          listings={visibleListings}
          isLoading={listingsQuery.isLoading}
          isFetchingNextPage={listingsQuery.isFetchingNextPage}
          hasNextPage={!!listingsQuery.hasNextPage}
          fetchNextPage={listingsQuery.fetchNextPage}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      </div>
    </main>
  )
}
