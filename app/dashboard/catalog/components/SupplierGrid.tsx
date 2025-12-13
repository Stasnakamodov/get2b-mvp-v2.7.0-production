'use client'

import React from 'react'
import { SupplierCard } from './SupplierCard'

interface Supplier {
  id: string
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  source_type?: string
  total_projects?: number
  last_project_date?: string
  rating?: number
  is_featured?: boolean
  verification_level?: string
  public_rating?: number
  projects_count?: number
  catalog_user_products?: any[]
  catalog_verified_products?: any[]
}

interface SearchStats {
  total: number
  filtered: number
  hasActiveFilters: boolean
}

interface SupplierGridProps {
  suppliers: Supplier[]
  mode: 'clients' | 'catalog'
  loading: boolean
  searchQuery: string
  selectedCategory: string
  searchStats?: SearchStats
  onViewDetails: (supplier: Supplier) => void
  onStartProject: (supplier: Supplier) => void
  onAddSupplier: () => void
  onImportFromProjects?: () => void
  onImportToMyList?: (supplier: Supplier) => void
}

export const SupplierGrid = React.memo(function SupplierGrid({
  suppliers,
  mode,
  loading,
  searchQuery,
  selectedCategory,
  searchStats,
  onViewDetails,
  onStartProject,
  onAddSupplier,
  onImportFromProjects,
  onImportToMyList
}: SupplierGridProps) {

  // Используем готовых отфильтрованных поставщиков
  const filteredSuppliers = suppliers

  // Первоначальная загрузка (показываем лоадер только при отсутствии данных)
  if (loading && suppliers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg text-gray-600">
            {mode === 'clients' ? 'Загрузка ваших поставщиков...' : 'Загрузка каталога Get2B...'}
          </div>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // Пустое состояние
  if (filteredSuppliers.length === 0) {
    return (
      <div className="text-center py-12">
        {suppliers.length === 0 ? (
          // Нет поставщиков вообще
          <div>
            <div className="text-lg text-gray-600">
              {mode === 'clients' 
                ? 'У вас пока нет поставщиков'
                : 'Каталог Get2B временно недоступен'
              }
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {mode === 'clients' 
                ? 'Добавьте нового поставщика или импортируйте из завершенных проектов'
                : 'Попробуйте обновить страницу позже'
              }
            </div>
            <div className="flex gap-4 justify-center mt-6">
              <button 
                onClick={onAddSupplier}
                className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-colors"
              >
                Добавить поставщика
              </button>
              {mode === 'clients' && onImportFromProjects && (
                <button 
                  onClick={onImportFromProjects}
                  className="border-2 border-purple-600 text-purple-600 px-6 py-2 hover:bg-purple-600 hover:text-white transition-colors"
                >
                  🔮 Импорт из проектов
                </button>
              )}
            </div>
          </div>
        ) : (
          // Есть поставщики, но не найдено по фильтрам
          <div>
            <div className="text-lg text-gray-600">
              Поставщики не найдены
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Попробуйте изменить критерии поиска или выбрать другую категорию
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Поиск: "{searchQuery}" | Категория: {selectedCategory === 'all' ? 'Все' : selectedCategory}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Отображение сетки поставщиков
  return (
    <div className="space-y-6">
      {/* Счетчик результатов */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {searchStats?.hasActiveFilters ? (
            <>
              Найдено <span className="font-medium text-black">{searchStats.filtered}</span> из {searchStats.total} поставщиков
              {searchQuery && (
                <span className="ml-2">
                  по запросу "<span className="font-medium">{searchQuery}</span>"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="ml-2">
                  в категории "<span className="font-medium">{selectedCategory}</span>"
                </span>
              )}
            </>
          ) : (
            <>
              Показано <span className="font-medium text-black">{filteredSuppliers.length}</span> поставщиков
            </>
          )}
        </div>
      </div>

      {/* Сетка карточек поставщиков - БЕЗ анимаций */}
      <div className="space-y-6">
        {filteredSuppliers.map((supplier) => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            mode={mode}
            onViewDetails={onViewDetails}
            onStartProject={onStartProject}
            onImportToMyList={onImportToMyList}
          />
        ))}
      </div>

      {/* Статистика внизу */}
      <div className="border-t-2 border-gray-100 pt-6 mt-8">
        <div className="text-center text-sm text-gray-500">
          {mode === 'clients' ? (
            <div>
              Ваша личная база поставщиков |
              <span className="ml-2">
                {suppliers.filter(s => s.source_type === 'extracted_from_7steps').length} из проектов,
                {suppliers.filter(s => s.source_type === 'user_added').length} добавлено вручную
              </span>
            </div>
          ) : (
            <div>
              Каталог Get2B |
              <span className="ml-2">
                {suppliers.filter(s => s.is_featured).length} рекомендуемых,
                {suppliers.filter(s => s.verification_level === 'gold').length} золотых партнеров
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}) 