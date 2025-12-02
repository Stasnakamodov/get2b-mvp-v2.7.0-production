/**
 * Модальное окно добавления/редактирования поставщика
 * 7-шаговая форма с валидацией
 * Часть FSD архитектуры - widgets/catalog-suppliers
 */

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Building, Phone, Users, CheckCircle, Package, Zap, Eye } from 'lucide-react'
import type { Supplier, SupplierFormData, ProductFormData } from '@/src/entities/supplier'
import { createSupplier, updateSupplier, uploadImage } from '@/src/entities/supplier'
import {
  SUPPLIER_FORM_STEPS,
  DEFAULT_SUPPLIER_FORM_DATA,
  COUNTRIES,
  CURRENCIES,
  PAYMENT_METHODS,
  CRYPTO_NETWORKS,
  RESPONSE_TIMES,
  EMPLOYEE_RANGES,
  MIN_ORDER_RANGES,
  CATEGORY_CERTIFICATIONS,
  toRoman,
  isValidEmail,
  isValidUrl,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '@/src/shared/config'
import { logger } from '@/src/shared/lib'

interface AddSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (supplier: Supplier) => void
  editingSupplier?: Supplier | null
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingSupplier
}) => {
  // Состояние формы
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [formData, setFormData] = useState<SupplierFormData>(DEFAULT_SUPPLIER_FORM_DATA)
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

  // Валидация шага
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = ERROR_MESSAGES.REQUIRED_FIELD
      if (!formData.company_name.trim()) newErrors.company_name = ERROR_MESSAGES.REQUIRED_FIELD
      if (!formData.city.trim()) newErrors.city = ERROR_MESSAGES.REQUIRED_FIELD
      if (!formData.description.trim()) newErrors.description = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (step === 2) {
      if (!formData.email.trim()) {
        newErrors.email = ERROR_MESSAGES.REQUIRED_FIELD
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = ERROR_MESSAGES.INVALID_EMAIL
      }
      if (!formData.phone.trim()) newErrors.phone = ERROR_MESSAGES.REQUIRED_FIELD
      if (!formData.contact_person.trim()) newErrors.contact_person = ERROR_MESSAGES.REQUIRED_FIELD
      if (formData.website && !isValidUrl(formData.website)) {
        newErrors.website = ERROR_MESSAGES.INVALID_URL
      }
    }

    if (step === 3) {
      if (!formData.min_order.trim()) newErrors.min_order = ERROR_MESSAGES.REQUIRED_FIELD
      if (!formData.response_time.trim()) newErrors.response_time = ERROR_MESSAGES.REQUIRED_FIELD
      if (!formData.employees.trim()) newErrors.employees = ERROR_MESSAGES.REQUIRED_FIELD
      if (!formData.established.trim()) newErrors.established = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (step === 4) {
      const certs = CATEGORY_CERTIFICATIONS.find(cat => cat.category === formData.category)?.certifications || []
      if (certs.length > 0 && formData.certifications.length === 0) {
        newErrors.certifications = 'Выберите хотя бы одну сертификацию'
      }
    }

    if (step === 5) {
      if (formData.products.length === 0) {
        newErrors.products = 'Добавьте хотя бы один товар'
      }
    }

    if (step === 6) {
      const hasBankTransfer = formData.bank_name.trim() && formData.bank_account.trim()
      const hasCardPayment = formData.card_bank?.trim() && formData.card_number?.trim()
      const hasCrypto = formData.crypto_network?.trim() && formData.crypto_address?.trim()

      if (!hasBankTransfer && !hasCardPayment && !hasCrypto) {
        newErrors.payment_methods = 'Заполните хотя бы один способ приёма платежей'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Переход на следующий шаг
  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      if (nextStep > maxStep) {
        setMaxStep(nextStep)
      }
    }
  }

  // Переход на предыдущий шаг
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Клик по шагу в timeline
  const handleStepClick = (step: number) => {
    if (step <= maxStep) {
      setCurrentStep(step)
    }
  }

  // Сохранение поставщика
  const handleSave = async () => {
    if (!validateStep(7)) return

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
  }

  // Обработчик загрузки логотипа
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImages(prev => ({ ...prev, logo: true }))
    try {
      const url = await uploadImage(file, 'suppliers')
      if (url) {
        setFormData(prev => ({ ...prev, logo_url: url }))
      }
    } catch (error) {
      logger.error('Ошибка загрузки логотипа:', error)
    } finally {
      setUploadingImages(prev => ({ ...prev, logo: false }))
    }
  }

  // Добавление товара
  const handleAddProduct = () => {
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
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }))
  }

  // Удаление товара
  const handleRemoveProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingSupplier ? 'Редактировать поставщика' : 'Добавить поставщика'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {SUPPLIER_FORM_STEPS.map((step, index) => {
                const stepNum = index + 1
                const isActive = stepNum === currentStep
                const isCompleted = stepNum < currentStep || stepNum <= maxStep
                const Icon = step.icon

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => handleStepClick(stepNum)}
                      disabled={stepNum > maxStep}
                      className={`flex flex-col items-center gap-1 transition-all ${
                        stepNum > maxStep ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-blue-500 text-white scale-110'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium ${
                        isActive ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {toRoman(stepNum)}
                      </span>
                    </button>
                    {index < SUPPLIER_FORM_STEPS.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 rounded ${
                        stepNum < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Контент шагов */}
        <div className="p-6">
          {/* Ошибка сохранения */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {errors.submit}
            </div>
          )}

          {/* Шаг 1: Основная информация */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Основная информация</h3>

              <div>
                <label className="block text-sm font-medium mb-1">Название поставщика *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Введите название"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Название компании *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.company_name ? 'border-red-500' : ''}`}
                  placeholder="Официальное название компании"
                />
                {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Категория *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {CATEGORY_CERTIFICATIONS.map(cat => (
                      <option key={cat.category} value={cat.category}>{cat.category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Страна *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Город *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.city ? 'border-red-500' : ''}`}
                  placeholder="Введите город"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.description ? 'border-red-500' : ''}`}
                  rows={4}
                  placeholder="Опишите деятельность компании"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Логотип</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                {uploadingImages.logo && <p className="text-sm text-gray-500 mt-1">Загрузка...</p>}
                {formData.logo_url && (
                  <img src={formData.logo_url} alt="Logo" className="mt-2 w-20 h-20 object-cover rounded" />
                )}
              </div>
            </div>
          )}

          {/* Шаг 2: Контакты */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Контактная информация</h3>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="contact@company.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Телефон *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+7 (999) 123-45-67"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Контактное лицо *</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.contact_person ? 'border-red-500' : ''}`}
                  placeholder="Иван Иванов"
                />
                {errors.contact_person && <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Веб-сайт</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.website ? 'border-red-500' : ''}`}
                  placeholder="https://example.com"
                />
                {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
              </div>
            </div>
          )}

          {/* Шаг 3: Бизнес-профиль */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Бизнес-профиль</h3>

              <div>
                <label className="block text-sm font-medium mb-1">Минимальный заказ *</label>
                <select
                  value={formData.min_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_order: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.min_order ? 'border-red-500' : ''}`}
                >
                  <option value="">Выберите...</option>
                  {MIN_ORDER_RANGES.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
                {errors.min_order && <p className="text-red-500 text-sm mt-1">{errors.min_order}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Время ответа *</label>
                <select
                  value={formData.response_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, response_time: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.response_time ? 'border-red-500' : ''}`}
                >
                  <option value="">Выберите...</option>
                  {RESPONSE_TIMES.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {errors.response_time && <p className="text-red-500 text-sm mt-1">{errors.response_time}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Количество сотрудников *</label>
                <select
                  value={formData.employees}
                  onChange={(e) => setFormData(prev => ({ ...prev, employees: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.employees ? 'border-red-500' : ''}`}
                >
                  <option value="">Выберите...</option>
                  {EMPLOYEE_RANGES.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
                {errors.employees && <p className="text-red-500 text-sm mt-1">{errors.employees}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Год основания *</label>
                <input
                  type="text"
                  value={formData.established}
                  onChange={(e) => setFormData(prev => ({ ...prev, established: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg ${errors.established ? 'border-red-500' : ''}`}
                  placeholder="2010"
                />
                {errors.established && <p className="text-red-500 text-sm mt-1">{errors.established}</p>}
              </div>
            </div>
          )}

          {/* Шаг 4: Сертификации */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Сертификации</h3>

              <p className="text-sm text-gray-600 mb-4">
                Выберите сертификации для категории: <strong>{formData.category}</strong>
              </p>

              {errors.certifications && (
                <p className="text-red-500 text-sm mb-2">{errors.certifications}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORY_CERTIFICATIONS.find(cat => cat.category === formData.category)?.certifications.map(cert => (
                  <label
                    key={cert}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.certifications.includes(cert)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.certifications.includes(cert)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            certifications: [...prev.certifications, cert]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            certifications: prev.certifications.filter(c => c !== cert)
                          }))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{cert}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Шаг 5: Товары */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Товары ({formData.products.length})</h3>
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  + Добавить товар
                </button>
              </div>

              {errors.products && (
                <p className="text-red-500 text-sm mb-2">{errors.products}</p>
              )}

              {formData.products.length > 0 ? (
                <div className="space-y-3">
                  {formData.products.map((product, index) => (
                    <div key={product.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">Товар {index + 1}</h4>
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Удалить
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => {
                            const updated = [...formData.products]
                            updated[index].name = e.target.value
                            setFormData(prev => ({ ...prev, products: updated }))
                          }}
                          placeholder="Название товара"
                          className="px-3 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          value={product.price}
                          onChange={(e) => {
                            const updated = [...formData.products]
                            updated[index].price = e.target.value
                            setFormData(prev => ({ ...prev, products: updated }))
                          }}
                          placeholder="Цена"
                          className="px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нет добавленных товаров
                </div>
              )}
            </div>
          )}

          {/* Шаг 6: Реквизиты */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Платежные реквизиты</h3>

              {errors.payment_methods && (
                <p className="text-red-500 text-sm mb-2">{errors.payment_methods}</p>
              )}

              {/* Банковский перевод */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">🏦 Банковский перевод</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Название банка"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
                    placeholder="Номер счета"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.swift_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, swift_code: e.target.value }))}
                    placeholder="SWIFT код (опционально)"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* P2P карта */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">💳 P2P оплата картой</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.card_bank || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_bank: e.target.value }))}
                    placeholder="Банк-эмитент"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.card_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                    placeholder="Номер карты"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.card_holder || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_holder: e.target.value }))}
                    placeholder="Владелец карты"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Криптовалюта */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">₿ Криптовалюта</h4>
                <div className="space-y-3">
                  <select
                    value={formData.crypto_network || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, crypto_network: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Выберите сеть...</option>
                    {CRYPTO_NETWORKS.map(network => (
                      <option key={network} value={network}>{network}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.crypto_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, crypto_address: e.target.value }))}
                    placeholder="Адрес кошелька"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Шаг 7: Превью */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Проверьте данные перед сохранением</h3>

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Основная информация</h4>
                  <p><strong>Название:</strong> {formData.name}</p>
                  <p><strong>Компания:</strong> {formData.company_name}</p>
                  <p><strong>Категория:</strong> {formData.category}</p>
                  <p><strong>Локация:</strong> {formData.country}, {formData.city}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Контакты</h4>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Телефон:</strong> {formData.phone}</p>
                  <p><strong>Контактное лицо:</strong> {formData.contact_person}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Бизнес</h4>
                  <p><strong>Мин. заказ:</strong> {formData.min_order}</p>
                  <p><strong>Время ответа:</strong> {formData.response_time}</p>
                  <p><strong>Сотрудников:</strong> {formData.employees}</p>
                  <p><strong>Год основания:</strong> {formData.established}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Сертификации ({formData.certifications.length})</h4>
                  <p>{formData.certifications.join(', ') || 'Не указаны'}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Товары ({formData.products.length})</h4>
                  {formData.products.map((p, i) => (
                    <p key={i}>{i + 1}. {p.name} - {p.price}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Футер с кнопками */}
        <div className="p-6 border-t flex justify-between">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {currentStep === 1 ? (
              <>Отмена</>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Назад
              </>
            )}
          </button>

          <button
            onClick={currentStep === 7 ? handleSave : handleNext}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Сохранение...'
            ) : currentStep === 7 ? (
              'Сохранить'
            ) : (
              <>
                Далее
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}