/**
 * Premium Supplier Card Component
 * Design Philosophy: Clean typography, White space, Minimal decoration
 */

import React from 'react'
import { Star, MapPin, CheckCircle } from 'lucide-react'
import type { Supplier } from '@/src/entities/supplier'

interface SupplierCardProps {
  supplier: Supplier
  onClick?: (supplier: Supplier) => void
  onStartProject?: (supplier: Supplier) => void
  onEdit?: (supplier: Supplier) => void
  onDelete?: (supplier: Supplier) => void
  showActions?: boolean
  isCompact?: boolean
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  onClick,
  onStartProject,
  onEdit,
  onDelete,
  showActions = false,
  isCompact = false
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(supplier)
    }
  }

  const handleStartProject = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStartProject) {
      onStartProject(supplier)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(supplier)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm('Вы уверены, что хотите удалить этого поставщика?')) {
      onDelete(supplier)
    }
  }

  if (isCompact) {
    return (
      <div
        className="h-full flex flex-col p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200"
        onClick={handleCardClick}
      >
        <div className="flex-1 flex flex-col items-center text-center">
          {/* Logo centered */}
          {supplier.logo_url ? (
            <img
              src={supplier.logo_url}
              alt={supplier.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm mb-4"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                {supplier.name?.charAt(0)}
              </span>
            </div>
          )}

          {/* Name — larger */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {supplier.name}
          </h3>

          {/* Subtitle: category · city · ★ rating */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            {[
              supplier.category,
              supplier.city || supplier.country,
              supplier.rating != null && supplier.rating > 0 ? `★ ${supplier.rating.toFixed(1)}` : null,
            ].filter(Boolean).join('  ·  ')}
          </p>

          {/* Badge: N товаров */}
          {supplier.total_products != null && supplier.total_products > 0 && (
            <span className="inline-block mt-3 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-lg">
              {supplier.total_products} товаров
            </span>
          )}
        </div>

        {/* CTA Button — always at bottom */}
        <button
          onClick={handleCardClick}
          className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
        >
          Посмотреть товары
        </button>
      </div>
    )
  }

  return (
    <div
      className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md cursor-pointer transition-shadow duration-200"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{supplier.name}</h3>
          {supplier.company_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.company_name}</p>
          )}
        </div>

        {supplier.logo_url && (
          <img
            src={supplier.logo_url}
            alt={supplier.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
      </div>

      {/* Badges - minimal */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md">
          {supplier.category}
        </span>

        {supplier.room_type === 'verified' && (
          <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 rounded-md flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Аккредитован
          </span>
        )}

        {supplier.total_products != null && supplier.total_products > 0 && (
          <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 rounded-md">
            {supplier.total_products} товаров
          </span>
        )}
      </div>

      {/* Rating and stats - clean layout */}
      {((supplier.rating != null && supplier.rating > 0) || (supplier.reviews != null && supplier.reviews > 0) || (supplier.projects != null && supplier.projects > 0)) && (
        <div className="flex items-center gap-3 mb-3 text-sm">
          {supplier.rating != null && supplier.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" fill="currentColor" />
              <span className="font-medium text-gray-900 dark:text-gray-100">{supplier.rating.toFixed(1)}</span>
            </div>
          )}

          {supplier.reviews != null && supplier.reviews > 0 && (
            <span className="text-gray-500 dark:text-gray-400 text-xs">{supplier.reviews} отзывов</span>
          )}

          {supplier.projects != null && supplier.projects > 0 && (
            <span className="text-gray-500 dark:text-gray-400 text-xs">{supplier.projects} проектов</span>
          )}
        </div>
      )}

      {/* Description */}
      {supplier.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {supplier.description}
        </p>
      )}

      {/* Location info - minimal */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <MapPin className="w-3 h-3" />
        <span>{supplier.country}{supplier.city ? `, ${supplier.city}` : ''}</span>
      </div>

      {/* Contact info - only if expanded */}
      {supplier.contact_phone && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {supplier.contact_phone}
        </div>
      )}

      {/* Actions - clean buttons */}
      {showActions && (
        <div className="flex gap-2 pt-3">
          <button
            onClick={handleCardClick}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
          >
            Посмотреть товары
          </button>

          {supplier.room_type === 'user' && (
            <>
              <button
                onClick={handleEdit}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Изменить
              </button>

              <button
                onClick={handleDelete}
                className="px-3 py-2 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                Удалить
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}