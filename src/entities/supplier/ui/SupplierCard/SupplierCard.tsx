/**
 * Компонент карточки поставщика
 * Entities layer
 */

import React from 'react'
import { Building, MapPin, Globe, Star, Package } from 'lucide-react'
import type { Supplier } from '../../model/types'

interface SupplierCardProps {
  supplier: Supplier
  onClick?: () => void
  selected?: boolean
  compact?: boolean
}

export function SupplierCard({ supplier, onClick, selected = false, compact = false }: SupplierCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`
          p-3 rounded-lg border-2 cursor-pointer transition-all
          ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-gray-400" />
            <div>
              <h4 className="font-medium text-sm">{supplier.name}</h4>
              <p className="text-xs text-gray-500">{supplier.city}, {supplier.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <Package className="w-3 h-3" />
              {supplier.total_products ?? 0}
            </span>
            <span className="flex items-center gap-1 text-xs text-yellow-600">
              <Star className="w-3 h-3 fill-current" />
              {(supplier.rating ?? 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all
        ${selected ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{supplier.name}</h3>
            <p className="text-sm text-gray-600">{supplier.company_name}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[supplier.status || 'active']}`}>
          {supplier.status === 'active' ? 'Активен' :
           supplier.status === 'pending' ? 'На проверке' : 'Неактивен'}
        </span>
      </div>

      {/* Description */}
      {supplier.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {supplier.description}
        </p>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {supplier.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{supplier.city}, {supplier.country}</span>
          </div>
        )}
        {supplier.website && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <span className="truncate">{supplier.website.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{supplier.total_products}</span>
            <span className="text-xs text-gray-500">товаров</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{(supplier.rating ?? 0).toFixed(1)}</span>
          </div>
        </div>
        {supplier.min_order && (
          <div className="text-sm text-gray-600">
            Мин. заказ: {supplier.min_order}
          </div>
        )}
      </div>
    </div>
  )
}