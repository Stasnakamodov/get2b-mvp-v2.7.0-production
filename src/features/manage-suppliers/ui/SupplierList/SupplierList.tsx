/**
 * Компонент списка поставщиков с управлением
 * Features layer
 */

import React from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { SupplierCard, type Supplier } from '@/src/entities/supplier'
import { Button } from '@/src/shared/ui/Button/Button'

interface SupplierListProps {
  suppliers: Supplier[]
  loading?: boolean
  error?: string | null
  selectedSupplier?: Supplier | null
  onSelectSupplier?: (supplier: Supplier) => void
  onCreateSupplier?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function SupplierList({
  suppliers,
  loading = false,
  error = null,
  selectedSupplier,
  onSelectSupplier,
  onCreateSupplier,
  searchQuery = '',
  onSearchChange,
}: SupplierListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Ошибка загрузки поставщиков: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Поиск поставщиков..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          variant="outline"
          icon={<Filter className="w-4 h-4" />}
        >
          Фильтры
        </Button>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={onCreateSupplier}
        >
          Добавить поставщика
        </Button>
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет поставщиков</h3>
          <p className="text-gray-600 mb-4">Добавьте первого поставщика для начала работы</p>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onCreateSupplier}
          >
            Добавить поставщика
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              selected={selectedSupplier?.id === supplier.id}
              onClick={() => onSelectSupplier?.(supplier)}
            />
          ))}
        </div>
      )}
    </div>
  )
}