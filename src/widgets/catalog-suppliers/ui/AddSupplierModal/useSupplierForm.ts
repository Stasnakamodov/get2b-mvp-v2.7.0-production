/**
 * Хук для управления состоянием формы поставщика
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal
 */

import { useState, useEffect, useCallback } from 'react'
import type { Supplier, SupplierFormData as FormData } from '@/src/entities/supplier'
import type { ProductFormData } from '@/src/entities/product'
import { createSupplier, updateSupplier } from '@/src/entities/supplier'
import { uploadImage } from '@/src/shared/api'
import { DEFAULT_SUPPLIER_FORM_DATA, SUCCESS_MESSAGES } from '@/src/shared/config'
import { logger } from '@/src/shared/lib'
import { validateStep } from './validation'

interface UseSupplierFormProps {
  editingSupplier?: Supplier | null
  onSuccess?: (supplier: Supplier) => void
  onClose: () => void
  isOpen: boolean
}

export const useSupplierForm = ({ editingSupplier, onSuccess, onClose, isOpen }: UseSupplierFormProps) => {
  // Состояние формы
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(DEFAULT_SUPPLIER_FORM_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({})

  // Инициализация при редактировании
  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name,
        company_name: editingSupplier.company_name || '',
        category: editingSupplier.category || 'Электроника',
        country: editingSupplier.country || 'Китай',
        city: editingSupplier.city || '',
        description: editingSupplier.description || '',
        logo_url: editingSupplier.logo_url || '',

        email: editingSupplier.contact_email || '',
        phone: editingSupplier.contact_phone || '',
        website: editingSupplier.website || '',
        contact_person: editingSupplier.contact_person || '',

        min_order: editingSupplier.min_order || '',
        response_time: editingSupplier.response_time || '',
        employees: editingSupplier.employees || '',
        established: editingSupplier.established || '',
        certifications: editingSupplier.certifications || [],
        specialties: editingSupplier.specialties || [],

        products: [],

        payment_methods: [],
        payment_method: '',
        bank_name: '',
        bank_account: '',
        swift_code: '',
        bank_address: '',
        payment_terms: '',
        currency: 'USD',
        card_bank: '',
        card_number: '',
        card_holder: '',
        crypto_network: '',
        crypto_address: ''
      })
      setMaxStep(7)
    } else {
      setFormData(DEFAULT_SUPPLIER_FORM_DATA)
      setMaxStep(1)
      setCurrentStep(1)
    }
  }, [editingSupplier, isOpen])

  // Валидация текущего шага
  const validateCurrentStep = useCallback((): boolean => {
    const result = validateStep(currentStep, formData)

    if (!result.success && result.errors) {
      setErrors(result.errors)
      return false
    }

    setErrors({})
    return true
  }, [currentStep, formData])

  // Переход на следующий шаг
  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      if (nextStep > maxStep) {
        setMaxStep(nextStep)
      }
    }
  }, [currentStep, maxStep, validateCurrentStep])

  // Переход на предыдущий шаг
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }, [currentStep])

  // Клик по шагу в timeline
  const handleStepClick = useCallback((step: number) => {
    if (step <= maxStep) {
      setCurrentStep(step)
      setErrors({})
    }
  }, [maxStep])

  // Обновление поля формы
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очищаем ошибку для этого поля
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Обновление нескольких полей
  const updateFields = useCallback((fields: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...fields }))
  }, [])

  // Загрузка логотипа
  const handleLogoUpload = useCallback(async (file: File) => {
    setUploadingImages(prev => ({ ...prev, logo: true }))
    try {
      const url = await uploadImage(file, 'suppliers')
      if (url) {
        updateField('logo_url', url)
      }
    } catch (error) {
      logger.error('Ошибка загрузки логотипа:', error)
      setErrors(prev => ({ ...prev, logo_url: 'Ошибка загрузки изображения' }))
    } finally {
      setUploadingImages(prev => ({ ...prev, logo: false }))
    }
  }, [updateField])

  // Добавление товара
  const handleAddProduct = useCallback(() => {
    const newProduct: ProductFormData = {
      id: `temp-${Date.now()}`,
      name: '',
      price: '',
      description: '',
      images: [],
      specifications: {},
      category: formData.category,
      inStock: true,
      minOrder: '1 штука'
    }
    updateField('products', [...formData.products, newProduct])
  }, [formData.category, formData.products, updateField])

  // Удаление товара
  const handleRemoveProduct = useCallback((productId: string) => {
    updateField('products', formData.products.filter(p => p.id !== productId))
  }, [formData.products, updateField])

  // Обновление товара
  const handleUpdateProduct = useCallback((index: number, field: keyof ProductFormData, value: any) => {
    const updated = [...formData.products]
    updated[index] = { ...updated[index], [field]: value }
    updateField('products', updated)
  }, [formData.products, updateField])

  // Сохранение поставщика
  const handleSave = useCallback(async () => {
    if (!validateCurrentStep()) return

    setLoading(true)
    try {
      const supplierData: Partial<Supplier> = {
        name: formData.name,
        company_name: formData.company_name,
        category: formData.category,
        country: formData.country,
        city: formData.city,
        description: formData.description,
        logo_url: formData.logo_url,

        contact_email: formData.email,
        contact_phone: formData.phone,
        website: formData.website,
        contact_person: formData.contact_person,

        min_order: formData.min_order,
        response_time: formData.response_time,
        employees: formData.employees,
        established: formData.established,
        certifications: formData.certifications,
        specialties: formData.specialties,

        room_type: 'user',
        source_type: 'manual'
      }

      let result: Supplier | null

      if (editingSupplier) {
        result = await updateSupplier(editingSupplier.id, supplierData)
      } else {
        result = await createSupplier(supplierData)
      }

      if (result) {
        logger.info(editingSupplier ? SUCCESS_MESSAGES.SUPPLIER_UPDATED : SUCCESS_MESSAGES.SUPPLIER_CREATED)
        onSuccess?.(result)
        onClose()
      }
    } catch (error) {
      logger.error('Ошибка сохранения поставщика:', error)
      setErrors({ submit: 'Ошибка сохранения. Попробуйте снова.' })
    } finally {
      setLoading(false)
    }
  }, [editingSupplier, formData, onSuccess, onClose, validateCurrentStep])

  return {
    // Состояние
    currentStep,
    maxStep,
    formData,
    errors,
    loading,
    uploadingImages,

    // Методы навигации
    handleNext,
    handleBack,
    handleStepClick,

    // Методы обновления данных
    updateField,
    updateFields,
    handleLogoUpload,

    // Методы для товаров
    handleAddProduct,
    handleRemoveProduct,
    handleUpdateProduct,

    // Сохранение
    handleSave
  }
}
