'use client'

import { logger } from "@/src/shared/lib/logger"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_CERTIFICATIONS } from '@/src/shared/config'
import { CatalogHeader } from './components/CatalogHeader'
import { SupplierGrid } from './components/SupplierGrid'
import { AddSupplierModal } from './components/AddSupplierModal'
import { useCatalogOptimization } from './hooks/useCatalogOptimization'
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

interface Category {
  value: string
  label: string
}

export default function CatalogPageRefactored() {
  const router = useRouter()
  
  // === СОСТОЯНИЕ SUPABASE ===
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true)

  // === СОСТОЯНИЕ КАТАЛОГА ===
  const [activeMode, setActiveMode] = useState<'clients' | 'catalog'>('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Простой callback для поиска - debounce уже в SearchInput
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // === ДАННЫЕ ПОСТАВЩИКОВ ===
  const [realSuppliers, setRealSuppliers] = useState<Supplier[]>([])
  const [verifiedSuppliers, setVerifiedSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingVerified, setLoadingVerified] = useState(false)

  // === МОДАЛЬНЫЕ ОКНА ===
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  
  // === КАТЕГОРИИ ===
  const [apiCategories, setApiCategories] = useState<any[]>([])

  // === РЕКОМЕНДАЦИИ ===
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null)

  // === ПРОВЕРКА ПОДКЛЮЧЕНИЯ К SUPABASE ===
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('[SUPABASE CONNECTION ERROR]', error)
          setSupabaseError(error.message)
          setSupabaseConnected(false)
        } else {
          setSupabaseConnected(true)
          setSupabaseError(null)
        }
      } catch (err) {
        logger.error('[SUPABASE IMPORT ERROR]', err)
        setSupabaseError('Ошибка загрузки Supabase клиента')
        setSupabaseConnected(false)
      }
    }

    checkSupabaseConnection()
  }, [])

  // === ЗАГРУЗКА ДАННЫХ ПРИ МОНТИРОВАНИИ ===
  useEffect(() => {
    loadSuppliersFromAPI()
    loadVerifiedSuppliersFromAPI()
    loadCategoriesFromAPI()
  }, [])

  // === МЕМОИЗИРОВАННЫЕ ФУНКЦИИ ЗАГРУЗКИ ===
  const loadSuppliersFromAPI = useCallback(async () => {
    setLoadingSuppliers(true)
    try {
      const response = await fetch('/api/catalog/user-suppliers')
      const data = await response.json()
      
      if (data.suppliers) {
        setRealSuppliers(data.suppliers)
      } else {
        logger.warn('⚠️ Нет пользовательских поставщиков в ответе API')
        setRealSuppliers([])
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки пользовательских поставщиков:', error)
      setRealSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }, [])

  const loadVerifiedSuppliersFromAPI = useCallback(async () => {
    setLoadingVerified(true)
    try {
      const response = await fetch('/api/catalog/verified-suppliers')
      const data = await response.json()
      
      if (data.suppliers) {
        setVerifiedSuppliers(data.suppliers)
      } else {
        logger.warn('⚠️ Нет аккредитованных поставщиков в ответе API')
        setVerifiedSuppliers([])
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки аккредитованных поставщиков:', error)
      setVerifiedSuppliers([])
    } finally {
      setLoadingVerified(false)
    }
  }, [])

  const loadCategoriesFromAPI = useCallback(async () => {
    try {
      const response = await fetch('/api/catalog/categories')
      const data = await response.json()
      
      if (data.categories) {
        setApiCategories(data.categories)
      } else {
        // Fallback на статические категории
        setApiCategories(CATEGORY_CERTIFICATIONS.map(cat => ({
          name: cat.category,
          icon: '📦'
        })))
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки категорий:', error)
      // Fallback на статические категории
      setApiCategories(CATEGORY_CERTIFICATIONS.map(cat => ({
        name: cat.category,
        icon: '📦'
      })))
    }
  }, [])

  const loadRecommendations = useCallback(async () => {
    setLoadingRecommendations(true)
    setRecommendationsError(null)
    
    try {
      const response = await fetch('/api/catalog/recommendations?user_id=test-user-id&limit=10')
      const data = await response.json()
      
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations)
      } else {
        setRecommendationsError('Не удалось получить рекомендации')
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки рекомендаций:', error)
      setRecommendationsError('Ошибка загрузки рекомендаций')
    } finally {
      setLoadingRecommendations(false)
    }
  }, [])

  // === ОБРАБОТЧИКИ СОБЫТИЙ (МЕМОИЗИРОВАННЫЕ) ===
  const handleViewDetails = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier)
  }, [])

  const handleStartProject = useCallback((supplier: Supplier) => {
    
    const params = new URLSearchParams({
      supplierId: supplier.id.toString(),
      supplierName: supplier.name || supplier.company_name || '',
      mode: 'catalog'
    })
    
    router.push(`/dashboard/create-project?${params.toString()}`)
  }, [router])

  const handleImportFromProjects = useCallback(() => {
    // TODO: Открыть модальное окно импорта эхо карточек
  }, [])

  const handleAddSupplier = useCallback(() => {
    setShowAddSupplierModal(true)
  }, [])

  const handleCloseAddModal = useCallback(() => {
    setShowAddSupplierModal(false)
  }, [])

  const handleAddModalSuccess = useCallback(() => {
    setShowAddSupplierModal(false)
    loadSuppliersFromAPI() // Перезагружаем поставщиков
  }, [loadSuppliersFromAPI])

  const handleModeChange = useCallback((mode: 'clients' | 'catalog') => {
    setActiveMode(mode)
    
    // Загружаем рекомендации при переключении в каталог
    if (mode === 'catalog' && !recommendations && !loadingRecommendations) {
      loadRecommendations()
    }
  }, [recommendations, loadingRecommendations, loadRecommendations])

  // === ДАННЫЕ ДЛЯ КОМПОНЕНТОВ ===
  const currentSuppliers = useMemo(() => 
    activeMode === 'clients' ? realSuppliers : verifiedSuppliers, 
    [activeMode, realSuppliers, verifiedSuppliers]
  )
  
  const isLoading = useMemo(() => 
    activeMode === 'clients' ? loadingSuppliers : loadingVerified,
    [activeMode, loadingSuppliers, loadingVerified]
  )

  // Динамический массив категорий (мемоизированный)
  const categories: Category[] = useMemo(() => [
    { value: 'all', label: 'Все категории' },
    ...apiCategories.map(cat => ({ 
      value: cat.name, 
      label: `${cat.icon || '📦'} ${cat.name}` 
    }))
  ], [apiCategories])

  // === ОПТИМИЗАЦИЯ КАТАЛОГА ===
  const {
    sortedSuppliers,
    searchStats,
    sortOptions,
    currentSort,
    setCurrentSort
  } = useCatalogOptimization({
    suppliers: currentSuppliers,
    searchQuery,
    selectedCategory,
    mode: activeMode
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Заголовок каталога */}
      <CatalogHeader
        activeMode={activeMode}
        setActiveMode={handleModeChange}
        realSuppliersCount={realSuppliers.length}
        verifiedSuppliersCount={verifiedSuppliers.length}
        filteredSuppliersCount={searchStats.filtered}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        sortOptions={sortOptions}
        currentSort={currentSort}
        setCurrentSort={setCurrentSort}
        onAddSupplier={handleAddSupplier}
        onImportFromProjects={handleImportFromProjects}
        onLoadRecommendations={loadRecommendations}
        supabaseConnected={supabaseConnected}
        supabaseError={supabaseError}
      />

      {/* Контент каталога */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <SupplierGrid
          suppliers={sortedSuppliers}
          mode={activeMode}
          loading={isLoading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          searchStats={searchStats}
          onViewDetails={handleViewDetails}
          onStartProject={handleStartProject}
          onAddSupplier={handleAddSupplier}
          onImportFromProjects={handleImportFromProjects}
        />
      </div>

      {/* Модальные окна */}
      {showAddSupplierModal && (
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={handleCloseAddModal}
          onSuccess={handleAddModalSuccess}
        />
      )}

      {/* TODO: Добавить другие модальные окна */}
      {/* - SupplierModal для детального просмотра */}
      {/* - EchoCardsModal для импорта из проектов */}
      {/* - ProductModal для просмотра товаров */}
    </div>
  )
} 