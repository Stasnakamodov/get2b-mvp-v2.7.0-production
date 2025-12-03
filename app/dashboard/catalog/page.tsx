'use client'

/**
 * Страница каталога с использованием FSD архитектуры
 * Поддерживает режимы: поставщики и категории
 */

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, ArrowLeft, Package, Grid3X3, Users, ShoppingCart } from 'lucide-react'
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
import type { CatalogCategory } from '@/src/entities/category'

import {
  ROOM_TYPES,
  CATALOG_MODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '@/src/shared/config'

import { logger } from '@/src/shared/lib'

// Динамические импорты для оптимизации
const CategoryView = dynamic(
  () => import('@/src/widgets/catalog-suppliers/ui/CategoryView').then(m => ({ default: m.CategoryView })),
  { loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div> }
)

const SubcategorySelector = dynamic(
  () => import('@/src/widgets/catalog-suppliers/ui/CategoryView').then(m => ({ default: m.SubcategorySelector })),
  { ssr: false }
)

// Импорт существующих компонентов для категорий
const ProductGridByCategory = dynamic(
  () => import('@/components/catalog/ProductGridByCategory'),
  { loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div> }
)

export default function CatalogPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Основные состояния страницы
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('orange')
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('categories') // По умолчанию категории
  const [showCartModal, setShowCartModal] = useState(false)
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [token, setToken] = useState<string>('')

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
    clearCart,
    getTotalItems,
    getTotalAmount
  } = useCart()

  // Функция для начала проекта
  const handleStartProject = (supplier: Supplier) => {
    logger.info('🚀 Начинаем проект с поставщиком:', supplier.name)
    const params = new URLSearchParams({
      supplierId: supplier.id,
      supplierName: supplier.name || '',
      mode: 'catalog'
    })
    router.push(`/dashboard/create-project?${params.toString()}`)
  }

  // Хук модального окна поставщика
  const supplierModal = useSupplierModal({
    onStartProject: handleStartProject,
    selectedRoom
  })

  // Инициализация
  useEffect(() => {
    logger.info('🚀 Страница каталога (FSD) инициализирована')

    // Получаем токен для API
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setToken(session.access_token)
      }
    }
    getToken()

    // Проверяем URL параметры
    const params = new URLSearchParams(window.location.search)
    const categoryParam = params.get('category')
    const modeParam = params.get('mode')

    if (categoryParam) {
      setCatalogMode('categories')
    }
    if (modeParam === 'suppliers' || modeParam === 'categories') {
      setCatalogMode(modeParam as CatalogMode)
    }
  }, [])

  // Обработчик клика по поставщику
  const handleSupplierClick = (supplier: Supplier) => {
    logger.debug('Выбран поставщик:', supplier.name)
    supplierModal.open(supplier)
  }

  // Обработчики категорий
  const handleCategoryClick = (category: CatalogCategory) => {
    logger.debug('Выбрана категория:', category.name)
    selectCategory(category)
    selectSubcategory(null) // Сбрасываем подкатегорию
  }

  const handleSubcategoryClick = (category: CatalogCategory, subcategory: CatalogCategory) => {
    logger.debug('Выбрана подкатегория:', subcategory.name)
    selectCategory(category)
    selectSubcategory(subcategory)
  }

  const handleRefresh = () => {
    logger.debug('🔄 Обновление данных каталога')
    if (catalogMode === 'suppliers') {
      refreshSuppliers()
    } else {
      loadCategories()
    }
  }

  // Определение отображаемых поставщиков
  const displayedSuppliers = selectedRoom === 'orange'
    ? verifiedSuppliers
    : userSuppliers

  const roomConfig = selectedRoom === 'orange'
    ? ROOM_TYPES.ORANGE
    : ROOM_TYPES.BLUE

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Заголовок страницы */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              📦 Каталог {catalogMode === 'suppliers' ? 'поставщиков' : 'товаров'}
            </h1>

            {/* Корзина */}
            {getTotalItems() > 0 && (
              <button
                onClick={() => setShowCartModal(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Корзина</span>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </button>
            )}
          </div>

          {/* Переключатель режимов */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {/* Режимы каталога */}
              <button
                onClick={() => setCatalogMode('categories')}
                className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  catalogMode === 'categories'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Категории
              </button>

              <button
                onClick={() => setCatalogMode('suppliers')}
                className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  catalogMode === 'suppliers'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Поставщики
              </button>

              {/* Разделитель */}
              {catalogMode === 'suppliers' && (
                <>
                  <div className="w-px bg-gray-300 mx-2"></div>

                  {/* Переключатель комнат (только для поставщиков) */}
                  <button
                    onClick={() => setSelectedRoom('orange')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRoom === 'orange'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ROOM_TYPES.ORANGE.icon} Аккредитованные
                  </button>

                  <button
                    onClick={() => setSelectedRoom('blue')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRoom === 'blue'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ROOM_TYPES.BLUE.icon} Мои поставщики
                  </button>
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить поставщика
                </button>
              )}

              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Контент в зависимости от режима */}
        {catalogMode === 'categories' ? (
          <>
            {/* Режим категорий */}
            {!selectedCategory ? (
              <CategoryView
                categories={categories}
                loading={loadingCategories}
                error={categoriesError}
                onCategoryClick={handleCategoryClick}
                onSubcategoryClick={handleSubcategoryClick}
              />
            ) : (
              <div>
                {/* Навигация */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        selectCategory(null)
                        selectSubcategory(null)
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Все категории
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium">{selectedCategory.name}</span>
                    {selectedSubcategory && (
                      <>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium">{selectedSubcategory.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Подкатегории */}
                {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && !selectedSubcategory && (
                  <SubcategorySelector
                    subcategories={selectedCategory.subcategories}
                    selectedSubcategory={selectedSubcategory}
                    onSelect={(subcat) => selectSubcategory(subcat)}
                    onClose={() => selectCategory(null)}
                  />
                )}

                {/* Товары категории */}
                <ProductGridByCategory
                  selectedCategory={(selectedSubcategory || selectedCategory)?.name || ''}
                  token={token}
                  cart={cart.map(item => ({
                    ...item,
                    description: item.description || undefined,
                    total_price: parseFloat(String(item.price || 0).replace(/[^0-9.-]+/g, '')) * item.quantity,
                    supplier_name: (item as any).supplier_name || '',
                    room_type: (item as any).room_type || 'user',
                    room_icon: (item as any).room_icon || '',
                    room_description: (item as any).room_description || ''
                  })) as any}
                  selectedRoom={selectedRoom}
                  activeSupplier={activeSupplier}
                  onAddToCart={(product: any) => {
                    if (addToCart(product)) {
                      logger.info('Товар добавлен в корзину')
                    } else {
                      alert('Нельзя добавить товар другого поставщика. Сначала очистите корзину.')
                    }
                  }}
                  isProductInCart={(productId: string) => cart.some(item => item.id === productId)}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Режим поставщиков */}
            <div className={`rounded-lg p-4 mb-6 ${roomConfig.bgColor} ${roomConfig.borderColor} border`}>
              <p className={`${roomConfig.color} font-medium`}>
                {roomConfig.description}
              </p>
            </div>

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
        />

        {/* Модальное окно корзины */}
        {showCartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Корзина ({getTotalItems()} товаров)
                  </h2>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {cart.length > 0 ? (
                  <div className="space-y-4">
                    {cart.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product_name || item.name}</h4>
                          <p className="text-sm text-gray-600">
                            Количество: {item.quantity} × {item.price}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}

                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Итого:</span>
                        <span>${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Корзина пуста
                  </div>
                )}
              </div>

              <div className="p-6 border-t flex justify-between">
                <button
                  onClick={() => {
                    clearCart()
                    setShowCartModal(false)
                  }}
                  className="px-6 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Очистить
                </button>

                <button
                  onClick={() => {
                    // Создание проекта из корзины
                    const params = new URLSearchParams({
                      mode: 'cart',
                      supplierId: activeSupplier || ''
                    })
                    router.push(`/dashboard/create-project?${params.toString()}`)
                  }}
                  disabled={cart.length === 0}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Оформить заказ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления/редактирования поставщика */}
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => {
            setShowAddSupplierModal(false)
            setEditingSupplier(null)
          }}
          onSuccess={(supplier) => {
            refreshSuppliers()
            logger.info('Поставщик успешно сохранен:', supplier.name)
          }}
          editingSupplier={editingSupplier}
        />
      </div>
    </div>
  )
}