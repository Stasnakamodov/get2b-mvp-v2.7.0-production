/**
 * Хук для работы с товарами поставщиков
 * Часть FSD архитектуры - features/supplier-management
 */

import { useState, useEffect, useCallback } from 'react'
import {
  fetchSupplierProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type ProductFormData
} from '@/src/entities/product'
import { uploadImage } from '@/src/shared/api'
import { logger } from '@/src/shared/lib'

interface UseProductsResult {
  // Данные
  products: Product[]
  selectedProduct: Product | null

  // Состояния
  loading: boolean
  error: string | null
  uploadingImages: { [productId: string]: boolean }

  // Методы
  loadProducts: (supplierId: string, supplierType?: 'user' | 'verified') => Promise<void>
  selectProduct: (product: Product | null) => void
  addProduct: (supplierId: string, data: Partial<Product>) => Promise<Product | null>
  editProduct: (productId: string, data: Partial<Product>) => Promise<Product | null>
  removeProduct: (productId: string) => Promise<boolean>
  uploadProductImage: (productId: string, file: File) => Promise<string | null>
  searchProducts: (query: string) => Product[]
  filterByCategory: (category: string) => Product[]
  filterByStock: (inStock: boolean) => Product[]
}

/**
 * Основной хук для управления товарами
 */
export const useProducts = (): UseProductsResult => {
  // Состояния данных
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(null)
  const [currentSupplierType, setCurrentSupplierType] = useState<'user' | 'verified'>('user')

  // Состояния загрузки
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState<{ [productId: string]: boolean }>({})

  /**
   * Загрузка товаров поставщика
   */
  const loadProducts = useCallback(async (
    supplierId: string,
    supplierType: 'user' | 'verified' = 'user'
  ) => {
    logger.debug(`📦 Загрузка товаров поставщика: ${supplierId} (${supplierType})`)
    setLoading(true)
    setError(null)
    setCurrentSupplierId(supplierId)
    setCurrentSupplierType(supplierType)

    try {
      const loadedProducts = await fetchSupplierProducts(supplierId, supplierType)
      setProducts(loadedProducts)
      logger.info(`✅ Загружено ${loadedProducts.length} товаров`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setError(message)
      logger.error('❌ Ошибка загрузки товаров:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Выбор товара
   */
  const selectProduct = useCallback((product: Product | null) => {
    logger.debug('🛍️ Выбран товар:', product?.product_name)
    setSelectedProduct(product)
  }, [])

  /**
   * Добавление нового товара
   */
  const addProduct = useCallback(async (
    supplierId: string,
    data: Partial<Product>
  ): Promise<Product | null> => {
    logger.debug('📝 Добавление товара для поставщика:', supplierId)

    try {
      const newProduct = await createProduct(supplierId, data)

      if (newProduct) {
        // Обновляем локальный список
        setProducts(prev => [...prev, newProduct])
        logger.info('✅ Товар добавлен:', newProduct.id)
      }

      return newProduct
    } catch (error) {
      logger.error('❌ Ошибка добавления товара:', error)
      return null
    }
  }, [])

  /**
   * Редактирование товара
   */
  const editProduct = useCallback(async (
    productId: string,
    data: Partial<Product>
  ): Promise<Product | null> => {
    logger.debug('✏️ Редактирование товара:', productId)

    try {
      const updatedProduct = await updateProduct(productId, data)

      if (updatedProduct) {
        // Обновляем локальный список
        setProducts(prev => prev.map(p =>
          p.id === productId ? updatedProduct : p
        ))

        // Обновляем выбранный товар, если это он
        if (selectedProduct?.id === productId) {
          setSelectedProduct(updatedProduct)
        }

        logger.info('✅ Товар обновлен:', productId)
      }

      return updatedProduct
    } catch (error) {
      logger.error('❌ Ошибка обновления товара:', error)
      return null
    }
  }, [selectedProduct])

  /**
   * Удаление товара
   */
  const removeProduct = useCallback(async (productId: string): Promise<boolean> => {
    logger.debug('🗑️ Удаление товара:', productId)

    try {
      const success = await deleteProduct(productId)

      if (success) {
        // Удаляем из локального списка
        setProducts(prev => prev.filter(p => p.id !== productId))

        // Сбрасываем выбранный товар, если это он
        if (selectedProduct?.id === productId) {
          setSelectedProduct(null)
        }

        logger.info('✅ Товар удален:', productId)
      }

      return success
    } catch (error) {
      logger.error('❌ Ошибка удаления товара:', error)
      return false
    }
  }, [selectedProduct])

  /**
   * Загрузка изображения товара
   */
  const uploadProductImage = useCallback(async (
    productId: string,
    file: File
  ): Promise<string | null> => {
    logger.debug('📤 Загрузка изображения для товара:', productId)

    setUploadingImages(prev => ({ ...prev, [productId]: true }))

    try {
      const imageUrl = await uploadImage(file, 'products')

      if (imageUrl) {
        // Обновляем товар с новым изображением
        const product = products.find(p => p.id === productId)
        if (product) {
          const currentImages = product.images || []
          const updatedImages = [...currentImages, imageUrl]

          await editProduct(productId, { images: updatedImages })
        }

        logger.info('✅ Изображение загружено:', imageUrl)
      }

      return imageUrl
    } catch (error) {
      logger.error('❌ Ошибка загрузки изображения:', error)
      return null
    } finally {
      setUploadingImages(prev => ({ ...prev, [productId]: false }))
    }
  }, [products, editProduct])

  /**
   * Поиск товаров
   */
  const searchProducts = useCallback((query: string): Product[] => {
    const searchTerm = query.toLowerCase().trim()

    if (!searchTerm) {
      return products
    }

    return products.filter(product => {
      const searchableFields = [
        product.product_name,
        product.name,
        product.description,
        product.item_code,
        product.sku,
        product.category
      ].filter(Boolean).join(' ').toLowerCase()

      return searchableFields.includes(searchTerm)
    })
  }, [products])

  /**
   * Фильтрация по категории
   */
  const filterByCategory = useCallback((category: string): Product[] => {
    if (category === 'all') {
      return products
    }

    return products.filter(product =>
      product.category?.toLowerCase() === category.toLowerCase()
    )
  }, [products])

  /**
   * Фильтрация по наличию
   */
  const filterByStock = useCallback((inStock: boolean): Product[] => {
    return products.filter(product => product.in_stock === inStock)
  }, [products])

  return {
    // Данные
    products,
    selectedProduct,

    // Состояния
    loading,
    error,
    uploadingImages,

    // Методы
    loadProducts,
    selectProduct,
    addProduct,
    editProduct,
    removeProduct,
    uploadProductImage,
    searchProducts,
    filterByCategory,
    filterByStock
  }
}