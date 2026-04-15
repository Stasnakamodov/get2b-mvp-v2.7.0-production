'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Grid3X3,
  Users,
  ArrowLeft,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useSuppliers } from '@/src/features/supplier-management'
import { SupplierGrid } from '@/src/widgets/catalog-suppliers'
import type { Supplier, RoomType } from '@/src/entities/supplier'
import { CatalogSidebar } from '@/app/dashboard/catalog/components/CatalogSidebar'
import { CatalogGrid } from '@/app/dashboard/catalog/components/CatalogGrid'
import { useInfiniteProducts, flattenProducts } from '@/hooks/useInfiniteProducts'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import { useFacets } from '@/hooks/useFacets'
import { toast } from '@/hooks/use-toast'
import { SEARCH_DEBOUNCE_MS } from '@/lib/catalog/constants'
import { getProductImage, getCleanImages } from '@/lib/catalog/utils'
import type { CatalogProduct, CatalogFilters } from '@/lib/catalog/types'

interface Step2CatalogPickerModalProps {
  open: boolean
  onClose: () => void
  onAddProducts: (products: any[]) => void
}

type Tab = 'categories' | 'suppliers'

interface PickerItem {
  product: CatalogProduct
  qty: number
  roomType: 'verified' | 'user'
}

export default function Step2CatalogPickerModal({
  open,
  onClose,
  onAddProducts,
}: Step2CatalogPickerModalProps) {
  const [tab, setTab] = useState<Tab>('categories')
  const [room, setRoom] = useState<RoomType>('orange')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)
  const [picker, setPicker] = useState<Map<string, PickerItem>>(new Map())
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  // Phase 7 — debounce search input → debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  // Phase 6 — на закрытии чистим только локальную навигацию.
  // picker сохраняется до явного "Отмена" или confirm.
  useEffect(() => {
    if (!open) {
      setSearchInput('')
      setDebouncedSearch('')
      setSelectedCategory(undefined)
      setSelectedSubcategory(undefined)
      setViewingSupplier(null)
    }
  }, [open])

  // Когда корзина опустела — раскрываем панель к следующему добавлению
  useEffect(() => {
    if (picker.size === 0) setPanelCollapsed(false)
  }, [picker.size])

  const { categories, isLoading: categoriesLoading } = useCatalogCategories()

  // Phase 3 — живые facet counts для сайдбара
  const facetFilters: CatalogFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: selectedCategory,
      subcategory: selectedSubcategory,
    }),
    [debouncedSearch, selectedCategory, selectedSubcategory]
  )

  const { data: facetData } = useFacets(facetFilters, open && tab === 'categories')

  const categoriesQuery = useInfiniteProducts({
    supplierType: 'verified',
    category: selectedCategory,
    subcategory: selectedSubcategory,
    search: debouncedSearch || undefined,
    limit: 50,
    enabled: open && tab === 'categories',
  })

  const supplierQuery = useInfiniteProducts({
    supplierType: room === 'orange' ? 'verified' : 'user',
    supplierId: viewingSupplier?.id,
    limit: 50,
    enabled: open && tab === 'suppliers' && !!viewingSupplier,
  })

  const {
    userSuppliers,
    verifiedSuppliers,
    isLoading: suppliersLoading,
  } = useSuppliers()

  const displayedSuppliers = useMemo(
    () => (room === 'orange' ? verifiedSuppliers : userSuppliers),
    [room, verifiedSuppliers, userSuppliers]
  )

  // Phase 4 — single-supplier guard на добавлении
  const togglePicker = (product: CatalogProduct) => {
    setPicker(prev => {
      const next = new Map(prev)
      if (next.has(product.id)) {
        next.delete(product.id)
        return next
      }
      if (prev.size > 0) {
        const first = prev.values().next().value as PickerItem | undefined
        if (first && first.product.supplier_id !== product.supplier_id) {
          toast({
            title: 'Разные поставщики',
            description: `В корзине уже товары от "${first.product.supplier_name || 'другого поставщика'}". Очистите выбор или выберите того же поставщика.`,
            variant: 'destructive',
          })
          return prev
        }
      }
      const roomType: 'verified' | 'user' =
        tab === 'categories' ? 'verified' : room === 'orange' ? 'verified' : 'user'
      next.set(product.id, { product, qty: 1, roomType })
      return next
    })
  }

  const removeFromPicker = (productId: string) => {
    setPicker(prev => {
      const next = new Map(prev)
      next.delete(productId)
      return next
    })
  }

  // Phase 5 — qty editor
  const setQty = (productId: string, qty: number) => {
    setPicker(prev => {
      const item = prev.get(productId)
      if (!item) return prev
      const next = new Map(prev)
      next.set(productId, { ...item, qty: Math.max(1, qty) })
      return next
    })
  }

  const isInPicker = (productId: string) => picker.has(productId)

  const handleConfirm = () => {
    const items = Array.from(picker.values()).map(({ product, qty, roomType }) => {
      const cleanImages = getCleanImages(product)
      return {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        quantity: qty,
        price: product.price ?? 0,
        currency: product.currency,
        supplier_id: product.supplier_id,
        supplier_name: product.supplier_name || '',
        images: cleanImages,
        image_url: cleanImages[0] || '',
        category_name: product.category || '',
        subcategory_name: product.subcategory,
        room_type: roomType,
      }
    })
    onAddProducts(items)
    setPicker(new Map())
    onClose()
  }

  // Phase 6 — Cancel = очистить + закрыть. X/ESC/клик-вне идут через onClose без сброса.
  const handleCancel = () => {
    setPicker(new Map())
    onClose()
  }

  const pickerCount = picker.size
  const pickerArray = useMemo(() => Array.from(picker.values()), [picker])
  const firstSupplierName = pickerArray[0]?.product.supplier_name || ''
  const totalAmount = pickerArray.reduce(
    (sum, it) => sum + (it.product.price ?? 0) * it.qty,
    0
  )
  const firstCurrency = pickerArray[0]?.product.currency || 'USD'

  // Phase 9 — error banner
  const renderErrorBanner = (error: unknown, onRetry: () => void) => {
    if (!error) return null
    return (
      <div className="mx-3 my-2 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <div className="flex-1 text-sm">Не удалось загрузить товары. Попробуйте ещё раз.</div>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Повторить
        </Button>
      </div>
    )
  }

  const renderCategoriesTab = () => {
    const products = flattenProducts(categoriesQuery.data) as unknown as CatalogProduct[]
    return (
      <div className="flex flex-1 min-h-0">
        {/* Phase 2 — отдаём ширину сайдбару, без обрезающего w-72 + overflow-hidden */}
        <div className="shrink-0 border-r border-gray-100 dark:border-gray-800">
          <CatalogSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onCategorySelect={(c, s) => {
              setSelectedCategory(c)
              setSelectedSubcategory(s)
            }}
            isLoading={categoriesLoading}
            facetCounts={facetData?.categories}
          />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию товара..."
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
          {renderErrorBanner(categoriesQuery.error, () => categoriesQuery.refetch())}
          <CatalogGrid
            products={products}
            isLoading={categoriesQuery.isLoading}
            isFetchingNextPage={categoriesQuery.isFetchingNextPage}
            hasNextPage={categoriesQuery.hasNextPage ?? false}
            fetchNextPage={categoriesQuery.fetchNextPage}
            viewMode="grid-4"
            isInCart={isInPicker}
            onAddToCart={togglePicker}
            onRemoveFromCart={removeFromPicker}
            onProductClick={togglePicker}
          />
        </div>
      </div>
    )
  }

  const renderSupplierDrillIn = () => {
    const products = flattenProducts(supplierQuery.data) as unknown as CatalogProduct[]
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewingSupplier(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            К поставщикам
          </Button>
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {viewingSupplier?.name}
            {viewingSupplier?.country && (
              <span className="text-gray-400 font-normal ml-2">· {viewingSupplier.country}</span>
            )}
          </div>
        </div>
        {renderErrorBanner(supplierQuery.error, () => supplierQuery.refetch())}
        <CatalogGrid
          products={products}
          isLoading={supplierQuery.isLoading}
          isFetchingNextPage={supplierQuery.isFetchingNextPage}
          hasNextPage={supplierQuery.hasNextPage ?? false}
          fetchNextPage={supplierQuery.fetchNextPage}
          viewMode="grid-4"
          isInCart={isInPicker}
          onAddToCart={togglePicker}
          onRemoveFromCart={removeFromPicker}
          onProductClick={togglePicker}
        />
      </div>
    )
  }

  const renderSuppliersList = () => {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <button
            onClick={() => setRoom('orange')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              room === 'orange'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Оранжевая (аккредитованные)
          </button>
          <button
            onClick={() => setRoom('blue')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              room === 'blue'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Синяя (мои поставщики)
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <SupplierGrid
            suppliers={displayedSuppliers}
            loading={suppliersLoading}
            onSupplierClick={(s) => setViewingSupplier(s)}
            showActions={false}
            roomType={room}
            showSearch={true}
            showFilters={false}
            showPagination={true}
            emptyMessage={
              room === 'orange'
                ? 'Аккредитованные поставщики не найдены'
                : 'У вас пока нет личных поставщиков'
            }
          />
        </div>
      </div>
    )
  }

  // Phase 5 — правая панель «выбрано»
  const renderSelectionPanel = () => {
    if (pickerCount === 0 || panelCollapsed) return null
    return (
      <aside className="w-80 shrink-0 border-l border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/30">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Выбрано ({pickerCount})
            </div>
            {firstSupplierName && (
              <div className="text-xs text-gray-500 truncate">{firstSupplierName}</div>
            )}
          </div>
          <button
            onClick={() => setPanelCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Свернуть панель"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {pickerArray.map(({ product, qty }) => {
            const thumb = getProductImage(product)
            const lineTotal = (product.price ?? 0) * qty
            return (
              <div
                key={product.id}
                className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 flex gap-2.5"
              >
                <div className="w-12 h-12 shrink-0 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 pr-5">
                    {product.name}
                  </div>
                  {product.sku && (
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{product.sku}</div>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQty(product.id, qty - 1)}
                        disabled={qty <= 1}
                        className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                        aria-label="Уменьшить"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!Number.isNaN(v)) setQty(product.id, v)
                        }}
                        className="w-10 h-6 text-center text-xs tabular-nums border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                      />
                      <button
                        onClick={() => setQty(product.id, qty + 1)}
                        className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Увеличить"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {lineTotal.toLocaleString('ru-RU')} {product.currency}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFromPicker(product.id)}
                  className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Удалить из выбора"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Итого:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
              {totalAmount.toLocaleString('ru-RU')} {firstCurrency}
            </span>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        {/* Phase 1 — DialogTitle/Description (a11y), без ручного X (Radix Close в углу) */}
        <div className="flex items-center gap-4 px-4 py-1.5 pr-10 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 m-0">
            Каталог товаров
          </DialogTitle>
          <DialogDescription className="sr-only">
            Выбор товаров для добавления в спецификацию проекта
          </DialogDescription>
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-md ml-auto">
            <button
              onClick={() => {
                setTab('categories')
                setViewingSupplier(null)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tab === 'categories'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Категории
            </button>
            <button
              onClick={() => setTab('suppliers')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tab === 'suppliers'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Поставщики
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-1 min-w-0">
            {tab === 'categories' && renderCategoriesTab()}
            {tab === 'suppliers' && !viewingSupplier && renderSuppliersList()}
            {tab === 'suppliers' && viewingSupplier && renderSupplierDrillIn()}
          </div>
          {renderSelectionPanel()}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => {
              if (pickerCount === 0) return
              setPanelCollapsed(false)
            }}
            disabled={pickerCount === 0}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 disabled:cursor-default hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Выбрано:{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{pickerCount}</span>
            {pickerCount > 0 && panelCollapsed && (
              <span className="text-xs text-orange-500 ml-1">показать</span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Отмена
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={pickerCount === 0}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              Добавить в проект ({pickerCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
