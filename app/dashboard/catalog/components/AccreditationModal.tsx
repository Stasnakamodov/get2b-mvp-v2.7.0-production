"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Upload,
  Plus,
  Trash2,
  FileText,
  Building,
  Package,
  Star
} from "lucide-react"

interface AccreditationModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: any
  onSuccess: () => void
}

interface Product {
  id?: string
  name: string
  description: string
  category: string
  price: string
  currency: string
  images: File[]  // Изменяю на File[] для загрузки файлов
  imageNames: string[]  // Добавляю для отображения имен файлов
  certificates: File[]
  certificateNames: string[]
}

interface LegalDocument {
  id?: string
  type: 'business_license' | 'tax_certificate' | 'registration_certificate' | 'other'
  name: string
  file: File | null
  fileName: string
}

export const AccreditationModal: React.FC<AccreditationModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Шаг 1: Проверка профиля
  const [profileData, setProfileData] = useState<any>({})
  const [missingFields, setMissingFields] = useState<string[]>([])

  // Шаг 2: Товары и сертификаты  
  const [products, setProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState<Product>({
    name: '',
    description: '',
    category: '',
    price: '',
    currency: 'USD',
    images: [],
    imageNames: [],
    certificates: [],
    certificateNames: []
  })
  
  // Импорт каталога
  const [catalogFile, setCatalogFile] = useState<File | null>(null)
  const [importedProducts, setImportedProducts] = useState<Product[]>([])
  const [showImportPreview, setShowImportPreview] = useState(false)

  // Шаг 3: Подтверждение юр лица
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([])
  const [companyConfirmation, setCompanyConfirmation] = useState({
    isLegalEntity: false,
    hasRightToRepresent: false,
    confirmAccuracy: false
  })

  useEffect(() => {
    if (isOpen && supplier) {
      setProfileData(supplier)
      checkProfileCompleteness()
      setCurrentStep(1)
    }
  }, [isOpen, supplier])

  const checkProfileCompleteness = () => {
    const required = [
      { field: 'name', label: 'Имя поставщика' },
      { field: 'company_name', label: 'Название компании' },
      { field: 'category', label: 'Категория' },
      { field: 'country', label: 'Страна' },
      { field: 'contact_email', label: 'Email' },
      { field: 'contact_phone', label: 'Телефон' },
      { field: 'contact_person', label: 'Контактное лицо' },
      { field: 'min_order', label: 'Минимальный заказ' },
      { field: 'response_time', label: 'Время ответа' },
      { field: 'established_year', label: 'Год основания' }
    ]

    const missing = required.filter(item => !supplier[item.field] || supplier[item.field] === '')
    setMissingFields(missing.map(item => item.label))
  }

  const updateProfileField = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }))
    // Убираем поле из списка недостающих если оно заполнено
    if (value && value.trim() !== '') {
      const fieldLabels: Record<string, string> = {
        'name': 'Имя поставщика',
        'company_name': 'Название компании', 
        'category': 'Категория',
        'country': 'Страна',
        'contact_email': 'Email',
        'contact_phone': 'Телефон',
        'contact_person': 'Контактное лицо',
        'min_order': 'Минимальный заказ',
        'response_time': 'Время ответа',
        'established_year': 'Год основания'
      }
      setMissingFields((prev: string[]) => prev.filter(label => label !== fieldLabels[field]))
    }
  }

  const addProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.certificates.length > 0) {
      const productWithId = {
        ...newProduct,
        id: `product_${Date.now()}`
      }
      setProducts(prev => [...prev, productWithId])
      setNewProduct({
        name: '',
        description: '',
        category: '',
        price: '',
        currency: 'USD',
        images: [],
        imageNames: [],
        certificates: [],
        certificateNames: []
      })
    }
  }

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const handleProductImageUpload = (files: FileList | null, productId?: string) => {
    if (!files) return

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    )
    
    if (imageFiles.length === 0) {
      alert('Пожалуйста, выберите файлы изображений (JPG, PNG) или PDF')
      return
    }

    const imageNames = imageFiles.map(file => file.name)

    if (productId) {
      // Добавляем изображения к существующему товару
      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? {
                ...product,
                images: [...product.images, ...imageFiles],
                imageNames: [...product.imageNames, ...imageNames]
              }
            : product
        )
      )
    } else {
      // Добавляем изображения к новому товару
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...imageFiles],
        imageNames: [...prev.imageNames, ...imageNames]
      }))
    }
  }

  const handleCertificateUpload = (files: FileList | null, productId?: string) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/')
    )
    
    if (validFiles.length === 0) {
      alert('Пожалуйста, выберите файлы PDF или изображения')
      return
    }

    const fileNames = validFiles.map(file => file.name)

    if (productId) {
      // Добавляем сертификаты к существующему товару
      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? {
                ...product,
                certificates: [...product.certificates, ...validFiles],
                certificateNames: [...product.certificateNames, ...fileNames]
              }
            : product
        )
      )
    } else {
      // Добавляем сертификаты к новому товару
      setNewProduct(prev => ({
        ...prev,
        certificates: [...prev.certificates, ...validFiles],
        certificateNames: [...prev.certificateNames, ...fileNames]
      }))
    }
  }

  const addLegalDocument = () => {
    setLegalDocuments(prev => [...prev, {
      id: Date.now().toString(),
      type: 'other',
      name: '',
      file: null,
      fileName: ''
    }])
  }

  const updateLegalDocument = (id: string, field: string, value: any) => {
    setLegalDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return { ...doc, [field]: value }
      }
      return doc
    }))
  }

  const removeLegalDocument = (id: string) => {
    setLegalDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  // Функции импорта каталога
  const downloadTemplate = () => {
    const template = [
      // Заголовки
      ['Название товара*', 'Описание', 'Категория*', 'Цена', 'Валюта'],
      
      // Примеры товаров (простой формат без кавычек и сложных символов)
      ['Электронные весы промышленные 500кг', 'Высокоточные весы для промышленного использования до 500кг с дисплеем', 'Электроника', '899', 'USD'],
      ['Светодиодные лампы E27 12W', 'Энергосберегающие LED лампы белый свет 4000K', 'Электроника', '8', 'USD'],
      ['Планшеты Android 10 дюймов', 'Планшетные компьютеры с экраном 10.1 дюйма 4GB RAM 64GB память', 'Электроника', '159', 'USD'],
      ['Махровые полотенца банные', 'Полотенца 100% хлопок размер 70x140см плотность 500г на м2', 'Текстиль', '15', 'USD'],
      ['Постельное белье сатин евро', 'Комплект постельного белья из сатина евро размер', 'Текстиль', '45', 'USD'],
      ['Шторы блэкаут готовые', 'Светонепроницаемые шторы с люверсами размер 140x260см', 'Текстиль', '28', 'USD'],
      ['Керамогранит напольный 60x60', 'Износостойкая керамическая плитка класс PEI IV для коммерческих помещений', 'Строительные материалы', '25', 'USD'],
      ['Ламинат влагостойкий 8мм', 'Ламинат класс износостойкости 33 толщина 8мм с фаской', 'Строительные материалы', '18', 'USD'],
      ['Кухонная посуда нержавейка набор', 'Набор кастрюль и сковородок из пищевой нержавеющей стали 7 предметов', 'Товары для дома', '120', 'USD'],
      ['Пылесосы роботы с Wi-Fi', 'Роботы-пылесосы с влажной уборкой Wi-Fi управление', 'Товары для дома', '199', 'USD'],
      ['Медицинские маски одноразовые', 'Трёхслойные медицинские маски с фильтром упаковка 50 штук', 'Медицинские товары', '12', 'USD'],
      ['Термометры бесконтактные', 'Инфракрасные термометры для измерения температуры тела', 'Медицинские товары', '25', 'USD'],
      ['Аккумуляторы автомобильные 60Ah', 'Свинцово-кислотные аккумуляторы 12V 60Ah для легковых авто', 'Автотовары', '85', 'USD'],
      ['Автошины летние R16', 'Летние шины размер 205 на 55 R16 для легковых автомобилей', 'Автотовары', '68', 'USD'],
      ['Стрейч-пленка для упаковки', 'Прозрачная стрейч-пленка для ручной упаковки толщина 20мкм', 'Упаковочные материалы', '45', 'USD'],
      ['Садовые инструменты профессиональные', 'Комплект лопата штыковая секатор грабли совок рукоятки из дерева', 'Садовые товары', '65', 'USD'],
      ['Спортивная одежда для фитнеса', 'Комплекты эластичной одежды для занятий спортом из дышащих материалов', 'Спорт и отдых', '35', 'USD'],
      ['Коврики для йоги противоскользящие', 'Коврики для йоги размер 183x61см толщина 6мм материал TPE', 'Спорт и отдых', '22', 'USD']
    ]
    
    // Создаем CSV с точкой с запятой как разделителем (стандарт для Excel в России)
    const csvContent = template.map(row => row.join(';')).join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'Шаблон_каталога_товаров.csv'
    link.click()
  }

  const handleCatalogUpload = async (file: File) => {
    setCatalogFile(file)
    
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      parseCSVFile(file)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      alert('📊 Excel файлы пока не поддерживаются.\n\n💡 Сохраните файл как CSV:\n1. Файл → Сохранить как\n2. Выберите тип "CSV (разделители - запятые)"\n3. Загрузите полученный CSV файл')
    } else {
      alert('📁 Поддерживаются только CSV файлы.\n\n🔽 Скачайте готовый шаблон с примерами товаров и заполните его в Excel.')
    }
  }

  const parseCSVFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result as string
      const allLines = text.split('\n')
      
      // Фильтруем строки: убираем пустые и комментарии (начинающиеся с #)
      const lines = allLines.filter(line => {
        const trimmed = line.trim()
        return trimmed && !trimmed.startsWith('#')
      })
      
      if (lines.length < 2) {
        alert('Файл должен содержать заголовки и минимум одну строку с данными')
        return
      }

      // Автоматически определяем разделитель (точка с запятой или запятая)
      const separator = lines[0].includes(';') ? ';' : ','
      console.log('Обнаружен разделитель:', separator)

      const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''))
      const dataLines = lines.slice(1)
      
      const parsedProducts: Product[] = []
      
      dataLines.forEach((line, index) => {
        if (index === 0 || !line.trim()) return // Пропускаем заголовок и пустые строки
        
        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          
          if (char === '"') {
            inQuotes = !inQuotes
          } else if ((char === ',' || char === ';') && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        
        // Добавляем последнее значение
        if (current || values.length > 0) {
          if (current.trim() === '"' || current.trim() === '') {
            // Пустое значение в кавычках или просто пустое
            if (current.includes('"')) {
              current = ''
            }
          }
          values.push(current.trim())
        }
        
        // Удаляем кавычки из значений
        const cleanValues = values.map(v => v.replace(/^"(.*)"$/, '$1'))
        
        if (cleanValues.length >= 3 && cleanValues[0] && cleanValues[2]) { // Название и категория обязательны
          parsedProducts.push({
            id: `imported_${Date.now()}_${index}`,
            name: cleanValues[0] || '',
            description: cleanValues[1] || '',
            category: cleanValues[2] || '',
            price: cleanValues[3] || '',
            currency: cleanValues[4] || 'USD',
            images: [],
            imageNames: [],
            certificates: [],
            certificateNames: []
          })
        }
      })

      if (parsedProducts.length > 0) {
        setImportedProducts(parsedProducts)
        setShowImportPreview(true)
      } else {
        alert('Не удалось импортировать товары. Проверьте формат файла и убедитесь, что заполнены обязательные поля (название и категория).')
      }
    }
    
    reader.readAsText(file, 'UTF-8')
  }

  const confirmImport = () => {
    const importCount = importedProducts.length
    setProducts(prev => [...prev, ...importedProducts])
    setImportedProducts([])
    setShowImportPreview(false)
    setCatalogFile(null)
    
    // Более информативное сообщение
    const message = `🎉 Успешно импортировано ${importCount} товаров!\n\n📷 Добавьте изображения товаров (рекомендуется)\n📋 Добавьте сертификаты к каждому товару (обязательно)\n\n⚠️ Без сертификатов нельзя перейти к следующему шагу!`
    alert(message)
  }

  const cancelImport = () => {
    setImportedProducts([])
    setShowImportPreview(false)
    setCatalogFile(null)
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return missingFields.length === 0
      case 2:
        // Минимум 1 товар и у КАЖДОГО товара есть сертификаты
        const hasProducts = products.length >= 1
        const allHaveCertificates = products.every(p => p.certificates.length > 0)
        
        // Отладочная информация для диагностики
        console.log('🔍 Диагностика шаг 2:', {
          products_count: products.length,
          has_products: hasProducts,
          products_with_certificates: products.map(p => ({
            name: p.name,
            certificates_count: p.certificates.length,
            certificateNames: p.certificateNames
          })),
          all_have_certificates: allHaveCertificates,
          can_proceed: hasProducts && allHaveCertificates
        })
        
        return hasProducts && allHaveCertificates
      case 3:
        return Object.values(companyConfirmation).every(v => v === true) && 
               legalDocuments.length > 0 && 
               legalDocuments.every(doc => doc.file && doc.name)
      default:
        return false
    }
  }

  const getStepValidationMessage = () => {
    switch (currentStep) {
      case 1:
        if (missingFields.length > 0) {
          return `Заполните обязательные поля: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`
        }
        return ''
      case 2:
        if (products.length === 0) {
          return 'Добавьте минимум 1 товар'
        }
        const productsWithoutCerts = products.filter(p => p.certificates.length === 0)
        if (productsWithoutCerts.length > 0) {
          return `${productsWithoutCerts.length} товаров без сертификатов (красные блоки)`
        }
        return ''
      case 3:
        if (!Object.values(companyConfirmation).every(v => v === true)) {
          return 'Подтвердите все условия'
        }
        if (legalDocuments.length === 0) {
          return 'Загрузите юридические документы'
        }
        return ''
      default:
        return ''
    }
  }

  const submitAccreditation = async () => {
    setLoading(true)
    
    try {
      // Формируем данные для отправки
      const formData = new FormData()
      formData.append('supplier_id', supplier.id)
      formData.append('supplier_type', 'profile')
      formData.append('profile_data', JSON.stringify(profileData))
      formData.append('products', JSON.stringify(products.map(p => ({
        ...p,
        certificates: p.certificateNames, // Только имена файлов сертификатов
        images: p.imageNames // Только имена файлов изображений
      }))))
      formData.append('legal_confirmation', JSON.stringify(companyConfirmation))

      // Добавляем файлы изображений товаров
      products.forEach((product, pIndex) => {
        product.images.forEach((image, iIndex) => {
          formData.append(`product_${pIndex}_image_${iIndex}`, image)
        })
      })

      // Добавляем файлы сертификатов
      products.forEach((product, pIndex) => {
        product.certificates.forEach((cert, cIndex) => {
          formData.append(`product_${pIndex}_cert_${cIndex}`, cert)
        })
      })

      // Добавляем юридические документы
      legalDocuments.forEach((doc, index) => {
        if (doc.file) {
          formData.append(`legal_doc_${index}`, doc.file)
          formData.append(`legal_doc_${index}_type`, doc.type)
          formData.append(`legal_doc_${index}_name`, doc.name)
        }
      })

      const response = await fetch('/api/catalog/submit-accreditation', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Ошибка подачи заявки на аккредитацию')
      }

      onSuccess()
      onClose()
      
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка при подаче заявки на аккредитацию')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Проверка профиля поставщика</h3>
      </div>

      {missingFields.length > 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Требуется заполнить следующие поля:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-yellow-700">
            {missingFields.map(field => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Все обязательные поля заполнены</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Имя поставщика *</Label>
          <Input
            value={profileData.name || ''}
            onChange={(e) => updateProfileField('name', e.target.value)}
            placeholder="Введите имя поставщика"
          />
        </div>
        <div>
          <Label>Название компании *</Label>
          <Input
            value={profileData.company_name || ''}
            onChange={(e) => updateProfileField('company_name', e.target.value)}
            placeholder="Введите название компании"
          />
        </div>
        <div>
          <Label>Email *</Label>
          <Input
            type="email"
            value={profileData.contact_email || ''}
            onChange={(e) => updateProfileField('contact_email', e.target.value)}
            placeholder="email@company.com"
          />
        </div>
        <div>
          <Label>Телефон *</Label>
          <Input
            value={profileData.contact_phone || ''}
            onChange={(e) => updateProfileField('contact_phone', e.target.value)}
            placeholder="+86 xxx xxxx xxxx"
          />
        </div>
        <div>
          <Label>Контактное лицо *</Label>
          <Input
            value={profileData.contact_person || ''}
            onChange={(e) => updateProfileField('contact_person', e.target.value)}
            placeholder="Имя контактного лица"
          />
        </div>
        <div>
          <Label>Год основания *</Label>
          <Input
            type="number"
            value={profileData.established_year || ''}
            onChange={(e) => updateProfileField('established_year', e.target.value)}
            placeholder="2010"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Товары и сертификаты</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Для аккредитации необходимо добавить минимум 1 товар с соответствующими сертификатами качества
        </p>
        {products.length > 0 && (
          <div className="mt-2 text-sm text-blue-700">
            📊 Статистика: {products.length} товаров, {products.filter(p => p.certificates.length > 0).length} с сертификатами
            {products.filter(p => p.certificates.length === 0).length > 0 && (
              <span className="text-amber-600 ml-2">
                ⚠️ {products.filter(p => p.certificates.length === 0).length} товаров без сертификатов
              </span>
            )}
          </div>
        )}
      </div>

      {/* Секция импорта каталога */}
      <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🚀</div>
          <h4 className="text-xl font-bold text-green-800 mb-2">Массовый импорт каталога</h4>
          <p className="text-sm text-green-700 max-w-2xl mx-auto">
            Загрузите до <strong>1000 товаров</strong> одним CSV файлом за 30 секунд! 
            После импорта сможете добавить изображения и сертификаты к каждому товару.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="flex flex-col items-center">
            <Button 
              onClick={downloadTemplate}
              variant="outline"
              className="bg-white border-2 border-green-500 text-green-700 hover:bg-green-100 px-6 py-3 text-sm font-medium"
            >
              📥 Скачать шаблон CSV
            </Button>
            <span className="text-xs text-gray-500 mt-1">20+ примеров товаров</span>
          </div>
          
          <div className="text-2xl text-gray-400 hidden md:block">→</div>
          
          <div className="flex-1 max-w-md">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-white hover:bg-blue-50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCatalogUpload(file)
                }}
                className="hidden"
                id="catalog-upload"
              />
              <label htmlFor="catalog-upload" className="cursor-pointer block text-center">
                <div className="text-3xl mb-2">📂</div>
                <div className="text-sm font-medium text-blue-700">Выберите CSV файл</div>
                <div className="text-xs text-gray-500 mt-1">Или перетащите файл сюда</div>
              </label>
            </div>
            {catalogFile && (
              <div className="text-sm text-green-600 mt-2 text-center font-medium">
                ✅ Файл выбран: {catalogFile.name}
              </div>
            )}
          </div>
        </div>

                 <div className="mt-4 text-center space-y-2">
           <div className="inline-flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-1 rounded-full border">
             ⚡ Формат: CSV с разделителем ";" • Максимум: 10 МБ • Включает 18 примеров товаров
           </div>
           <div className="text-xs text-blue-600">
             💡 <strong>Совет:</strong> Файл автоматически откроется в Excel с правильными столбцами
           </div>
         </div>
      </div>

      {/* Предпросмотр импортированных товаров */}
      {showImportPreview && (
        <div className="border-2 border-amber-300 rounded-lg p-6 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">👀</div>
              <div>
                <h4 className="text-lg font-bold text-amber-800">
                  Предпросмотр импорта
                </h4>
                <p className="text-sm text-amber-600">
                  Найдено <strong>{importedProducts.length} товаров</strong> готовых к импорту
                </p>
              </div>
            </div>
            <div className="bg-amber-100 px-3 py-1 rounded-full text-xs font-medium text-amber-800">
              📦 {importedProducts.length} товаров
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="max-h-64 overflow-y-auto space-y-3">
              {importedProducts.slice(0, 8).map((product, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {product.category}
                      </span>
                      {product.price && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          {product.price} {product.currency}
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {product.description}
                      </div>
                    )}
                  </div>
                  <div className="text-green-500 text-sm">✓</div>
                </div>
              ))}
              
              {importedProducts.length > 8 && (
                <div className="text-center py-3 border-t border-dashed border-gray-300">
                  <div className="text-sm text-gray-500 font-medium">
                    🔽 И еще {importedProducts.length - 8} товаров будут импортированы
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Прокрутите вниз после импорта, чтобы увидеть все товары
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={confirmImport} 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base font-medium shadow-lg"
            >
              🚀 Импортировать все {importedProducts.length} товаров
            </Button>
            <Button 
              onClick={cancelImport} 
              variant="outline" 
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-3"
            >
              ❌ Отменить импорт
            </Button>
          </div>

          <div className="mt-4 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              ⚠️ После импорта добавьте изображения и сертификаты к каждому товару
            </div>
            <div className="text-xs text-gray-500">
              📷 Изображения товаров (рекомендуется) • 📋 Сертификаты (обязательно)
            </div>
          </div>
        </div>
      )}

              {/* Список добавленных товаров */}
        {products.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Добавленные товары ({products.length}):</h4>
              <div className="text-xs text-gray-500">
                🔴 Красный - нужны сертификаты • ⚪ Серый - готов
              </div>
            </div>
            {products.map(product => (
              <div key={product.id} className={`border rounded-lg p-3 ${
                product.certificates.length === 0 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium">{product.name}</h5>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    {product.price && (
                      <p className="text-sm text-gray-500">{product.price} {product.currency}</p>
                    )}
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Изображений: {product.images.length}</p>
                      <p>
                        Сертификатов: {product.certificates.length}
                        {product.certificates.length === 0 && (
                          <span className="text-red-500 ml-2">⚠️ Требуются сертификаты</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeProduct(product.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Добавление изображений и сертификатов к существующему товару */}
                <div className="border-t pt-2 space-y-2">
                  {/* Загрузка изображений товара */}
                  <div className="border-2 border-dashed border-blue-300 rounded p-2 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.png,.jpeg"
                      onChange={(e) => handleProductImageUpload(e.target.files, product.id)}
                      className="hidden"
                      id={`product-${product.id}-images`}
                    />
                    <label htmlFor={`product-${product.id}-images`} className="cursor-pointer">
                      <Upload className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                      <p className="text-xs text-blue-600">📷 Добавить изображения товара</p>
                    </label>
                  </div>
                  
                  {/* Загрузка сертификатов */}
                  <div className="border-2 border-dashed border-gray-300 rounded p-2 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={(e) => handleCertificateUpload(e.target.files, product.id)}
                      className="hidden"
                      id={`product-${product.id}-certificates`}
                    />
                    <label htmlFor={`product-${product.id}-certificates`} className="cursor-pointer">
                      <Upload className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600">
                        📋 {product.certificates.length === 0 ? 'Загрузить сертификаты' : 'Добавить еще сертификаты'}
                      </p>
                    </label>
                  </div>
                </div>
                
                {/* Список изображений товара */}
                {product.imageNames.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="text-xs font-medium text-blue-600 mb-1">📷 Изображения товара:</p>
                    {product.imageNames.map((name, index) => (
                      <div key={index} className="text-xs text-blue-600 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {name}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Список сертификатов */}
                {product.certificateNames.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">📋 Сертификаты:</p>
                    {product.certificateNames.map((name, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {/* Форма добавления нового товара */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Добавить товар</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <Label>Название товара *</Label>
            <Input
              value={newProduct.name}
              onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Введите название товара"
            />
          </div>
          <div>
            <Label>Категория *</Label>
            <Input
              value={newProduct.category}
              onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Категория товара"
            />
          </div>
        </div>
        <div className="mb-3">
          <Label>Описание</Label>
          <Textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Описание товара"
            rows={2}
          />
        </div>
        
        {/* Загрузка изображений товара */}
        <div className="mb-3">
          <Label>Изображения товара</Label>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
            <input
              type="file"
              multiple
              accept=".jpg,.png,.jpeg"
              onChange={(e) => handleProductImageUpload(e.target.files)}
              className="hidden"
              id="new-product-images"
            />
            <label htmlFor="new-product-images" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-blue-400 mb-2" />
              <p className="text-sm text-blue-600">
                📷 Загрузить изображения товара (JPG, PNG)
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Рекомендуется: фото продукции, упаковки, маркировки
              </p>
            </label>
            {newProduct.imageNames.length > 0 && (
              <div className="mt-2 text-left">
                <p className="text-xs font-medium text-blue-600 mb-1">📷 Выбранные изображения:</p>
                {newProduct.imageNames.map((name, index) => (
                  <div key={index} className="text-xs text-blue-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Загрузка сертификатов */}
        <div className="mb-3">
          <Label>Сертификаты *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.png,.jpeg"
              onChange={(e) => handleCertificateUpload(e.target.files)}
              className="hidden"
              id="new-product-certificates"
            />
            <label htmlFor="new-product-certificates" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                📋 Загрузить сертификаты (PDF, JPG, PNG)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Обязательно: сертификаты качества, соответствия, безопасности
              </p>
            </label>
            {newProduct.certificateNames.length > 0 && (
              <div className="mt-2 text-left">
                <p className="text-xs font-medium text-gray-600 mb-1">📋 Выбранные сертификаты:</p>
                {newProduct.certificateNames.map((name, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button 
          onClick={addProduct}
          disabled={!newProduct.name || !newProduct.category || newProduct.certificates.length === 0}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить товар
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Подтверждение юридического лица</h3>
      </div>

      {/* Юридические документы */}
      <div className="space-y-3">
        <h4 className="font-medium">Юридические документы</h4>
        {legalDocuments.map(doc => (
          <div key={doc.id} className="border rounded-lg p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <Label>Тип документа</Label>
                <select
                  value={doc.type}
                  onChange={(e) => updateLegalDocument(doc.id!, 'type', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="business_license">Бизнес лицензия</option>
                  <option value="tax_certificate">Налоговый сертификат</option>
                  <option value="registration_certificate">Свидетельство о регистрации</option>
                  <option value="other">Другой документ</option>
                </select>
              </div>
              <div>
                <Label>Название документа</Label>
                <Input
                  value={doc.name}
                  onChange={(e) => updateLegalDocument(doc.id!, 'name', e.target.value)}
                  placeholder="Название документа"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.png,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      updateLegalDocument(doc.id!, 'file', file)
                      updateLegalDocument(doc.id!, 'fileName', file?.name || '')
                    }}
                    className="w-full text-sm border rounded px-2 py-2"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLegalDocument(doc.id!)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <Button onClick={addLegalDocument} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Добавить документ
        </Button>
      </div>

      {/* Подтверждения */}
      <div className="space-y-3 mt-6">
        <h4 className="font-medium">Подтверждения</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={companyConfirmation.isLegalEntity}
              onChange={(e) => setCompanyConfirmation(prev => ({ ...prev, isLegalEntity: e.target.checked }))}
            />
            <span className="text-sm">Подтверждаю, что являюсь официальным юридическим лицом</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={companyConfirmation.hasRightToRepresent}
              onChange={(e) => setCompanyConfirmation(prev => ({ ...prev, hasRightToRepresent: e.target.checked }))}
            />
            <span className="text-sm">Подтверждаю право представлять данную компанию</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={companyConfirmation.confirmAccuracy}
              onChange={(e) => setCompanyConfirmation(prev => ({ ...prev, confirmAccuracy: e.target.checked }))}
            />
            <span className="text-sm">Подтверждаю достоверность предоставленной информации</span>
          </label>
        </div>
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-bold">Заявка на аккредитацию</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Степпер */}
        <div className="flex items-center justify-center p-6 border-b bg-gray-50">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step}
              </div>
              <div className={`
                text-sm font-medium ml-2
                ${currentStep >= step ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {step === 1 ? 'Профиль' : step === 2 ? 'Товары' : 'Документы'}
              </div>
              {step < 3 && (
                <div className={`
                  w-12 h-0.5 mx-4
                  ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Контент шага */}
        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Кнопки */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : onClose()}
          >
            {currentStep > 1 ? 'Назад' : 'Отмена'}
          </Button>
          
          <div className="flex flex-col items-end gap-2">
            {/* Сообщение о валидации */}
            {!canProceedToNextStep() && getStepValidationMessage() && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded border border-red-200">
                ⚠️ {getStepValidationMessage()}
              </div>
            )}
            
            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceedToNextStep()}
                >
                  Далее
                </Button>
              ) : (
                <Button 
                  onClick={submitAccreditation}
                  disabled={!canProceedToNextStep() || loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'Отправка...' : 'Подать заявку на аккредитацию'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 