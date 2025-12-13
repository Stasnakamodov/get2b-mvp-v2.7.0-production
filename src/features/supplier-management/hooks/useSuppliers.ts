/**
 * Хук для работы с поставщиками в каталоге
 * Часть FSD архитектуры - features/supplier-management
 */

import { useState, useEffect, useCallback } from 'react'
import {
  fetchUserSuppliers,
  fetchVerifiedSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
  type RoomType,
  type LoadingState
} from '@/src/entities/supplier'
import { logger } from '@/src/shared/lib'

interface UseSuppliersResult {
  // Данные
  userSuppliers: Supplier[]
  verifiedSuppliers: Supplier[]
  allSuppliers: Supplier[]

  // Состояния загрузки
  loadingUser: boolean
  loadingVerified: boolean
  isLoading: boolean

  // Ошибки
  userError: string | null
  verifiedError: string | null

  // Методы
  loadUserSuppliers: () => Promise<void>
  loadVerifiedSuppliers: () => Promise<void>
  refreshSuppliers: () => Promise<void>
  addSupplier: (data: Partial<Supplier>) => Promise<Supplier | null>
  editSupplier: (id: string, data: Partial<Supplier>) => Promise<Supplier | null>
  removeSupplier: (id: string) => Promise<boolean>

  // Фильтрация
  filterByRoom: (room: RoomType) => Supplier[]
  filterByCategory: (category: string) => Supplier[]
  searchSuppliers: (query: string) => Supplier[]
}

/**
 * Основной хук для управления поставщиками
 */
