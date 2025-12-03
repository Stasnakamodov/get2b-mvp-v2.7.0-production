'use client'

/**
 * Тестовая страница каталога с использованием FSD архитектуры
 * Доступна по адресу /dashboard/catalog-new
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, ArrowLeft } from 'lucide-react'

// FSD импорты
import {
  useSuppliers,
  useCategories,
  useProducts
} from '@/src/features/supplier-management'

import {
  SupplierGrid,
  SupplierCard,
  ProductCard
} from '@/src/widgets/catalog-suppliers'

import type {
  Supplier,
  RoomType,
  CatalogMode
} from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'

import {
  ROOM_TYPES,
  CATALOG_MODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '@/src/shared/config'

import { logger } from '@/src/shared/lib'

export default function CatalogPageNew() {
  const router = useRouter()

  // Состояния страницы
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('orange')
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('suppliers')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showSupplierModal, setShowSupplierModal] = useState(false)

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
    loading: loadingCategories,
    selectCategory
  } = useCategories()

  const {
    products,
    loading: loadingProducts,
    loadProducts
  } = useProducts()

  // Инициализация
  useEffect(() => {
    logger.info('🚀 Страница каталога (FSD) инициализирована')
  }, [])

  // Загрузка товаров при выборе поставщика
  useEffect(() => {
    if (selectedSupplier && showSupplierModal) {
      const supplierType = selectedSupplier.room_type ||
                          (selectedRoom === 'orange' ? 'verified' : 'user')
      loadProducts(selectedSupplier.id, supplierType)
    }
  }, [selectedSupplier, showSupplierModal, selectedRoom, loadProducts])

  // Обработчики
  const handleSupplierClick = (supplier: Supplier) => {
    logger.debug('Выбран поставщик:', supplier.name)
    setSelectedSupplier(supplier)
    setShowSupplierModal(true)
  }

  const handleStartProject = (supplier: Supplier) => {
    logger.info('🚀 Начинаем проект с поставщиком:', supplier.name)
    const params = new URLSearchParams({
      supplierId: supplier.id,
      supplierName: supplier.name || '',
      mode: 'catalog'
    })
    router.push(`/dashboard/create-project?${params.toString()}`)
  }

  const handleRefresh = () => {
    logger.debug('🔄 Обновление данных каталога')
    refreshSuppliers()
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
          {/* Навигация */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/dashboard/catalog')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              К старому каталогу
            </button>
            <span className="text-sm text-green-600 font-medium">
              ✅ FSD версия
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-4">
            📦 Каталог поставщиков (новая архитектура)
          </h1>

          {/* Переключатель комнат */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRoom('orange')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  selectedRoom === 'orange'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {ROOM_TYPES.ORANGE.icon} {ROOM_TYPES.ORANGE.name}
              </button>

              <button
                onClick={() => setSelectedRoom('blue')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  selectedRoom === 'blue'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {ROOM_TYPES.BLUE.icon} {ROOM_TYPES.BLUE.name}
              </button>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
          </div>
        </div>

        {/* Описание комнаты */}
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
          showActions={true}
          roomType={selectedRoom}
          title={`Поставщики (${displayedSuppliers.length})`}
          emptyMessage="В этой комнате пока нет поставщиков"
          showSearch={true}
          showFilters={true}
        />

        {/* Модальное окно поставщика */}
        {showSupplierModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {selectedSupplier.name}
                  </h2>
                  <button
                    onClick={() => {
                      setShowSupplierModal(false)
                      setSelectedSupplier(null)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Информация о поставщике */}
                <div className="mb-6">
                  <SupplierCard
                    supplier={selectedSupplier}
                    onStartProject={handleStartProject}
                    showActions={true}
                  />
                </div>

                {/* Товары поставщика */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Товары поставщика ({products.length})
                  </h3>

                  {loadingProducts ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          supplierName={selectedSupplier.name}
                          isCompact={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      У этого поставщика пока нет товаров
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t flex justify-between">
                <button
                  onClick={() => {
                    setShowSupplierModal(false)
                    setSelectedSupplier(null)
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Закрыть
                </button>

                <button
                  onClick={() => handleStartProject(selectedSupplier)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Начать проект
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}