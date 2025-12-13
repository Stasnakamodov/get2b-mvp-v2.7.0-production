'use client'

/**
 * Страница каталога с использованием FSD архитектуры
 * Поддерживает режимы: поставщики и категории
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, RefreshCw, ArrowLeft, Package, Grid3X3, Users, ShoppingCart, ChevronRight } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// FSD импорты
import {
  useSuppliers,
  useCategories
} from '@/src/features/supplier-management'

import { useCart } from '@/src/features/cart-management'
import { useSupplierModal, SupplierModal } from '@/src/features/supplier-modal'

import {
  SupplierGrid,
  SupplierCard,
  ProductCard,
  AddSupplierModal
} from '@/src/widgets/catalog-suppliers'

import type {
  Supplier,
  RoomType,
  CatalogMode
} from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'

import {
  ROOM_TYPES,
  CATALOG_MODES
} from '@/src/shared/config'

import { logger } from '@/src/shared/lib'

// Динамические импорты для оптимизации
const SubcategoryList = dynamic(
  () => import('@/components/catalog/SubcategoryList'),
  { ssr: false }
)

// Импорт существующих компонентов для категорий
const ProductGridByCategory = dynamic(
  () => import('@/components/catalog/ProductGridByCategory'),
  { loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div> }
)

export default function CatalogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // Получаем категорию из URL параметров
  const categoryFromUrl = searchParams?.get('category') || ''

  // Основные состояния страницы
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('orange')
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('categories') // По умолчанию категории (товары)
  const [showCartModal, setShowCartModal] = useState(false)
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [token, setToken] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null) // Для модального окна товара

  // Использование FSD хуков
  const {
    userSuppliers,
    verifiedSuppliers,
    isLoading: loadingSuppliers,
    userError,
    verifiedError,
    refreshSuppliers,
    filterByRoom
  } = useSuppliers()

  const {
    categories,
    selectedCategory,
    selectedSubcategory,
    loading: loadingCategories,
    loadingSubcategories,
    error: categoriesError,
    selectCategory,
    selectSubcategory,
    loadCategories
  } = useCategories()

  const {
    cart,
    activeSupplier,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems
  } = useCart()

  const supplierModal = useSupplierModal()

  // Удалено: избыточный useEffect для urlCategory - используем categoryFromUrl напрямую

  // Мемоизированная функция для mapping корзины (используется 3 раза)
  const cartMapped = useMemo(() => {
    return cart.map(item => ({
      ...item,
      description: item.description || undefined,
      total_price: parseFloat(String(item.price || 0).replace(/[^0-9.-]+/g, '')) * item.quantity,
      supplier_name: (item as any).supplier_name || '',
      room_type: (item as any).room_type || 'user',
      room_icon: (item as any).room_icon || '',
      room_description: (item as any).room_description || ''
    })) as any
  }, [cart])

  // Обработка выбора категории из URL (только при первой загрузке или изменении URL)
  // Используем ref чтобы избежать повторных срабатываний
  const lastUrlCategoryRef = React.useRef<string | null>(null)

  useEffect(() => {
    // Только если URL параметр реально изменился
    if (categoryFromUrl === lastUrlCategoryRef.current) {
      return
    }
    lastUrlCategoryRef.current = categoryFromUrl

    // Если нет категории в URL - не трогаем текущее состояние
    // (позволяет навигации назад работать корректно)
    if (!categoryFromUrl || categories.length === 0) {
      return
    }

    // Находим категорию по URL
    const categoryFromUrlMemo = categories.find(cat =>
      cat.name === categoryFromUrl || cat.category === categoryFromUrl
    )

    if (categoryFromUrlMemo && (!selectedCategory || selectedCategory.id !== categoryFromUrlMemo.id)) {
      selectCategory(categoryFromUrlMemo)
    }
  }, [categoryFromUrl, categories, selectedCategory, selectCategory])

  // Загрузка токена
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setToken(session.access_token)
      }
    }
    fetchUserData()
  }, [supabase])

  const handleSupplierClick = (supplier: Supplier) => {
    supplierModal.open(supplier)
  }

  const handleStartProject = async (supplier: Supplier) => {
    try {
      if (supplierModal.onStartProject) {
        await supplierModal.onStartProject(supplier)
        router.push('/dashboard/project-constructor')
      }
    } catch (error) {
      logger.error('Ошибка при создании проекта', error)
    }
  }

  const handleRefresh = async () => {
    if (catalogMode === 'suppliers') {
      await refreshSuppliers()
    } else {
      await loadCategories()
    }
    logger.info('✅ Каталог обновлен')
  }

  // Фильтрация поставщиков по комнате
  const suppliersToFilter = selectedRoom === 'orange' ? verifiedSuppliers : userSuppliers
  const displayedSuppliers = filterByRoom(selectedRoom)

  // Формируем номер комнаты для передачи в API
  const roomTypeForApi = selectedRoom === 'orange'
    ? ROOM_TYPES.ORANGE
    : ROOM_TYPES.BLUE

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Заголовок страницы */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg animate-gradient-shift">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Каталог товаров
                </h1>
                <p className="text-sm text-gray-500">
                  {catalogMode === 'suppliers' ? 'Просмотр поставщиков' : 'Все категории товаров'}
                </p>
              </div>
            </div>

            {/* Корзина - всегда видна */}
            <button
              onClick={() => setShowCartModal(true)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                getTotalItems() > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Корзина</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          {/* Переключатель режимов */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {/* Стильная группа переключателей режимов */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setCatalogMode('categories')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    catalogMode === 'categories'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className={`w-4 h-4 ${catalogMode === 'categories' ? 'text-indigo-600' : ''}`} />
                  Категории
                </button>

                <button
                  onClick={() => setCatalogMode('suppliers')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    catalogMode === 'suppliers'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className={`w-4 h-4 ${catalogMode === 'suppliers' ? 'text-indigo-600' : ''}`} />
                  Поставщики
                </button>
              </div>

              {/* Разделитель и переключатель комнат */}
              {catalogMode === 'suppliers' && (
                <>
                  <div className="w-px bg-gray-300 mx-1"></div>

                  {/* Переключатель комнат в том же стиле */}
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setSelectedRoom('orange')}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedRoom === 'orange'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className={selectedRoom === 'orange' ? 'text-orange-500' : ''}>
                        {ROOM_TYPES.ORANGE.icon}
                      </span>
                      Аккредитованные
                    </button>

                    <button
                      onClick={() => setSelectedRoom('blue')}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedRoom === 'blue'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className={selectedRoom === 'blue' ? 'text-blue-500' : ''}>
                        {ROOM_TYPES.BLUE.icon}
                      </span>
                      Мои поставщики
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {/* Кнопка добавления поставщика (только для синей комнаты в режиме поставщиков) */}
              {catalogMode === 'suppliers' && selectedRoom === 'blue' && (
                <button
                  onClick={() => {
                    setEditingSupplier(null)
                    setShowAddSupplierModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Добавить поставщика</span>
                </button>
              )}

              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">Обновить</span>
              </button>
            </div>
          </div>
        </div>

        {/* Контент в зависимости от режима */}
        {catalogMode === 'categories' ? (
          <>
            {/* ПРАВИЛЬНАЯ НАВИГАЦИЯ ПО КАТЕГОРИЯМ */}

            {/* 1. НЕ ВЫБРАНА КАТЕГОРИЯ - показываем ВСЕ ТОВАРЫ */}
            {!selectedCategory && !selectedSubcategory && (
              <ProductGridByCategory
                selectedCategory=""
                token={token}
                cart={cartMapped}
                selectedRoom={selectedRoom}
                activeSupplier={activeSupplier}
                onProductClick={(product: any) => {
                  setSelectedProduct(product)
                }}
                onAddToCart={(product: any) => {
                  if (addToCart(product)) {
                    logger.info('✅ Товар добавлен в корзину')
                  } else {
                    const activeSupplierProduct = cart[0] as any
                    const activeSupplierName = activeSupplierProduct?.supplier_name ||
                                              activeSupplierProduct?.supplier_company_name ||
                                              'текущего поставщика'

                    const confirmSwitch = window.confirm(
                      `В корзине уже есть товары от поставщика "${activeSupplierName}".\n\n` +
                      `Хотите очистить корзину и добавить товары от поставщика "${product.supplier_name || product.supplier_company_name}"?`
                    )

                    if (confirmSwitch) {
                      clearCart()
                      addToCart(product)
                      logger.info('✅ Корзина очищена и добавлен новый товар')
                    }
                  }
                }}
                isProductInCart={(productId: string) => cart.some(item => item.id === productId)}
              />
            )}

            {/* 2. ВЫБРАНА КАТЕГОРИЯ, НО НЕ ПОДКАТЕГОРИЯ - показываем подкатегории */}
            {selectedCategory && !selectedSubcategory && (
              <>
                {/* Навигация */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        selectCategory(null)
                        selectSubcategory(null)
                        router.push('/dashboard/catalog', { scroll: false })
                      }}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Все товары
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-lg">{selectedCategory.name}</span>
                  </div>
                </div>

                {/* Лоадер подкатегорий */}
                {loadingSubcategories && (
                  <div className="bg-white rounded-lg shadow-sm p-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-gray-500">Загрузка подкатегорий...</p>
                    </div>
                  </div>
                )}

                {/* Список подкатегорий (только когда загрузка завершена) */}
                {!loadingSubcategories && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                  <SubcategoryList
                    category={selectedCategory}
                    onSubcategorySelect={(subcategory: any) => {
                      selectSubcategory(subcategory)
                    }}
                    onBack={() => {
                      selectCategory(null)
                      selectSubcategory(null)
                    }}
                    selectedRoom={selectedRoom}
                  />
                )}

                {/* Если подкатегорий нет (после загрузки), показываем товары категории */}
                {!loadingSubcategories && (!selectedCategory.subcategories || selectedCategory.subcategories.length === 0) && (
                  <ProductGridByCategory
                    selectedCategory={selectedCategory.name}
                    token={token}
                    cart={cartMapped}
                    selectedRoom={selectedRoom}
                    activeSupplier={activeSupplier}
                    onProductClick={(product: any) => {
                      setSelectedProduct(product)
                    }}
                    onAddToCart={(product: any) => {
                      if (addToCart(product)) {
                        logger.info('✅ Товар добавлен в корзину')
                      } else {
                        const activeSupplierProduct = cart[0] as any
                        const activeSupplierName = activeSupplierProduct?.supplier_name ||
                                                  activeSupplierProduct?.supplier_company_name ||
                                                  'текущего поставщика'

                        const confirmSwitch = window.confirm(
                          `В корзине уже есть товары от поставщика "${activeSupplierName}".\n\n` +
                          `Хотите очистить корзину и добавить товары от поставщика "${product.supplier_name || product.supplier_company_name}"?`
                        )

                        if (confirmSwitch) {
                          clearCart()
                          addToCart(product)
                          logger.info('✅ Корзина очищена и добавлен новый товар')
                        }
                      }
                    }}
                    isProductInCart={(productId: string) => cart.some(item => item.id === productId)}
                  />
                )}
              </>
            )}

            {/* 3. ВЫБРАНА И КАТЕГОРИЯ, И ПОДКАТЕГОРИЯ - показываем товары подкатегории */}
            {selectedCategory && selectedSubcategory && (
              <>
                {/* Навигация */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        selectCategory(null)
                        selectSubcategory(null)
                        router.push('/dashboard/catalog', { scroll: false })
                      }}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Все товары
                    </button>
                    <span className="text-gray-400">/</span>
                    <button
                      onClick={() => {
                        selectSubcategory(null)
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedCategory.name}
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-lg">{selectedSubcategory.name}</span>
                  </div>
                </div>

                {/* Товары подкатегории */}
                <ProductGridByCategory
                  selectedCategory={selectedSubcategory.name}
                  token={token}
                  cart={cartMapped}
                  selectedRoom={selectedRoom}
                  activeSupplier={activeSupplier}
                  onProductClick={(product: any) => {
                    setSelectedProduct(product)
                  }}
                  onAddToCart={(product: any) => {
                    if (addToCart(product)) {
                      logger.info('✅ Товар добавлен в корзину')
                    } else {
                      const activeSupplierProduct = cart[0] as any
                      const activeSupplierName = activeSupplierProduct?.supplier_name ||
                                                activeSupplierProduct?.supplier_company_name ||
                                                'текущего поставщика'

                      const confirmSwitch = window.confirm(
                        `В корзине уже есть товары от поставщика "${activeSupplierName}".\n\n` +
                        `Хотите очистить корзину и добавить товары от поставщика "${product.supplier_name || product.supplier_company_name}"?`
                      )

                      if (confirmSwitch) {
                        clearCart()
                        addToCart(product)
                        logger.info('✅ Корзина очищена и добавлен новый товар')
                      }
                    }
                  }}
                  isProductInCart={(productId: string) => cart.some(item => item.id === productId)}
                />
              </>
            )}
          </>
        ) : (
          <>
            {/* Режим поставщиков */}
            {/* Ошибки */}
            {(userError || verifiedError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">
                  ❌ {userError || verifiedError}
                </p>
              </div>
            )}

            {/* Сетка поставщиков */}
            <SupplierGrid
              suppliers={displayedSuppliers}
              loading={loadingSuppliers}
              onSupplierClick={handleSupplierClick}
              onStartProject={handleStartProject}
              onEditSupplier={(supplier) => {
                setEditingSupplier(supplier)
                setShowAddSupplierModal(true)
              }}
              onDeleteSupplier={async () => {
                // Удаление будет обработано внутри SupplierCard
                await refreshSuppliers()
              }}
              showActions={true}
              roomType={selectedRoom}
              title={`Поставщики (${displayedSuppliers.length})`}
              emptyMessage="В этой комнате пока нет поставщиков"
              showSearch={true}
              showFilters={true}
            />
          </>
        )}

        {/* Модальное окно поставщика */}
        <SupplierModal
          isOpen={supplierModal.isOpen}
          supplier={supplierModal.selectedSupplier}
          products={supplierModal.products}
          loading={supplierModal.loading}
          onClose={supplierModal.close}
          onStartProject={handleStartProject}
          onAddToCart={addToCart}
          onProductClick={(product: Product) => {
            setSelectedProduct(product)
          }}
        />

        {/* Модальное окно корзины */}
        {showCartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Корзина ({getTotalItems()} товаров)</h2>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Корзина пуста</p>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 mb-4 p-4 border rounded-lg">
                        {(item as any).images && (item as any).images[0] && (
                          <img
                            src={(item as any).images[0]}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-500">
                            {item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="px-3">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-500 hover:text-red-600"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="mt-6 pt-6 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Итого:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {getTotalAmount().toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            clearCart()
                            setShowCartModal(false)
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Очистить корзину
                        </button>
                        <button
                          onClick={() => {
                            router.push('/dashboard/project-constructor')
                            setShowCartModal(false)
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Оформить заказ
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления/редактирования поставщика */}
        {showAddSupplierModal && (
          <AddSupplierModal
            isOpen={showAddSupplierModal}
            onClose={() => {
              setShowAddSupplierModal(false)
              setEditingSupplier(null)
            }}
            onSuccess={() => refreshSuppliers()}
            editingSupplier={editingSupplier}
          />
        )}
      </div>
    </div>
  )
}