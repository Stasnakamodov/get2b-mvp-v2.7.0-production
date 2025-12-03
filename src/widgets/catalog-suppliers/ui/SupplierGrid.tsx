/**
 * Компонент сетки поставщиков
 * Часть FSD архитектуры - widgets/catalog-suppliers
 */

import React, { useState, useMemo } from 'react'
import { SupplierCard } from './SupplierCard'
import type { Supplier, RoomType } from '@/src/entities/supplier'
import { SUPPLIERS_PER_PAGE } from '@/src/shared/config'
import {
  SearchBar,
  FilterSelect,
  ViewModeSwitcher,
  Pagination,
  type ViewMode
} from '@/src/shared/ui'

interface SupplierGridProps {
  suppliers: Supplier[]
  loading?: boolean
  error?: string | null
  onSupplierClick?: (supplier: Supplier) => void
  onStartProject?: (supplier: Supplier) => void
  onEditSupplier?: (supplier: Supplier) => void
  onDeleteSupplier?: (supplier: Supplier) => void
  showActions?: boolean
  title?: string
  emptyMessage?: string
  roomType?: RoomType
  viewMode?: ViewMode
  showSearch?: boolean
  showFilters?: boolean
  showPagination?: boolean
  itemsPerPage?: number
}

export const SupplierGrid: React.FC<SupplierGridProps> = ({
  suppliers,
  loading = false,
  error = null,
  onSupplierClick,
  onStartProject,
  onEditSupplier,
  onDeleteSupplier,
  showActions = false,
  title,
  emptyMessage = 'Поставщики не найдены',
  roomType,
  viewMode: initialViewMode = 'grid',
  showSearch = false,
  showFilters = false,
  showPagination = true,
  itemsPerPage = SUPPLIERS_PER_PAGE
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Получаем уникальные категории
  const categories = useMemo(() => {
    const cats = new Set(suppliers.map(s => s.category))
    return Array.from(cats).sort()
  }, [suppliers])

  // Фильтрация поставщиков
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers]

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(supplier => {
        const searchFields = [
          supplier.name,
          supplier.company_name,
          supplier.category,
          supplier.country,
          supplier.city,
          supplier.description
        ].filter(Boolean).join(' ').toLowerCase()

        return searchFields.includes(query)
      })
    }

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      result = result.filter(s => s.category === selectedCategory)
    }

    return result
  }, [suppliers, searchQuery, selectedCategory])

  // Пагинация
  const paginatedSuppliers = useMemo(() => {
    if (!showPagination) return filteredSuppliers

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    return filteredSuppliers.slice(startIndex, endIndex)
  }, [filteredSuppliers, currentPage, itemsPerPage, showPagination])

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage)

  // Обработчики
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Сброс страницы при изменении фильтров
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  // Цвета для комнаты
  const roomColors = roomType === 'orange'
    ? {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700'
      }
    : roomType === 'blue'
    ? {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700'
      }
    : {
        bg: 'bg-white',
        border: 'border-gray-200',
        text: 'text-gray-600',
        badge: 'bg-gray-100 text-gray-700'
      }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span>Загрузка поставщиков...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и элементы управления */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {title && (
          <h2 className="text-xl font-semibold">{title}</h2>
        )}

        <div className="flex items-center gap-3">
          {/* Поиск */}
          {showSearch && (
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Поиск поставщиков..."
            />
          )}

          {/* Фильтр по категориям */}
          {showFilters && categories.length > 0 && (
            <FilterSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map(cat => ({ value: cat, label: cat }))}
              placeholder="Все категории"
            />
          )}

          {/* Переключатель вида */}
          <ViewModeSwitcher
            mode={viewMode}
            onChange={setViewMode}
          />
        </div>
      </div>

      {/* Информация о результатах */}
      {(showSearch || showFilters) && (
        <div className="text-sm text-gray-600">
          Найдено: {filteredSuppliers.length} поставщиков
          {showPagination && totalPages > 1 && (
            <span> (страница {currentPage} из {totalPages})</span>
          )}
        </div>
      )}

      {/* Сетка/список поставщиков */}
      {paginatedSuppliers.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {paginatedSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onClick={onSupplierClick}
              onStartProject={onStartProject}
              onEdit={onEditSupplier}
              onDelete={onDeleteSupplier}
              showActions={showActions}
              isCompact={viewMode === 'grid'}
            />
          ))}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center h-64 ${roomColors.bg} rounded-lg border-2 border-dashed ${roomColors.border}`}>
          <p className="text-gray-500 mb-2">{emptyMessage}</p>
          {showSearch && searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Очистить поиск
            </button>
          )}
        </div>
      )}

      {/* Пагинация */}
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-6"
        />
      )}
    </div>
  )
}