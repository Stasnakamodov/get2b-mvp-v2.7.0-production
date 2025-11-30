/**
 * Компонент сетки поставщиков
 * Часть FSD архитектуры - widgets/catalog-suppliers
 */

import React, { useState, useMemo } from 'react'
import { Grid3X3, List, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { SupplierCard } from './SupplierCard'
import type { Supplier, RoomType, ViewMode } from '@/src/entities/supplier'
import { SUPPLIERS_PER_PAGE } from '@/src/shared/config'

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

type ViewMode = 'grid' | 'list'

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск поставщиков..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          )}

          {/* Фильтр по категориям */}
          {showFilters && categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все категории</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Переключатель вида */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              title="Сетка"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              title="Список"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Номера страниц */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Показываем только несколько страниц вокруг текущей
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return <span key={page} className="px-1">...</span>
              }
              return null
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}