'use client'

import React from 'react'
import { Search, Plus } from 'lucide-react'

interface Category {
  value: string
  label: string
}

interface SortOption {
  value: string
  label: string
}

interface CatalogHeaderProps {
  activeMode: 'clients' | 'catalog'
  setActiveMode: (mode: 'clients' | 'catalog') => void
  realSuppliersCount: number
  verifiedSuppliersCount: number
  filteredSuppliersCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  categories: Category[]
  sortOptions?: SortOption[]
  currentSort?: string
  setCurrentSort?: (sort: string) => void
  isSearching?: boolean
  onAddSupplier: () => void
  onImportFromProjects?: () => void
  onLoadRecommendations?: () => void
  supabaseConnected: boolean
  supabaseError: string | null
}

export const CatalogHeader = React.memo(function CatalogHeader({
  activeMode,
  setActiveMode,
  realSuppliersCount,
  verifiedSuppliersCount,
  filteredSuppliersCount,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  sortOptions = [],
  currentSort = 'default',
  setCurrentSort,
  isSearching = false,
  onAddSupplier,
  onImportFromProjects,
  onLoadRecommendations,
  supabaseConnected,
  supabaseError
}: CatalogHeaderProps) {

  const handleModeSwitch = (mode: 'clients' | 'catalog') => {
    setActiveMode(mode)
    
    // Загружаем рекомендации при переключении в каталог
    if (mode === 'catalog' && onLoadRecommendations) {
      onLoadRecommendations()
    }
  }

  return (
    <div>
      {/* Уведомление об ошибке Supabase */}
      {!supabaseConnected && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <p className="text-red-800 font-medium">Проблемы с подключением к базе данных</p>
                <p className="text-red-600 text-sm">{supabaseError || 'Работаем в автономном режиме'}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                // Используем router.refresh() вместо reload
                window.location.reload();
              }} 
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Обновить
            </button>
          </div>
        </div>
      )}

      {/* Header с черными линиями */}
      <div className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-black tracking-wide">Каталог Get2B</h1>
              <div className="w-24 h-0.5 bg-black mt-2"></div>
              <p className="text-gray-600 mt-3 font-light">Управление поставщиками нового поколения</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-light text-black">{filteredSuppliersCount}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">АКТИВНЫХ</div>
              </div>
              <div className="w-px h-12 bg-black"></div>
              
              {/* Кнопка добавления */}
              <button 
                onClick={onAddSupplier}
                className="border-2 border-black text-black px-6 py-2 hover:bg-black hover:text-white transition-all duration-300 uppercase tracking-wider text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                ДОБАВИТЬ
              </button>
              
              {/* Кнопка импорта из проектов (только для режима клиентов) */}
              {activeMode === 'clients' && onImportFromProjects && (
                <button 
                  onClick={onImportFromProjects}
                  className="border-2 border-purple-600 text-purple-600 px-6 py-2 hover:bg-purple-600 hover:text-white transition-all duration-300 uppercase tracking-wider text-sm font-medium flex items-center gap-2"
                >
                  🔮 ИМПОРТ ИЗ ПРОЕКТОВ
                </button>
              )}
            </div>
          </div>

          {/* Режимы переключения */}
          <div className="flex items-center justify-between">
            <div className="flex border-2 border-black">
              <button
                onClick={() => handleModeSwitch('clients')}
                className={`px-8 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                  activeMode === 'clients'
                    ? 'bg-blue-600 text-white border-r-2 border-blue-600'
                    : 'bg-card text-foreground border-r-2 border-border hover:bg-muted'
                }`}
              >
                Ваши поставщики ({realSuppliersCount})
              </button>
              <button
                onClick={() => handleModeSwitch('catalog')}
                className={`px-8 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                  activeMode === 'catalog'
                    ? 'bg-orange-500 text-white'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                🧠 Каталог Get2B ({verifiedSuppliersCount})
              </button>
            </div>

            {/* Поиск и фильтры */}
            <div className="flex items-center gap-4">
              {/* Поиск с индикатором */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Поиск поставщиков..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-12 pr-4 py-3 border-2 focus:outline-none w-80 font-light tracking-wide transition-colors ${
                    isSearching 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-black focus:border-gray-400'
                  }`}
                />
                {searchQuery && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-black text-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              {/* Фильтр по категории */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border-2 border-black px-4 py-3 focus:outline-none focus:border-gray-400 font-medium uppercase tracking-wider text-sm"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {/* Сортировка */}
              {sortOptions.length > 0 && setCurrentSort && (
                <select
                  value={currentSort}
                  onChange={(e) => setCurrentSort(e.target.value)}
                  className="border-2 border-gray-400 px-4 py-3 focus:outline-none focus:border-black font-medium text-sm bg-gray-50"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}) 