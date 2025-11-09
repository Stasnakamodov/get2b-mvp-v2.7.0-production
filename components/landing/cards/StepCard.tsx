import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProcessStep } from '@/types/landing'
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader, CheckCircle, X as XIcon } from 'lucide-react'
import { CatalogModalLanding } from '@/components/landing/modals/CatalogModalLanding'

interface StepCardProps {
  step: ProcessStep
  index: number
}

/**
 * Карточка шага процесса для секции "Как это работает"
 * Отображается в grid с анимацией появления
 * При клике открывает модальное окно с подробной информацией
 */
export function StepCard({ step, index }: StepCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const Icon = step.icon

  // OCR states for Step 1 (Company Data)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [ocrError, setOcrError] = useState<string>('')
  const [extractedData, setExtractedData] = useState<any>(null)
  const [showDragDrop, setShowDragDrop] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // OCR states for Step 2 (Invoice/Specification)
  const [isAnalyzingInvoice, setIsAnalyzingInvoice] = useState(false)
  const [invoiceOcrError, setInvoiceOcrError] = useState<string>('')
  const [extractedInvoiceData, setExtractedInvoiceData] = useState<any>(null)
  const [showInvoiceDragDrop, setShowInvoiceDragDrop] = useState(false)
  const [isInvoiceDragging, setIsInvoiceDragging] = useState(false)

  // Catalog modal state for Step 2
  const [showCatalogModal, setShowCatalogModal] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    inn: '',
    kpp: '',
    ogrn: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bik: '',
    correspondentAccount: '',
    phone: '',
    email: '',
    website: '',
    director: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Обработчики с задержкой для предотвращения мерцания
  const handleMouseEnter = (method: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHoveredMethod(method)
  }

  const handleMouseLeave = () => {
    // Задержка 150ms перед скрытием
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMethod(null)
    }, 150)
  }

  // Обработчик загрузки и анализа файла
  const handleFileUpload = async (file: File) => {
    setShowDragDrop(false) // Скрываем drag-and-drop зону при начале загрузки
    setIsAnalyzing(true)
    setOcrError('')
    setExtractedData(null)

    try {
      // Конвертируем файл в base64 для отправки
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Отправляем на анализ
      const response = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: base64,
          fileType: file.type,
          documentType: 'company_card'
        })
      })

      if (!response.ok) {
        throw new Error('Ошибка анализа документа')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Не удалось извлечь данные')
      }

      // Сохраняем извлеченные данные
      setExtractedData(result.suggestions)

      // Автоматически заполняем форму
      setFormData({
        name: result.suggestions.companyName || result.suggestions.name || '',
        legalName: result.suggestions.legalName || result.suggestions.companyName || '',
        inn: result.suggestions.inn || '',
        kpp: result.suggestions.kpp || '',
        ogrn: result.suggestions.ogrn || '',
        address: result.suggestions.address || '',
        bankName: result.suggestions.bankName || '',
        bankAccount: result.suggestions.bankAccount || '',
        bik: result.suggestions.bankBik || result.suggestions.bik || '',
        correspondentAccount: result.suggestions.bankCorrAccount || result.suggestions.correspondentAccount || '',
        phone: result.suggestions.phone || '',
        email: result.suggestions.email || '',
        website: result.suggestions.website || '',
        director: result.suggestions.director || ''
      })

    } catch (error) {
      console.error('Ошибка OCR:', error)
      setOcrError(error instanceof Error ? error.message : 'Ошибка анализа документа')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Обработчик клика на кубик "Загрузить" - показывает drag-and-drop зону
  const handleUploadClick = () => {
    setShowDragDrop(true)
  }

  // Обработчик клика на drag-and-drop зону - открывает выбор файла
  const handleDragDropClick = () => {
    document.getElementById('ocr-file-input')?.click()
  }

  // Обработчики drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Обработчик изменения полей формы
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Обработчик отправки формы
  const handleSubmitRegistration = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/landing/submit-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Ошибка отправки заявки')
      }

      setSubmitSuccess(true)
    } catch (error) {
      console.error('Ошибка отправки:', error)
      alert('Ошибка отправки заявки. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Обработчик загрузки и анализа инвойса/Excel для Step 2
  const handleInvoiceFileUpload = async (file: File) => {
    setShowInvoiceDragDrop(false)
    setIsAnalyzingInvoice(true)
    setInvoiceOcrError('')
    setExtractedInvoiceData(null)

    try {
      // Конвертируем файл в base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Отправляем на анализ с documentType='invoice'
      const response = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: base64,
          fileType: file.type,
          documentType: 'invoice'
        })
      })

      if (!response.ok) {
        throw new Error('Ошибка анализа документа')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Не удалось извлечь данные')
      }

      // Сохраняем извлеченные данные
      setExtractedInvoiceData(result.suggestions)
      console.log('📊 Данные инвойса извлечены:', result.suggestions)

    } catch (error) {
      console.error('Ошибка OCR инвойса:', error)
      setInvoiceOcrError(error instanceof Error ? error.message : 'Ошибка анализа документа')
    } finally {
      setIsAnalyzingInvoice(false)
    }
  }

  // Обработчик клика на кнопку "Загрузить Excel"
  const handleInvoiceUploadClick = () => {
    setShowInvoiceDragDrop(true)
  }

  // Обработчик клика на drag-and-drop зону инвойса
  const handleInvoiceDragDropClick = () => {
    document.getElementById('invoice-file-input')?.click()
  }

  // Обработчики drag-and-drop для инвойса
  const handleInvoiceDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsInvoiceDragging(true)
  }

  const handleInvoiceDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsInvoiceDragging(false)
  }

  const handleInvoiceDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsInvoiceDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleInvoiceFileUpload(file)
    }
  }

  // Описания способов заполнения для Шага 1 - Данные компании
  const fillMethodDescriptions = {
    profile: {
      title: 'Автозаполнение из профиля',
      description: 'Если вы уже сохраняли данные своей компании в системе, все поля заполнятся автоматически одним кликом. Не нужно вводить повторно ИНН, реквизиты и контакты.',
      benefits: ['Мгновенное заполнение', 'Нет ошибок при вводе', 'Данные всегда актуальны']
    },
    template: {
      title: 'Использование шаблона',
      description: 'Выберите готовый шаблон из библиотеки типовых данных. Подходит для стандартных организационных форм и распространённых типов компаний.',
      benefits: ['Быстрый старт', 'Проверенные форматы', 'Легко адаптировать']
    },
    manual: {
      title: 'Ручное заполнение',
      description: 'Заполните все поля формы самостоятельно. Полный контроль над каждым полем с подсказками по формату данных и валидацией в реальном времени.',
      benefits: ['Полный контроль', 'Проверка в реальном времени', 'Подсказки по формату']
    },
    upload: {
      title: 'Загрузка и распознавание (OCR)',
      description: 'Попробуйте прямо сейчас! Если у вас есть готовая карточка предприятия, устав или выписка из ЕГРЮЛ — просто загрузите фото или скан. Умный OCR автоматически распознает все данные и заполнит форму за вас. После этого вы сможете сразу зарегистрироваться!',
      benefits: ['Распознавание документов', 'Мгновенная регистрация', 'Высокая точность']
    }
  }

  // Описания способов заполнения для Шага 2 - Спецификация товаров
  const specificationMethodDescriptions = {
    catalog: {
      title: 'Из каталога GET2B',
      description: 'Выберите товары из каталога верифицированных поставщиков GET2B. Все партнёры проверены и аккредитованы. Просто укажите количество и параметры — добавляйте товары в корзину одним кликом.',
      benefits: ['Проверенные поставщики', 'Гарантия качества', 'Быстрое добавление']
    },
    excel: {
      title: 'Загрузить Excel',
      description: 'Загрузите готовую спецификацию в формате Excel (.xlsx, .xls). Система автоматически распознает товары, количество, цены и другие параметры. Идеально для оптовых закупок.',
      benefits: ['Массовая загрузка', 'Автоматическое распознавание', 'Экономия времени']
    },
    manual: {
      title: 'Вручную',
      description: 'Добавляйте товары по одному, заполняя все параметры вручную. Полный контроль над каждой позицией с возможностью указать детали: размеры, цвета, брендирование и упаковку.',
      benefits: ['Полный контроль', 'Детализация', 'Гибкость']
    },
    template: {
      title: 'Из шаблона',
      description: 'Используйте готовый шаблон спецификации для типовых закупок. Выберите категорию товаров и адаптируйте под свои нужды — быстрый старт для стандартных заказов.',
      benefits: ['Готовые шаблоны', 'Быстрый старт', 'Проверенные категории']
    }
  }

  return (
    <React.Fragment>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setIsOpen(true)}
        className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 transition-all cursor-pointer hover:shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-light text-zinc-300">{step.number}</div>
          <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-zinc-700" />
          </div>
        </div>
        <h3 className="text-base font-normal mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 mb-3 font-light">{step.description}</p>
        <div className="text-xs text-gray-500 font-light">⏱ {step.time}</div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`w-[95vw] ${step.number === '02' ? 'max-w-[1800px]' : 'max-w-[1400px]'} max-h-[90vh] overflow-hidden p-0`}>
          {step.number === '02' ? (
            // STEP 2: Top/Bottom layout (horizontal split)
            <div className="flex flex-col min-h-[700px]">
              {/* ВЕРХНИЙ БЛОК - ФОРМА ШАГ 2 */}
              <div className="p-10 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-y-auto max-h-[50vh]">
                <div className="space-y-6">
                  {/* Информация о товаре */}
                  <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-blue-900">Информация о товаре</h3>
                    </div>
                    <div className="space-y-4">
                      {/* Название товара */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-800">
                          Название товара <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Футболка хлопковая мужская"
                        />
                      </div>

                      {/* Артикул и Ссылка */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Артикул поставщика <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="TS-2024-001"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Ссылка на товар <span className="text-xs text-zinc-500">(опционально)</span>
                          </label>
                          <input
                            type="url"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      {/* Категория */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-800">
                          Категория <span className="text-red-500">*</span>
                        </label>
                        <select className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                          <option value="">Выберите категорию</option>
                          <option value="clothing">Одежда</option>
                          <option value="electronics">Электроника</option>
                          <option value="furniture">Мебель</option>
                          <option value="accessories">Аксессуары</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Параметры заказа */}
                  <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-green-900">Параметры заказа</h3>
                    </div>
                    <div className="space-y-4">
                      {/* Количество и Цена */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Количество <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(шт)</span>
                          </label>
                          <input
                            type="number"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="100"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Цена за единицу <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(¥ юань)</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="25.50"
                          />
                        </div>
                      </div>

                      {/* Размер и Цвет */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Размер/Вариант
                          </label>
                          <input
                            type="text"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="L, XL, XXL"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Цвет
                          </label>
                          <input
                            type="text"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            placeholder="Черный, Белый"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Дополнительно */}
                  <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-purple-900">Дополнительно</h3>
                    </div>
                    <div className="space-y-4">
                      {/* Комментарий */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-800">
                          Комментарий к товару
                        </label>
                        <textarea
                          rows={3}
                          className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                          placeholder="Особые требования к товару..."
                        />
                      </div>

                      {/* Брендирование и Упаковка */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Брендирование
                          </label>
                          <input
                            type="text"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="Логотип, бирка"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-800">
                            Упаковка
                          </label>
                          <input
                            type="text"
                            className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="Индивидуальная, коробка"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка добавить товар */}
                  <div className="pt-2">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base">
                      Добавить товар в спецификацию
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* НИЖНИЙ БЛОК - ИНФОРМАЦИЯ О ШАГЕ 2 */}
              <div className="p-8 bg-white overflow-y-auto max-h-[40vh] border-t border-gray-200">
                <div className="max-w-full mx-auto space-y-6">
                  {/* Способы заполнения */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Как заполнить?</h3>

                    <div className="grid grid-cols-4 gap-3">
                      {/* Из каталога */}
                      <div
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('catalog')}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => setShowCatalogModal(true)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-blue-900 text-sm">Из каталога</span>
                        </div>
                        <p className="text-xs text-blue-700 leading-snug">GET2B поставщики</p>
                      </div>

                      {/* Загрузить Excel */}
                      <div
                        className="bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('excel')}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleInvoiceUploadClick}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-orange-900 text-sm">Загрузить Excel</span>
                        </div>
                        <p className="text-xs text-orange-700 leading-snug">Массовая загрузка</p>
                      </div>

                      {/* Вручную */}
                      <div
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('manual')}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">Вручную</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-snug">По одному товару</p>
                      </div>

                      {/* Из шаблона */}
                      <div
                        className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('template')}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-green-900 text-sm">Из шаблона</span>
                        </div>
                        <p className="text-xs text-green-700 leading-snug">Готовый шаблон</p>
                      </div>
                    </div>

                    {/* Область с описанием */}
                    <div className="min-h-[200px]">
                      <AnimatePresence mode="wait">
                        {/* Analyzing status */}
                        {isAnalyzingInvoice ? (
                          <motion.div
                            key="analyzing-invoice"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-5"
                          >
                            <div className="flex items-center gap-2">
                              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                              <span className="text-blue-800 font-medium">Анализируем инвойс...</span>
                            </div>
                            <p className="text-sm text-blue-600 mt-2">Извлекаем товары и реквизиты поставщика</p>
                          </motion.div>
                        ) : extractedInvoiceData ? (
                          // Success with extracted invoice data
                          <motion.div
                            key="success-invoice"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-green-800 font-medium">Данные успешно извлечены!</span>
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                              {extractedInvoiceData.items && extractedInvoiceData.items.length > 0 && (
                                <p>• Найдено товаров: {extractedInvoiceData.items.length}</p>
                              )}
                              {extractedInvoiceData.invoiceInfo?.number && (
                                <p>• Номер инвойса: {extractedInvoiceData.invoiceInfo.number}</p>
                              )}
                              {extractedInvoiceData.invoiceInfo?.totalAmount && (
                                <p>• Сумма: {extractedInvoiceData.invoiceInfo.totalAmount} {extractedInvoiceData.invoiceInfo.currency || ''}</p>
                              )}
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                              <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-800">
                                  <p className="font-semibold mb-1">Товары готовы к добавлению</p>
                                  <p className="leading-relaxed">Данные извлечены из инвойса и готовы к добавлению в спецификацию проекта. Зарегистрируйтесь, чтобы продолжить!</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : invoiceOcrError ? (
                          // Error status
                          <motion.div
                            key="error-invoice"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-red-50 border border-red-200 rounded-lg p-5"
                          >
                            <div className="flex items-center gap-2">
                              <XIcon className="w-5 h-5 text-red-600" />
                              <span className="text-red-800 font-medium">Ошибка анализа</span>
                            </div>
                            <p className="text-sm text-red-600 mt-2">{invoiceOcrError}</p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setInvoiceOcrError('')
                                handleInvoiceUploadClick()
                              }}
                              className="w-full mt-3"
                            >
                              Попробовать снова
                            </Button>
                          </motion.div>
                        ) : showInvoiceDragDrop ? (
                          // Drag and Drop zone for invoice
                          <motion.div
                            key="dragdrop-invoice"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowInvoiceDragDrop(false)
                              }}
                              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white border-2 border-orange-300 rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors shadow-md"
                            >
                              <XIcon className="w-4 h-4 text-orange-600" />
                            </button>
                            <div
                              className={`bg-gradient-to-br ${isInvoiceDragging ? 'from-orange-100 to-orange-50 border-orange-400' : 'from-orange-50 to-orange-25 border-orange-200'} rounded-lg p-8 border-2 border-dashed transition-all cursor-pointer hover:border-orange-300 hover:shadow-lg`}
                              onClick={handleInvoiceDragDropClick}
                              onDragOver={handleInvoiceDragOver}
                              onDragLeave={handleInvoiceDragLeave}
                              onDrop={handleInvoiceDrop}
                            >
                              <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-orange-900 mb-2">
                                    {isInvoiceDragging ? 'Отпустите файл для загрузки' : 'Перетащите инвойс сюда'}
                                  </h4>
                                  <p className="text-sm text-orange-700 mb-1">
                                    или нажмите для выбора файла
                                  </p>
                                  <p className="text-xs text-orange-600">
                                    Excel (.xlsx, .xls), PDF, изображения (макс. 10 МБ)
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : hoveredMethod && specificationMethodDescriptions[hoveredMethod as keyof typeof specificationMethodDescriptions] ? (
                          <motion.div
                            key="description"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-5 border border-indigo-200"
                            onMouseEnter={() => handleMouseEnter(hoveredMethod)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-base font-bold text-indigo-900 mb-2">
                                  {specificationMethodDescriptions[hoveredMethod as keyof typeof specificationMethodDescriptions]?.title}
                                </h4>
                                <p className="text-sm text-indigo-700 leading-relaxed">
                                  {specificationMethodDescriptions[hoveredMethod as keyof typeof specificationMethodDescriptions]?.description}
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                {specificationMethodDescriptions[hoveredMethod as keyof typeof specificationMethodDescriptions]?.benefits?.map((benefit, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-indigo-800">{benefit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="default-info"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">🚀</div>
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-base font-bold text-blue-900 mb-2">Никакой рутины — только автоматизация</h4>
                                  <p className="text-sm text-blue-800 leading-relaxed">
                                    Забудьте про ручной ввод! Выбирайте товары из нашего каталога проверенных GET2B-поставщиков, загружайте готовые Excel-таблицы или просто присылайте инвойсы из Китая и Турции — даже на китайском или турецком языке. Мы всё распознаем и заполним автоматически.
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-blue-700">
                                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Экономия до 90% времени на заполнение спецификаций</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-blue-700">
                                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Не нашли нужный товар? Найдём поставщика — заполните форму!</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Hidden file input for invoice */}
                      <input
                        id="invoice-file-input"
                        type="file"
                        accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleInvoiceFileUpload(file)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : step.number === '03' ? (
            // STEP 3: Receipt Upload (Пополнение агента)
            <div className="p-10 bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Заголовок */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Пополнение агента</h2>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {step.details || 'Загрузите чек или подтверждение оплаты'}
                  </p>
                </div>

                {/* Процесс */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-emerald-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    Как это работает?
                  </h3>

                  <div className="space-y-6">
                    {/* Шаг 1 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        1
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Переведите деньги</h4>
                        <p className="text-gray-600 leading-relaxed">
                          Переведите необходимую сумму на расчётный счёт нашей компании согласно выставленному счёту. Мы работаем по схеме агентского договора.
                        </p>
                      </div>
                    </div>

                    {/* Шаг 2 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        2
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Загрузите чек</h4>
                        <p className="text-gray-600 leading-relaxed mb-3">
                          После перевода загрузите подтверждение оплаты в конструкторе проектов:
                        </p>
                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div>
                              <div className="font-bold text-emerald-900">Поддерживаемые форматы:</div>
                              <div className="text-sm text-emerald-700">PDF, JPG, PNG</div>
                            </div>
                          </div>
                          <div className="text-sm text-emerald-800 space-y-1">
                            <p>• Банковская выписка</p>
                            <p>• Скриншот платежа из мобильного банка</p>
                            <p>• Любой документ, подтверждающий перевод</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Шаг 3 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        3
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Получите подтверждение</h4>
                        <p className="text-gray-600 leading-relaxed">
                          После проверки чека мы подтвердим получение средств и перейдём к оплате поставщику. Вы получите уведомление в личном кабинете.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Важная информация */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-2">Безопасность и прозрачность</h4>
                      <p className="text-blue-800 leading-relaxed">
                        Мы работаем по схеме агентского договора, что обеспечивает полную прозрачность и безопасность сделки. Все операции фиксируются в системе, и вы всегда можете отследить статус в личном кабинете.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-4">
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 h-auto text-lg rounded-xl"
                  >
                    Понятно, начнём работу
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // STEP 1: Left/Right layout (vertical split)
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
              {/* ЛЕВЫЙ БЛОК - ФОРМА ШАГ 1 */}
              <div className="p-10 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-y-auto max-h-[90vh]">
                {submitSuccess ? (
                  // Success screen
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Заявка отправлена!</h3>
                      <p className="text-gray-600">Менеджер свяжется с вами в течение 15 минут</p>
                      <Button onClick={() => {
                        setIsOpen(false)
                        setSubmitSuccess(false)
                        setFormData({
                          name: '', legalName: '', inn: '', kpp: '', ogrn: '', address: '',
                          bankName: '', bankAccount: '', bik: '', correspondentAccount: '',
                          phone: '', email: '', website: '', director: ''
                        })
                      }}>
                        Закрыть
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {/* Основная информация */}
                      <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-blue-900">Основная информация</h3>
                        </div>
                        <div className="space-y-4">
                          {/* Название компании */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-800">
                              Название компании <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleFormChange('name', e.target.value)}
                              className="h-12 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="ООО Ромашка"
                            />
                          </div>

                          {/* Юридическое название */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-zinc-700">
                              Юридическое название <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.legalName}
                              onChange={(e) => handleFormChange('legalName', e.target.value)}
                              className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="Общество с ограниченной ответственностью Ромашка"
                            />
                          </div>

                          {/* ИНН, КПП */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                ИНН <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(10 или 12 цифр)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.inn}
                                onChange={(e) => handleFormChange('inn', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="1234567890"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                КПП <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(9 цифр)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.kpp}
                                onChange={(e) => handleFormChange('kpp', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="123456789"
                              />
                            </div>
                          </div>

                          {/* ОГРН */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-zinc-700">
                              ОГРН <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(13 или 15 цифр)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.ogrn}
                              onChange={(e) => handleFormChange('ogrn', e.target.value)}
                              className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="1234567890123"
                            />
                          </div>

                          {/* Юридический адрес */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-zinc-700">
                              Юридический адрес <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => handleFormChange('address', e.target.value)}
                              className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="г. Москва, ул. Ленина, д. 1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Банковские реквизиты */}
                      <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-green-900">Банковские реквизиты</h3>
                        </div>
                        <div className="space-y-3">
                          {/* Название банка */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-zinc-700">
                              Название банка <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.bankName}
                              onChange={(e) => handleFormChange('bankName', e.target.value)}
                              className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                              placeholder="ПАО Сбербанк"
                            />
                          </div>

                          {/* Расчётный счёт */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-zinc-700">
                              Расчётный счёт <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(20 цифр)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.bankAccount}
                              onChange={(e) => handleFormChange('bankAccount', e.target.value)}
                              className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                              placeholder="40702810000000000000"
                            />
                          </div>

                          {/* БИК, Корр. счёт */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                БИК <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(9 цифр)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.bik}
                                onChange={(e) => handleFormChange('bik', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                placeholder="044525225"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                Корр. счёт <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(20 цифр)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.correspondentAccount}
                                onChange={(e) => handleFormChange('correspondentAccount', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                placeholder="30101810400000000225"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Контактные данные */}
                      <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-purple-900">Контактные данные</h3>
                        </div>
                        <div className="space-y-3">
                          {/* Телефон, Email */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                Телефон <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleFormChange('phone', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="+7 (999) 123-45-67"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                Email
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleFormChange('email', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="info@company.ru"
                              />
                            </div>
                          </div>

                          {/* Веб-сайт, ФИО директора */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                Веб-сайт
                              </label>
                              <input
                                type="text"
                                value={formData.website}
                                onChange={(e) => handleFormChange('website', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="https://company.ru"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-zinc-700">
                                ФИО директора
                              </label>
                              <input
                                type="text"
                                value={formData.director}
                                onChange={(e) => handleFormChange('director', e.target.value)}
                                className="h-11 w-full bg-white border-2 border-gray-300 rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="Иванов Иван Иванович"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Кнопка отправки */}
                      <div className="pt-6">
                        <Button
                          onClick={handleSubmitRegistration}
                          disabled={isSubmitting || !formData.name || !formData.inn || !formData.phone}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Отправка...
                            </>
                          ) : (
                            <>
                              Отправить заявку менеджеру
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ПРАВЫЙ БЛОК - ИНФОРМАЦИЯ О ШАГЕ 1 */}
              <div className="p-10 bg-white overflow-y-auto max-h-[90vh] border-l border-gray-200">
                <div className="max-w-full mx-auto space-y-6">
                  {/* Раз вы уже здесь */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">✨</div>
                      <div>
                        <h4 className="text-base font-bold text-blue-900 mb-2">Раз вы уже здесь</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          Заполните форму выше вручную, или воспользуйтесь <span className="font-bold text-orange-600">OCR-распознаванием</span> — загрузите готовую карточку компании, и система автоматически извлечёт все данные!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Способы заполнения */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Как заполнить?</h3>

                    <div className="grid grid-cols-4 gap-3">
                      {/* Профиль */}
                      <div
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('profile')}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-blue-900 text-sm">Из профиля</span>
                        </div>
                        <p className="text-xs text-blue-700 leading-snug">Автоподстановка данных</p>
                      </div>

                      {/* Шаблон */}
                      <div
                        className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('template')}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-semibold text-green-900 text-sm">Из шаблона</span>
                        </div>
                        <p className="text-xs text-green-700 leading-snug">Готовый шаблон</p>
                      </div>

                      {/* Вручную */}
                      <div
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('manual')}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">Вручную</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-snug">Заполнить вручную</p>
                      </div>

                      {/* Загрузить */}
                      <div
                        className="bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onMouseEnter={() => handleMouseEnter('upload')}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleUploadClick}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-semibold text-orange-900 text-sm">Загрузить</span>
                        </div>
                        <p className="text-xs text-orange-700 leading-snug">OCR распознавание</p>
                      </div>
                    </div>

                    {/* Область с описанием или статусами OCR */}
                    <div className="min-h-[200px]">
                      <AnimatePresence mode="wait">
                        {/* Analyzing status */}
                        {isAnalyzing ? (
                          <motion.div
                            key="analyzing"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-5"
                          >
                            <div className="flex items-center gap-2">
                              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                              <span className="text-blue-800 font-medium">Анализируем документ...</span>
                            </div>
                            <p className="text-sm text-blue-600 mt-2">Пожалуйста, подождите</p>
                          </motion.div>
                        ) : extractedData ? (
                          // Success with extracted data
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-green-800 font-medium">Данные успешно извлечены!</span>
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                              {extractedData.companyName && <p>• Компания: {extractedData.companyName}</p>}
                              {extractedData.inn && <p>• ИНН: {extractedData.inn}</p>}
                              {extractedData.phone && <p>• Телефон: {extractedData.phone}</p>}
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                              <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-800">
                                  <p className="font-semibold mb-1">Данные отправлены на проверку</p>
                                  <p className="leading-relaxed">После проверки компании и одобрения заявки, вам на email придет логин и пароль для входа в систему.</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : ocrError ? (
                          // Error status
                          <motion.div
                            key="error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-red-50 border border-red-200 rounded-lg p-5"
                          >
                            <div className="flex items-center gap-2">
                              <XIcon className="w-5 h-5 text-red-600" />
                              <span className="text-red-800 font-medium">Ошибка анализа</span>
                            </div>
                            <p className="text-sm text-red-600 mt-2">{ocrError}</p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setOcrError('')
                                handleUploadClick()
                              }}
                              className="w-full mt-3"
                            >
                              Попробовать снова
                            </Button>
                          </motion.div>
                        ) : showDragDrop ? (
                          // Drag and Drop zone
                          <motion.div
                            key="dragdrop"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowDragDrop(false)
                              }}
                              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white border-2 border-orange-300 rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors shadow-md"
                            >
                              <XIcon className="w-4 h-4 text-orange-600" />
                            </button>
                            <div
                              className={`bg-gradient-to-br ${isDragging ? 'from-orange-100 to-orange-50 border-orange-400' : 'from-orange-50 to-orange-25 border-orange-200'} rounded-lg p-8 border-2 border-dashed transition-all cursor-pointer hover:border-orange-300 hover:shadow-lg`}
                              onClick={handleDragDropClick}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-orange-900 mb-2">
                                    {isDragging ? 'Отпустите файл для загрузки' : 'Перетащите файл сюда'}
                                  </h4>
                                  <p className="text-sm text-orange-700 mb-1">
                                    или нажмите для выбора файла
                                  </p>
                                  <p className="text-xs text-orange-600">
                                    PDF, JPG, PNG, DOCX (макс. 10 МБ)
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : hoveredMethod && fillMethodDescriptions[hoveredMethod as keyof typeof fillMethodDescriptions] ? (
                          // Description Interface
                          <motion.div
                            key="description"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-5 border border-indigo-200"
                            onMouseEnter={() => handleMouseEnter(hoveredMethod)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-base font-bold text-indigo-900 mb-2">
                                  {fillMethodDescriptions[hoveredMethod as keyof typeof fillMethodDescriptions]?.title}
                                </h4>
                                <p className="text-sm text-indigo-700 leading-relaxed">
                                  {fillMethodDescriptions[hoveredMethod as keyof typeof fillMethodDescriptions]?.description}
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                {fillMethodDescriptions[hoveredMethod as keyof typeof fillMethodDescriptions]?.benefits?.map((benefit, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-indigo-800">{benefit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      {/* Hidden file input */}
                      <input
                        id="ocr-file-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                      />
                    </div>
                  </div>

                  {/* Зачем это нужно */}
                  <div className="space-y-5 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-4">
                      <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="text-base font-semibold text-gray-900 mb-2">Зачем это нужно?</div>
                        <p className="text-base text-gray-600 leading-relaxed">
                          Данные для контрактов и заградительных документов при импорте товаров из Китая и Турции.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Catalog Modal for Step 2 */}
      {step.number === '02' && (
        <CatalogModalLanding
          open={showCatalogModal}
          onClose={() => setShowCatalogModal(false)}
        />
      )}
    </React.Fragment>
  )
}
