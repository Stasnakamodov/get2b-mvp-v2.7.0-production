'use client'

import { logger } from "@/src/shared/lib/logger"
import React from 'react'
import { MapPin, Phone, Mail, Globe, Package } from 'lucide-react'
interface Product {
  id: string
  name: string
  price: number
  currency: string
  in_stock: boolean
  min_order: string
}

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
  catalog_user_products?: Product[]
  catalog_verified_products?: Product[]
  accreditation_status?: 'none' | 'pending' | 'approved' | 'rejected'
  accreditation_application_id?: string
  is_verified?: boolean
}

interface SupplierCardProps {
  supplier: Supplier
  mode: 'clients' | 'catalog'
  onViewDetails: (supplier: Supplier) => void
  onStartProject: (supplier: Supplier) => void
  onRequestAccreditation?: (supplier: Supplier) => void
  onImportToMyList?: (supplier: Supplier) => void
}

export const SupplierCard = React.memo(function SupplierCard({ 
  supplier, 
  mode, 
  onViewDetails, 
  onStartProject,
  onImportToMyList
}: SupplierCardProps) {
  // Определяем тип продуктов в зависимости от режима
  const products = mode === 'clients' 
    ? supplier.catalog_user_products || []
    : supplier.catalog_verified_products || []

  // Безопасное получение имени поставщика
  const supplierName = supplier.name && supplier.name !== 'Название поставщика' 
    ? supplier.name 
    : supplier.company_name && supplier.company_name !== 'Название компании'
    ? supplier.company_name
    : 'Поставщик без названия'

  // Цветовая схема в зависимости от режима
  const colorScheme = mode === 'clients' 
    ? {
        border: 'border-blue-200',
        accent: 'bg-blue-600',
        accentHover: 'hover:bg-blue-700',
        accentText: 'text-blue-600',
        tag: 'bg-blue-600 text-white'
      }
    : {
        border: 'border-orange-200', 
        accent: 'bg-orange-500',
        accentHover: 'hover:bg-orange-600',
        accentText: 'text-orange-600',
        tag: 'bg-orange-500 text-white'
      }

  return (
    <div
      className={`border-2 ${colorScheme.border} bg-card p-8 hover:shadow-lg transition-shadow group relative`}
    >
      {/* Логотип */}
      <div className="flex items-start gap-6 mb-6">
        <div className="w-20 h-20 border-2 border-border flex items-center justify-center bg-muted flex-shrink-0">
          {(() => {
            if (supplier.logo_url) {
              return (
                <img 
                  src={supplier.logo_url} 
                  alt={supplierName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    logger.error(`❌ ОШИБКА ЗАГРУЗКИ ${supplierName}:`, supplier.logo_url);
                  }}
                />
              );
            } else {
              return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600 text-white font-bold text-sm">
                  {supplierName.charAt(0).toUpperCase()}
                </div>
              );
            }
          })()}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-2xl font-light text-foreground tracking-wide">
              {supplierName}
            </h3>
            <div className="w-px h-6 bg-black"></div>
            <span className={`${colorScheme.tag} px-3 py-1 text-xs uppercase tracking-wider font-medium`}>
              {supplier.category || 'Категория не указана'}
            </span>
            
            {/* Тэги источника (только для режима клиентов) */}
            {mode === 'clients' && supplier.source_type === 'extracted_from_7steps' && (
              <span className="bg-green-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                ИЗ ПРОЕКТОВ
              </span>
            )}
            {mode === 'clients' && supplier.source_type === 'user_added' && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 text-xs uppercase tracking-wider font-medium">
                ДОБАВЛЕН ВРУЧНУЮ
              </span>
            )}

            {/* Тэги для каталога Get2B */}
            {mode === 'catalog' && supplier.is_featured && (
              <span className="bg-yellow-500 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                ⭐ РЕКОМЕНДУЕТСЯ
              </span>
            )}
            {mode === 'catalog' && supplier.verification_level === 'gold' && (
              <span className="bg-yellow-600 text-white px-3 py-1 text-xs uppercase tracking-wider font-medium">
                🥇 ЗОЛОТОЙ
              </span>
            )}
          </div>
                   
          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">
              {supplier.city ? `${supplier.city}, ` : ''}{supplier.country || 'Страна не указана'}
            </span>
          </div>

          {/* Description */}
          {supplier.description && supplier.description !== 'Описание компании' && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
              {supplier.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {supplier.contact_email && supplier.contact_email !== 'example@email.com' && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 truncate">{supplier.contact_email}</span>
              </div>
            )}
            {supplier.contact_phone && supplier.contact_phone !== '+1234567890' && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{supplier.contact_phone}</span>
              </div>
            )}
            {supplier.website && supplier.website !== 'https://example.com' && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <a 
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm ${colorScheme.accentText} hover:underline truncate`}
                >
                  Сайт
                </a>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {mode === 'clients' ? (
              <>
                <div className="text-center">
                  <div className="text-2xl font-light text-foreground mb-1">
                    {supplier.total_projects || 0}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wider">ПРОЕКТОВ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-black mb-1">
                    {products.length}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wider">ТОВАРОВ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-foreground mb-1">
                    {supplier.rating ? `${supplier.rating.toFixed(1)}★` : '—'}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wider">РЕЙТИНГ</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-2xl font-light text-foreground mb-1">
                    {supplier.public_rating ? `${supplier.public_rating.toFixed(1)}★` : '—'}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wider">РЕЙТИНГ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-foreground mb-1">
                    {supplier.projects_count || 0}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wider">ПРОЕКТОВ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-foreground mb-1">
                    {products.length}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wider">ТОВАРОВ</div>
                </div>
              </>
            )}
          </div>

          {/* Recent Products Preview */}
          {products.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">Товары ({products.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {products.slice(0, 4).map((product: Product) => (
                  <div key={product.id} className="bg-muted p-2 border border-border">
                    <div className="text-xs font-medium text-foreground mb-1 line-clamp-1">
                      {product.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {product.price ? `${product.price} ${product.currency}` : 'Цена по запросу'}
                      </span>
                      <span className={`text-xs ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                        {product.in_stock ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {products.length > 4 && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  +{products.length - 4} еще товаров
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onViewDetails(supplier)}
              className="flex-1 border-2 border-border text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all duration-300 text-sm font-medium uppercase tracking-wider"
            >
              ПОДРОБНЕЕ
            </button>
            
            {mode === 'clients' ? (
              // Синяя комната - кнопка "НАЧАТЬ ПРОЕКТ"
              <button
                onClick={() => onStartProject(supplier)}
                className={`flex-1 ${colorScheme.accent} text-white px-4 py-2 ${colorScheme.accentHover} transition-all duration-300 text-sm font-medium uppercase tracking-wider`}
              >
                НАЧАТЬ ПРОЕКТ
              </button>
            ) : (
              // Оранжевая комната - кнопка "ДОБАВИТЬ В МОЙ СПИСОК"
              <button
                onClick={() => onImportToMyList && onImportToMyList(supplier)}
                disabled={!onImportToMyList}
                className={`flex-1 ${colorScheme.accent} text-white px-4 py-2 ${colorScheme.accentHover} transition-all duration-300 text-sm font-medium uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ДОБАВИТЬ В МОЙ СПИСОК
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}) 