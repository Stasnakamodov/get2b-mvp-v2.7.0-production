/**
 * Компонент карточки поставщика
 * Часть FSD архитектуры - widgets/catalog-suppliers
 */

import React from 'react'
import { Star, MapPin, Phone, Mail, Globe, Building, CheckCircle, Clock } from 'lucide-react'
import type { Supplier } from '@/src/entities/supplier'
import { formatDate } from '@/src/shared/config'

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

  // Определение цветов в зависимости от типа комнаты
  const roomColors = supplier.room_type === 'verified'
    ? {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700'
      }
    : {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700'
      }

  if (isCompact) {
    return (
      <div
        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${roomColors.bg} ${roomColors.border}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold truncate">{supplier.name}</h3>
          {supplier.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              <span className="text-sm font-medium">{supplier.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-2">{supplier.category}</p>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-3 h-3" />
          <span>{supplier.country}{supplier.city ? `, ${supplier.city}` : ''}</span>
        </div>

        {showActions && (
          <button
            onClick={handleStartProject}
            className={`w-full mt-3 px-3 py-1 ${roomColors.text} ${roomColors.badge} rounded text-sm font-medium hover:opacity-80 transition-opacity`}
          >
            Начать проект
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`p-6 border rounded-lg cursor-pointer transition-all hover:shadow-lg ${roomColors.bg} ${roomColors.border}`}
      onClick={handleCardClick}
    >
      {/* Заголовок */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{supplier.name}</h3>
          {supplier.company_name && (
            <p className="text-sm text-gray-600">{supplier.company_name}</p>
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

      {/* Бейджи */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 text-xs rounded-full ${roomColors.badge}`}>
          {supplier.category}
        </span>

        {supplier.room_type === 'verified' && (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Аккредитован
          </span>
        )}

        {supplier.source_type === 'echo_card' && (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
            🔮 Из проектов
          </span>
        )}
      </div>

      {/* Рейтинг и статистика */}
      {(supplier.rating || supplier.reviews || supplier.projects) && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          {supplier.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              <span className="font-medium">{supplier.rating.toFixed(1)}</span>
            </div>
          )}

          {supplier.reviews && (
            <span className="text-gray-600">{supplier.reviews} отзывов</span>
          )}

          {supplier.projects && (
            <span className="text-gray-600">{supplier.projects} проектов</span>
          )}
        </div>
      )}

      {/* Описание */}
      {supplier.description && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {supplier.description}
        </p>
      )}

      {/* Контактная информация */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{supplier.country}{supplier.city ? `, ${supplier.city}` : ''}</span>
        </div>

        {supplier.contact_phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{supplier.contact_phone}</span>
          </div>
        )}

        {supplier.contact_email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{supplier.contact_email}</span>
          </div>
        )}

        {supplier.website && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {supplier.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Бизнес информация */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
        {supplier.min_order && (
          <div className="flex items-center gap-1">
            <Building className="w-4 h-4" />
            <span>Мин. заказ: {supplier.min_order}</span>
          </div>
        )}

        {supplier.response_time && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{supplier.response_time}</span>
          </div>
        )}

        {supplier.established && (
          <div className="text-xs">
            Основан: {supplier.established}
          </div>
        )}
      </div>

      {/* Действия */}
      {showActions && (
        <div className="flex gap-2 border-t pt-4">
          <button
            onClick={handleStartProject}
            className={`flex-1 px-4 py-2 ${roomColors.text} ${roomColors.badge} rounded font-medium hover:opacity-80 transition-opacity`}
          >
            Начать проект
          </button>

          {supplier.room_type === 'user' && (
            <>
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                ✏️
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}