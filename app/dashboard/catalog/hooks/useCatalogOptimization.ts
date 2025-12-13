import { useMemo, useCallback, useState } from 'react'

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

interface UseCatalogOptimizationProps {
  suppliers: Supplier[]
  searchQuery: string // Ожидается уже deferred/debounced значение от родителя
  selectedCategory: string
  mode: 'clients' | 'catalog'
}

interface UseCatalogOptimizationReturn {
  filteredSuppliers: Supplier[]
  sortedSuppliers: Supplier[]
  searchStats: {
    total: number
    filtered: number
    hasActiveFilters: boolean
  }
  sortOptions: Array<{
    value: string
    label: string
    sortFn: (a: Supplier, b: Supplier) => number
  }>
  currentSort: string
  setCurrentSort: (sort: string) => void
}

export function useCatalogOptimization({
  suppliers,
  searchQuery, // Уже deferred/debounced от родителя через useDeferredValue
  selectedCategory,
  mode
}: UseCatalogOptimizationProps): UseCatalogOptimizationReturn {

  // Состояние сортировки
  const [currentSort, setCurrentSort] = useState('default')

  // Опции сортировки в зависимости от режима
  const sortOptions = useMemo(() => {
    const baseOptions = [
      {
        value: 'default',
        label: 'По умолчанию',
        sortFn: () => 0
      },
      {
        value: 'name',
        label: 'По названию',
        sortFn: (a: Supplier, b: Supplier) => {
          const nameA = a.name || a.company_name || ''
          const nameB = b.name || b.company_name || ''
          return nameA.localeCompare(nameB, 'ru')
        }
      },
      {
        value: 'category',
        label: 'По категории',
        sortFn: (a: Supplier, b: Supplier) => {
          const categoryA = a.category || ''
          const categoryB = b.category || ''
          return categoryA.localeCompare(categoryB, 'ru')
        }
      }
    ]

    if (mode === 'clients') {
      return [
        ...baseOptions,
        {
          value: 'projects',
          label: 'По количеству проектов',
          sortFn: (a: Supplier, b: Supplier) => (b.total_projects || 0) - (a.total_projects || 0)
        },
        {
          value: 'rating',
          label: 'По рейтингу',
          sortFn: (a: Supplier, b: Supplier) => (b.rating || 0) - (a.rating || 0)
        },
        {
          value: 'recent',
          label: 'По последнему проекту',
          sortFn: (a: Supplier, b: Supplier) => {
            const dateA = a.last_project_date ? new Date(a.last_project_date).getTime() : 0
            const dateB = b.last_project_date ? new Date(b.last_project_date).getTime() : 0
            return dateB - dateA
          }
        }
      ]
    } else {
      return [
        ...baseOptions,
        {
          value: 'public_rating',
          label: 'По рейтингу',
          sortFn: (a: Supplier, b: Supplier) => (b.public_rating || 0) - (a.public_rating || 0)
        },
        {
          value: 'projects_count',
          label: 'По популярности',
          sortFn: (a: Supplier, b: Supplier) => (b.projects_count || 0) - (a.projects_count || 0)
        },
        {
          value: 'featured',
          label: 'Рекомендуемые первыми',
          sortFn: (a: Supplier, b: Supplier) => {
            if (a.is_featured && !b.is_featured) return -1
            if (!a.is_featured && b.is_featured) return 1
            return (b.public_rating || 0) - (a.public_rating || 0)
          }
        }
      ]
    }
  }, [mode])

  // Оптимизированная фильтрация
  // searchQuery уже deferred от родителя - фильтрация не блокирует UI
  const filteredSuppliers = useMemo(() => {
    if (!suppliers.length) return []

    return suppliers.filter(supplier => {
      // Базовая проверка валидности
      const supplierName = supplier?.name || supplier?.company_name || ''
      const supplierCategory = supplier?.category || ''

      if (!supplierName.trim() || supplierName === 'NULL') return false

      // Поиск (searchQuery уже deferred от родителя)
      let matchesSearch = true
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        matchesSearch =
          supplierName.toLowerCase().includes(searchLower) ||
          supplierCategory.toLowerCase().includes(searchLower) ||
          (supplier.description?.toLowerCase().includes(searchLower) || false) ||
          (supplier.city?.toLowerCase().includes(searchLower) || false) ||
          (supplier.country?.toLowerCase().includes(searchLower) || false)
      }

      // Фильтр по категории
      const matchesCategory = selectedCategory === 'all' || supplierCategory === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [suppliers, searchQuery, selectedCategory])

  // Оптимизированная сортировка
  const sortedSuppliers = useMemo(() => {
    if (!filteredSuppliers.length) return []
    
    const sortOption = sortOptions.find(option => option.value === currentSort)
    if (!sortOption || currentSort === 'default') {
      return filteredSuppliers
    }

    return [...filteredSuppliers].sort(sortOption.sortFn)
  }, [filteredSuppliers, currentSort, sortOptions])

  // Статистика поиска
  const searchStats = useMemo(() => ({
    total: suppliers.length,
    filtered: filteredSuppliers.length,
    hasActiveFilters: Boolean(searchQuery !== '' || selectedCategory !== 'all')
  }), [suppliers.length, filteredSuppliers.length, searchQuery, selectedCategory])

  return {
    filteredSuppliers,
    sortedSuppliers,
    searchStats,
    sortOptions,
    currentSort,
    setCurrentSort: useCallback((sort: string) => setCurrentSort(sort), [])
  }
} 