export const useSuppliers = (): UseSuppliersResult => {
  // Состояния данных
  const [userSuppliers, setUserSuppliers] = useState<Supplier[]>([])
  const [verifiedSuppliers, setVerifiedSuppliers] = useState<Supplier[]>([])

  // Состояния загрузки
  const [loadingUser, setLoadingUser] = useState(false)
  const [loadingVerified, setLoadingVerified] = useState(false)

  // Состояния ошибок
  const [userError, setUserError] = useState<string | null>(null)
  const [verifiedError, setVerifiedError] = useState<string | null>(null)

  /**
   * Загрузка пользовательских поставщиков
   */
  const loadUserSuppliers = useCallback(async () => {
    logger.debug('🔄 Загрузка пользовательских поставщиков...')
    setLoadingUser(true)
    setUserError(null)

    try {
      const suppliers = await fetchUserSuppliers()
      setUserSuppliers(suppliers)
      logger.info(`✅ Загружено ${suppliers.length} пользовательских поставщиков`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setUserError(message)
      logger.error('❌ Ошибка загрузки пользовательских поставщиков:', error)
    } finally {
      setLoadingUser(false)
    }
  }, [])

  /**
   * Загрузка аккредитованных поставщиков
   */
  const loadVerifiedSuppliers = useCallback(async () => {
    logger.debug('🔄 Загрузка аккредитованных поставщиков...')
    setLoadingVerified(true)
    setVerifiedError(null)

    try {
      const suppliers = await fetchVerifiedSuppliers()
      setVerifiedSuppliers(suppliers)
      logger.info(`✅ Загружено ${suppliers.length} аккредитованных поставщиков`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setVerifiedError(message)
      logger.error('❌ Ошибка загрузки аккредитованных поставщиков:', error)
    } finally {
      setLoadingVerified(false)
    }
  }, [])

  /**
   * Обновление всех поставщиков
   */
  const refreshSuppliers = useCallback(async () => {
    logger.debug('🔄 Обновление всех поставщиков...')
    await Promise.all([
      loadUserSuppliers(),
      loadVerifiedSuppliers()
    ])
  }, [loadUserSuppliers, loadVerifiedSuppliers])

  /**
   * Добавление нового поставщика
   */
  const addSupplier = useCallback(async (data: Partial<Supplier>): Promise<Supplier | null> => {
    logger.debug('📝 Добавление нового поставщика:', data.name)

    try {
      const newSupplier = await createSupplier(data)

      if (newSupplier) {
        // Обновляем локальный список
        setUserSuppliers(prev => [...prev, newSupplier])
        logger.info('✅ Поставщик добавлен:', newSupplier.id)
      }

      return newSupplier
    } catch (error) {
      logger.error('❌ Ошибка добавления поставщика:', error)
      return null
    }
  }, [])

  /**
   * Редактирование поставщика
   */
  const editSupplier = useCallback(async (
    id: string,
    data: Partial<Supplier>
  ): Promise<Supplier | null> => {
    logger.debug('✏️ Редактирование поставщика:', id)

    try {
      const updatedSupplier = await updateSupplier(id, data)

      if (updatedSupplier) {
        // Обновляем локальный список
        setUserSuppliers(prev => prev.map(s =>
          s.id === id ? updatedSupplier : s
        ))
        logger.info('✅ Поставщик обновлен:', id)
      }

      return updatedSupplier
    } catch (error) {
      logger.error('❌ Ошибка обновления поставщика:', error)
      return null
    }
  }, [])

  /**
   * Удаление поставщика
   */
  const removeSupplier = useCallback(async (id: string): Promise<boolean> => {
    logger.debug('🗑️ Удаление поставщика:', id)

    try {
      const success = await deleteSupplier(id)

      if (success) {
        // Удаляем из локального списка
        setUserSuppliers(prev => prev.filter(s => s.id !== id))
        logger.info('✅ Поставщик удален:', id)
      }

      return success
    } catch (error) {
      logger.error('❌ Ошибка удаления поставщика:', error)
      return false
    }
  }, [])

  /**
   * Фильтрация по комнате
   */
  const filterByRoom = useCallback((room: RoomType): Supplier[] => {
    if (room === 'orange') {
      return verifiedSuppliers
    } else {
      return userSuppliers
    }
  }, [userSuppliers, verifiedSuppliers])

  /**
   * Фильтрация по категории
   */
  const filterByCategory = useCallback((category: string): Supplier[] => {
    const allSuppliers = [...userSuppliers, ...verifiedSuppliers]

    if (category === 'all') {
      return allSuppliers
    }

    return allSuppliers.filter(supplier =>
      supplier.category.toLowerCase() === category.toLowerCase()
    )
  }, [userSuppliers, verifiedSuppliers])

  /**
   * Поиск поставщиков
   */
  const searchSuppliers = useCallback((query: string): Supplier[] => {
    const searchTerm = query.toLowerCase().trim()

    if (!searchTerm) {
      return [...userSuppliers, ...verifiedSuppliers]
    }

    const allSuppliers = [...userSuppliers, ...verifiedSuppliers]

    return allSuppliers.filter(supplier => {
      const searchableFields = [
        supplier.name,
        supplier.company_name,
        supplier.category,
        supplier.country,
        supplier.city,
        supplier.description
      ].filter(Boolean).join(' ').toLowerCase()

      return searchableFields.includes(searchTerm)
    })
  }, [userSuppliers, verifiedSuppliers])

  /**
   * Загрузка при монтировании
   */
  useEffect(() => {
    refreshSuppliers()
  }, []) // Убираем refreshSuppliers из зависимостей, чтобы избежать цикла

  return {
    // Данные
    userSuppliers,
    verifiedSuppliers,
    allSuppliers: [...userSuppliers, ...verifiedSuppliers],

    // Состояния загрузки
    loadingUser,
    loadingVerified,
    isLoading: loadingUser || loadingVerified,

    // Ошибки
    userError,
    verifiedError,

    // Методы
    loadUserSuppliers,
    loadVerifiedSuppliers,
    refreshSuppliers,
    addSupplier,
    editSupplier,
    removeSupplier,

    // Фильтрация
    filterByRoom,
    filterByCategory,
    searchSuppliers
  }
}

/**
 * Хук для работы с одним поставщиком
 */
export const useSupplier = (supplierId: string | null) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSupplier = useCallback(async () => {
    if (!supplierId) {
      setSupplier(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Сначала пробуем загрузить из user suppliers
      const userSuppliers = await fetchUserSuppliers()
      let foundSupplier = userSuppliers.find(s => s.id === supplierId)

      // Если не нашли, пробуем verified suppliers
      if (!foundSupplier) {
        const verifiedSuppliers = await fetchVerifiedSuppliers()
        foundSupplier = verifiedSuppliers.find(s => s.id === supplierId)
      }

      if (foundSupplier) {
        setSupplier(foundSupplier)
        logger.info('✅ Поставщик загружен:', supplierId)
      } else {
        throw new Error('Поставщик не найден')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setError(message)
      logger.error('❌ Ошибка загрузки поставщика:', error)
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  useEffect(() => {
    loadSupplier()
  }, [supplierId])

  return {
    supplier,
    loading,
    error,
    reload: loadSupplier
  }
}