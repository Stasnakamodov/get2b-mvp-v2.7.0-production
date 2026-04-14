'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Grid3X3, Users, ArrowLeft, ShoppingCart, X, Search } from 'lucide-react'
import { useSuppliers } from '@/src/features/supplier-management'
import { SupplierGrid } from '@/src/widgets/catalog-suppliers'
import type { Supplier, RoomType } from '@/src/entities/supplier'
import { CatalogSidebar } from '@/app/dashboard/catalog/components/CatalogSidebar'
import { CatalogGrid } from '@/app/dashboard/catalog/components/CatalogGrid'
import { useInfiniteProducts, flattenProducts } from '@/hooks/useInfiniteProducts'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import type { CatalogProduct } from '@/lib/catalog/types'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)
  const [picker, setPicker] = useState<Map<string, PickerItem>>(new Map())

  useEffect(() => {
    if (!open) {
      setPicker(new Map())
      setSearchQuery('')
      setSelectedCategory(undefined)
      setSelectedSubcategory(undefined)
      setViewingSupplier(null)
    }
  }, [open])

  const { categories, isLoading: categoriesLoading } = useCatalogCategories()

  const categoriesQuery = useInfiniteProducts({
    supplierType: 'verified',
    category: selectedCategory,
    subcategory: selectedSubcategory,
    search: searchQuery || undefined,
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

  const togglePicker = (product: CatalogProduct) => {
    setPicker(prev => {
      const next = new Map(prev)
      if (next.has(product.id)) {
        next.delete(product.id)
      } else {
        const roomType: 'verified' | 'user' =
          tab === 'categories' ? 'verified' : room === 'orange' ? 'verified' : 'user'
        next.set(product.id, { product, qty: 1, roomType })
      }
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

  const isInPicker = (productId: string) => picker.has(productId)

  const handleConfirm = () => {
    const items = Array.from(picker.values()).map(({ product, qty, roomType }) => ({
      id: product.id,
      name: product.name,
      sku: product.sku || '',
      quantity: qty,
      price: product.price ?? 0,
      currency: product.currency,
      supplier_id: product.supplier_id,
      supplier_name: product.supplier_name || '',
      images: product.images || [],
      category_name: product.category || '',
      subcategory_name: product.subcategory,
      room_type: roomType,
    }))
    onAddProducts(items)
    setPicker(new Map())
    onClose()
  }

  const pickerCount = picker.size

  const renderCategoriesTab = () => {
    const products = flattenProducts(categoriesQuery.data) as unknown as CatalogProduct[]
    return (
      <div className="flex flex-1 min-h-0">
        <div className="w-72 shrink-0 border-r border-gray-100 dark:border-gray-800 overflow-hidden">
          <CatalogSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onCategorySelect={(c, s) => {
              setSelectedCategory(c)
              setSelectedSubcategory(s)
            }}
            isLoading={categoriesLoading}
          />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию товара..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CatalogGrid
            products={products}
            isLoading={categoriesQuery.isLoading}
            isFetchingNextPage={categoriesQuery.isFetchingNextPage}
            hasNextPage={categoriesQuery.hasNextPage ?? false}
            fetchNextPage={categoriesQuery.fetchNextPage}
            viewMode="grid-3"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingSupplier(null)}
          >
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
        <CatalogGrid
          products={products}
          isLoading={supplierQuery.isLoading}
          isFetchingNextPage={supplierQuery.isFetchingNextPage}
          hasNextPage={supplierQuery.hasNextPage ?? false}
          fetchNextPage={supplierQuery.fetchNextPage}
          viewMode="grid-3"
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Каталог товаров
          </h2>
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => {
                setTab('categories')
                setViewingSupplier(null)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'categories'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Категории
            </button>
            <button
              onClick={() => setTab('suppliers')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'suppliers'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Users className="w-4 h-4" />
              Поставщики
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {tab === 'categories' && renderCategoriesTab()}
          {tab === 'suppliers' && !viewingSupplier && renderSuppliersList()}
          {tab === 'suppliers' && viewingSupplier && renderSupplierDrillIn()}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <ShoppingCart className="w-4 h-4" />
            Выбрано: <span className="font-semibold text-gray-900 dark:text-gray-100">{pickerCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
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
