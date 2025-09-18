'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building, 
  Package, 
  FileText, 
  Upload, 
  Trash2, 
  Plus,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react'

// Интерфейсы
interface AccreditationModalV2Props {
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
  images: File[]
  imageNames: string[]
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

export const AccreditationModalV2: React.FC<AccreditationModalV2Props> = ({
  isOpen,
  onClose,
  supplier,
  onSuccess
}) => {
  // States
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Profile data
  const [profileData, setProfileData] = useState<any>({})
  const [missingFields, setMissingFields] = useState<string[]>([])
  
  // Products
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
  
  // CSV Import
  const [catalogFile, setCatalogFile] = useState<File | null>(null)
  const [importedProducts, setImportedProducts] = useState<Product[]>([])
  const [showImportPreview, setShowImportPreview] = useState(false)
  
  // Legal
  const [companyConfirmation, setCompanyConfirmation] = useState<{
    isLegalEntity: boolean
    hasRightToRepresent: boolean
    confirmAccuracy: boolean
  }>({
    isLegalEntity: false,
    hasRightToRepresent: false,
    confirmAccuracy: false
  })
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([])

  // Проверка профиля при открытии
  useEffect(() => {
    if (isOpen && supplier) {
      checkProfileCompleteness()
    }
  }, [isOpen, supplier])

  const checkProfileCompleteness = () => {
    const required = ['name', 'company_name', 'country', 'category']
    const missing: string[] = []
    
    required.forEach(field => {
      if (!supplier[field] || supplier[field].toString().trim() === '') {
        missing.push(field)
      }
    })
    
    setMissingFields(missing)
    setProfileData(supplier)
  }

  // Step validation
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return missingFields.length === 0
      case 2:
        // ВАРИАНТ 1: Есть готовые товары в списке с сертификатами
        const hasReadyProducts = products.length >= 1 && products.some(p => p.certificates.length > 0)
        
        // ВАРИАНТ 2: Или текущий новый товар полностью заполнен (но еще не добавлен)
        const hasFilledNewProduct = newProduct.name && newProduct.category && newProduct.certificates.length > 0
        
        return hasReadyProducts || hasFilledNewProduct
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
          return `Заполните: ${missingFields.join(', ')}`
        }
        return ''
      case 2:
        const hasReadyProducts = products.length >= 1 && products.some(p => p.certificates.length > 0)
        const hasFilledNewProduct = newProduct.name && newProduct.category && newProduct.certificates.length > 0
        
        if (!hasReadyProducts && !hasFilledNewProduct) {
          if (!newProduct.name) return 'Заполните название товара'
          if (!newProduct.category) return 'Заполните категорию товара'
          if (newProduct.certificates.length === 0) return 'Загрузите сертификаты товара'
          return 'Заполните товар или добавьте из списка'
        }
        return ''
      case 3:
        if (!Object.values(companyConfirmation).every(v => v === true)) {
          return 'Подтвердите все условия'
        }
        if (legalDocuments.length === 0) {
          return 'Загрузите документы'
        }
        return ''
      default:
        return ''
    }
  }

  // Product management
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

  // File uploads
  const handleProductImageUpload = (files: FileList | null, productId?: string) => {
    if (!files) return

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length === 0) {
      alert('Выберите файлы изображений (JPG, PNG)')
      return
    }

    const imageNames = imageFiles.map(file => file.name)

    if (productId) {
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
      alert('Выберите файлы PDF или изображения')
      return
    }

    const fileNames = validFiles.map(file => file.name)



    if (productId) {
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
        // Для нового товара
        setNewProduct(prev => ({
          ...prev,
          certificates: [...prev.certificates, ...validFiles],
          certificateNames: [...prev.certificateNames, ...fileNames]
        }))
      }
  }

  // CSV Import
  const downloadTemplate = () => {
    const template = [
      // Заголовки
      ['Название товара*', 'Описание', 'Категория*', 'Цена', 'Валюта'],
      
      // Примеры товаров
      ['LED лампа 12W', 'Энергосберегающая лампа белый свет 4000K', 'Электроника', '8', 'USD'],
      ['Махровое полотенце', '100% хлопок размер 70x140см', 'Текстиль', '15', 'USD'],
      ['Стальные трубы', 'Конструкционные трубы диаметр 50мм', 'Строительство', '25', 'USD'],
      ['Планшеты Android 10 дюймов', 'Планшетные компьютеры с экраном 10.1 дюйма 4GB RAM 64GB память', 'Электроника', '159', 'USD'],
      ['Керамогранит напольный 60x60', 'Износостойкая керамическая плитка класс PEI IV для коммерческих помещений', 'Строительные материалы', '25', 'USD'],
      ['Пылесосы роботы с Wi-Fi', 'Роботы-пылесосы с влажной уборкой Wi-Fi управление', 'Товары для дома', '199', 'USD']
    ]
    
    // Создаем CSV с точкой с запятой как разделителем (стандарт для Excel в России)
    const csvContent = template.map(row => row.join(';')).join('\n')
    
    // Добавляем BOM для правильной кодировки кириллицы в Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Шаблон_каталога_товаров.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCatalogUpload = async (file: File) => {
    setCatalogFile(file)
    parseCSVFile(file)
  }

  const parseCSVFile = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV файл должен содержать минимум заголовок и одну строку данных')
        return
      }

      const dataLines = lines.slice(1)
      const parsedProducts: Product[] = []
      
      dataLines.forEach((line, index) => {
        if (!line.trim()) return
        
        const values = line.split(';').map(v => v.trim().replace(/^"(.*)"$/, '$1'))
        
        if (values.length >= 3 && values[0] && values[2]) {
          parsedProducts.push({
            id: `imported_${Date.now()}_${index}`,
            name: values[0] || '',
            description: values[1] || '',
            category: values[2] || '',
            price: values[3] || '',
            currency: values[4] || 'USD',
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
        alert('Не удалось импортировать товары. Проверьте формат файла.')
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
    
    alert(`🎉 Импортировано ${importCount} товаров!\n\n📷 Добавьте изображения\n📋 Добавьте сертификаты (обязательно)`)
  }

  const cancelImport = () => {
    setImportedProducts([])
    setShowImportPreview(false)
    setCatalogFile(null)
  }

  // Legal documents
  const addLegalDocument = () => {
    const newDoc: LegalDocument = {
      id: `doc_${Date.now()}`,
      type: 'business_license',
      name: '',
      file: null,
      fileName: ''
    }
    setLegalDocuments(prev => [...prev, newDoc])
  }

  const updateLegalDocument = (id: string, field: string, value: any) => {
    setLegalDocuments(prev => 
      prev.map(doc => 
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    )
  }

  const removeLegalDocument = (id: string) => {
    setLegalDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  // Submit
  const submitAccreditation = async () => {
    setLoading(true)
    
    try {
      // Подготавливаем все товары для отправки
      let allProducts = [...products]
      
      // Если есть заполненный новый товар, добавляем его
      if (newProduct.name && newProduct.category && newProduct.certificates.length > 0) {
        const productWithId = {
          ...newProduct,
          id: `product_${Date.now()}`
        }
        allProducts.push(productWithId)
      }
      
      const formData = new FormData()
      formData.append('supplier_id', supplier.id)
      formData.append('supplier_type', 'profile')
      formData.append('profile_data', JSON.stringify(profileData))
      const productsToSend = allProducts.map(p => ({
        ...p,
        certificates: p.certificateNames || p.certificates,
        images: p.imageNames || p.images
      }))
      
      console.log('📦 [AccreditationModal] Товары для отправки:', productsToSend)
      console.log('📦 [AccreditationModal] Количество товаров:', productsToSend.length)
      
      formData.append('products', JSON.stringify(productsToSend))
      formData.append('legal_confirmation', JSON.stringify(companyConfirmation))

      // Добавляем файлы изображений
      allProducts.forEach((product, pIndex) => {
        product.images.forEach((image, iIndex) => {
          formData.append(`product_${pIndex}_image_${iIndex}`, image)
        })
      })

      // Добавляем файлы сертификатов
      allProducts.forEach((product, pIndex) => {
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

      // Определяем базовый URL для API
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiUrl = `${baseUrl}/api/catalog/submit-accreditation`;
      
      console.log('🌐 [AccreditationModal] Отправляем запрос на:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ [AccreditationModal] API Error:', response.status, errorData)
        throw new Error(`Ошибка подачи заявки: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('✅ [AccreditationModal] Успешно:', result)
      
      onSuccess()
      onClose()
      
    } catch (error) {
      console.error('❌ [AccreditationModal] Ошибка:', error)
      
      let errorMessage = 'Неизвестная ошибка';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Ошибка сети: не удалось подключиться к серверу. Проверьте подключение к интернету.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Ошибка при подаче заявки на аккредитацию: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black max-w-6xl w-full h-[95vh] my-4 flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-black p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-50">
                <Star className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h2 className="text-3xl font-light text-black tracking-wide">
                  Аккредитация поставщика
                </h2>
                <div className="mt-2 mb-1">
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 text-xs uppercase tracking-wider font-medium border border-orange-300">
                    ⭐ Подача заявки на аккредитацию
                  </span>
                </div>
                <div className="w-24 h-0.5 bg-black mt-2"></div>
                <p className="text-gray-600 mt-3 font-light">
                  {supplier?.name || 'Поставщик без названия'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="border-2 border-black text-black px-4 py-2 hover:bg-black hover:text-white transition-all text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold ${
                  currentStep === step ? 'bg-black text-white' : 
                  currentStep > step ? 'bg-green-200 text-black' : 'bg-white text-black'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                <div className="ml-2 text-sm font-medium">
                  {step === 1 ? 'Профиль' : step === 2 ? 'Товары' : 'Документы'}
                </div>
                {step < 3 && <div className="ml-4 w-8 h-0.5 bg-black"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Проверка профиля поставщика
              </h3>

              {missingFields.length > 0 ? (
                <div className="border-2 border-red-300 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Требуется заполнить:</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {missingFields.map(field => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="border-2 border-green-300 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Все обязательные поля заполнены</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Название поставщика *</Label>
                  <Input
                    value={profileData.name || ''}
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, name: e.target.value }))}
                    className="border-2 border-black"
                  />
                </div>
                <div>
                  <Label>Название компании *</Label>
                  <Input
                    value={profileData.company_name || ''}
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, company_name: e.target.value }))}
                    className="border-2 border-black"
                  />
                </div>
                <div>
                  <Label>Страна *</Label>
                  <Input
                    value={profileData.country || ''}
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, country: e.target.value }))}
                    className="border-2 border-black"
                  />
                </div>
                <div>
                  <Label>Категория *</Label>
                  <Input
                    value={profileData.category || ''}
                    readOnly
                    className="border-2 border-gray-300 bg-gray-100 text-gray-600"
                    title="Категория задана в профиле поставщика"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Категория определена в профиле поставщика
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Товары и сертификаты
              </h3>

              <div className="border-2 border-blue-300 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Два способа продолжить:</strong><br/>
                  1️⃣ Заполните форму ниже (название + категория + сертификат) и нажмите "Далее"<br/>
                  2️⃣ Или добавьте товары в список нажав "Добавить товар", а потом "Далее"
                </p>
                {products.length > 0 && (
                  <div className="mt-2 text-sm text-blue-700">
                    📊 В списке: {products.length} товаров • {products.filter(p => p.certificates.length > 0).length} с сертификатами • {products.filter(p => p.certificates.length === 0).length} без сертификатов
                  </div>
                )}
                {newProduct.name && newProduct.category && newProduct.certificates.length > 0 && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                    ✅ Товар готов! Можете нажать "Далее" или сначала "Добавить товар" чтобы сохранить его в список
                  </div>
                )}
              </div>

              {/* CSV Import */}
              <div className="border-2 border-green-300 p-6 bg-green-50">
                <h4 className="text-lg font-bold text-green-800 mb-2">🚀 Массовый импорт</h4>
                <p className="text-sm text-green-700 mb-4">
                  Загрузите до 1000 товаров одним CSV файлом за 30 секунд
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={downloadTemplate}
                    variant="outline"
                    className="border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
                  >
                    📥 Скачать шаблон
                  </Button>
                  
                  <div>
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
                    <label 
                      htmlFor="catalog-upload" 
                      className="border-2 border-blue-600 bg-white text-blue-700 px-4 py-2 hover:bg-blue-600 hover:text-white transition-all cursor-pointer inline-block"
                    >
                      📂 Выбрать CSV файл
                    </label>
                  </div>
                </div>
              </div>

              {/* Import Preview */}
              {showImportPreview && (
                <div className="border-2 border-amber-300 bg-amber-50 p-6">
                  <h4 className="text-lg font-bold text-amber-800 mb-4">
                    👀 Предпросмотр: {importedProducts.length} товаров
                  </h4>
                  
                  <div className="bg-white border-2 border-black p-4 mb-4 max-h-60 overflow-y-auto">
                    {importedProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 border-b last:border-b-0">
                        <div className="w-6 h-6 bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.category}</div>
                        </div>
                      </div>
                    ))}
                    {importedProducts.length > 5 && (
                      <div className="text-center text-sm text-gray-500 mt-2">
                        ...и еще {importedProducts.length - 5} товаров
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={confirmImport}
                      className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600"
                    >
                      🚀 Импортировать все
                    </Button>
                    <Button 
                      onClick={cancelImport}
                      variant="outline"
                      className="border-2 border-gray-600"
                    >
                      ❌ Отменить
                    </Button>
                  </div>
                </div>
              )}

              {/* Products List */}
              {products.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center justify-between">
                    <span>Добавленные товары ({products.length})</span>
                    <span className="text-sm text-gray-500">
                      🔴 Красный - нужны сертификаты • ⚪ Серый - готов
                    </span>
                  </h4>
                  
                  {products.map(product => (
                    <div key={product.id} className={`border-2 p-4 ${
                      product.certificates.length === 0 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-black bg-white'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-bold">{product.name}</h5>
                          <p className="text-sm text-gray-600">{product.category}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            📷 Изображений: {product.images.length} • 📋 Сертификатов: {product.certificates.length}
                            {product.certificates.length === 0 && (
                              <span className="text-red-600 ml-2 font-medium">⚠️ Требуются сертификаты</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeProduct(product.id!)}
                          className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Изображения */}
                        <div className="border-2 border-blue-300 border-dashed p-3 text-center">
                          <input
                            type="file"
                            multiple
                            accept=".jpg,.png,.jpeg"
                            onChange={(e) => handleProductImageUpload(e.target.files, product.id)}
                            className="hidden"
                            id={`product-${product.id}-images`}
                          />
                          <label htmlFor={`product-${product.id}-images`} className="cursor-pointer">
                            <Upload className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                            <p className="text-xs text-blue-600">📷 Добавить изображения</p>
                          </label>
                          {product.imageNames.length > 0 && (
                            <div className="mt-2 text-xs text-blue-600">
                              {product.imageNames.length} файлов
                            </div>
                          )}
                        </div>
                        
                        {/* Сертификаты */}
                        <div className="border-2 border-gray-400 border-dashed p-3 text-center">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.png,.jpeg"
                            onChange={(e) => handleCertificateUpload(e.target.files, product.id)}
                            className="hidden"
                            id={`product-${product.id}-certificates`}
                          />
                          <label htmlFor={`product-${product.id}-certificates`} className="cursor-pointer">
                            <Upload className="h-5 w-5 mx-auto text-gray-600 mb-1" />
                            <p className="text-xs text-gray-600">
                              📋 {product.certificates.length === 0 ? 'Загрузить сертификаты' : 'Добавить еще'}
                            </p>
                          </label>
                          {product.certificateNames.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              {product.certificateNames.length} файлов
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Product */}
              <div className="border-2 border-black p-4">
                <h4 className="font-bold mb-3">Добавить товар вручную</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label>Название товара *</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="border-2 border-black"
                    />
                  </div>
                  <div>
                    <Label>Категория *</Label>
                    <Input
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="border-2 border-black"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <Label>Описание</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="border-2 border-black"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* Изображения нового товара */}
                  <div className="border-2 border-blue-300 border-dashed p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.png,.jpeg"
                      onChange={(e) => handleProductImageUpload(e.target.files)}
                      className="hidden"
                      id="new-product-images"
                    />
                    <label htmlFor="new-product-images" className="cursor-pointer">
                      <Upload className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                      <p className="text-sm text-blue-600">📷 Изображения товара</p>
                      <p className="text-xs text-blue-500">Необязательно</p>
                    </label>
                    {newProduct.imageNames.length > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        {newProduct.imageNames.length} файлов выбрано
                      </div>
                    )}
                  </div>

                  {/* Сертификаты нового товара */}
                  <div className="border-2 border-gray-400 border-dashed p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={(e) => handleCertificateUpload(e.target.files)}
                      className="hidden"
                      id="new-product-certificates"
                    />
                    <label htmlFor="new-product-certificates" className="cursor-pointer">
                      <Upload className="h-6 w-6 mx-auto text-gray-600 mb-2" />
                      <p className="text-sm text-gray-600">📋 Сертификаты</p>
                      <p className="text-xs text-red-600">Обязательно</p>
                    </label>
                    {newProduct.certificateNames.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        {newProduct.certificateNames.length} файлов выбрано
                      </div>
                    )}
                  </div>
                </div>



                <Button 
                  onClick={addProduct}
                  disabled={!newProduct.name || !newProduct.category || newProduct.certificates.length === 0}
                  className="w-full border-2 border-black bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить товар в список
                </Button>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Необязательно! Можете сразу нажать "Далее" если заполнили форму выше
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Юридические документы и подтверждения
              </h3>

              {/* Подтверждения */}
              <div className="border-2 border-black p-4">
                <h4 className="font-bold mb-3">Подтверждения</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={companyConfirmation.isLegalEntity}
                      onChange={(e) => setCompanyConfirmation(prev => ({ ...prev, isLegalEntity: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span>Подтверждаю, что являюсь представителем юридического лица</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={companyConfirmation.hasRightToRepresent}
                      onChange={(e) => setCompanyConfirmation(prev => ({ ...prev, hasRightToRepresent: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span>Подтверждаю право представлять интересы компании</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={companyConfirmation.confirmAccuracy}
                      onChange={(e) => setCompanyConfirmation(prev => ({ ...prev, confirmAccuracy: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span>Подтверждаю достоверность предоставленной информации</span>
                  </label>
                </div>
              </div>

              {/* Документы */}
              <div className="border-2 border-black p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">Юридические документы</h4>
                  <Button 
                    onClick={addLegalDocument}
                    variant="outline"
                    className="border-2 border-black"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить документ
                  </Button>
                </div>
                
                {legalDocuments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300">
                    Нет загруженных документов
                  </div>
                ) : (
                  <div className="space-y-3">
                    {legalDocuments.map(doc => (
                      <div key={doc.id} className="border-2 border-gray-300 p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                          <select
                            value={doc.type}
                            onChange={(e) => updateLegalDocument(doc.id!, 'type', e.target.value)}
                            className="border-2 border-black p-2"
                          >
                            <option value="business_license">Лицензия</option>
                            <option value="tax_certificate">Налоговый сертификат</option>
                            <option value="registration_certificate">Свидетельство о регистрации</option>
                            <option value="other">Другое</option>
                          </select>
                          
                          <Input
                            placeholder="Название документа"
                            value={doc.name}
                            onChange={(e) => updateLegalDocument(doc.id!, 'name', e.target.value)}
                            className="border-2 border-black"
                          />
                          
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.png,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  updateLegalDocument(doc.id!, 'file', file)
                                  updateLegalDocument(doc.id!, 'fileName', file.name)
                                }
                              }}
                              className="hidden"
                              id={`legal-doc-${doc.id}`}
                            />
                            <label
                              htmlFor={`legal-doc-${doc.id}`}
                              className="border-2 border-blue-600 text-blue-600 px-3 py-2 text-sm hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                            >
                              📎 Файл
                            </label>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeLegalDocument(doc.id!)}
                              className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {doc.fileName && (
                          <div className="mt-2 text-sm text-gray-600">
                            📎 {doc.fileName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : onClose()}
              className="border-2 border-black"
            >
              {currentStep > 1 ? 'Назад' : 'Отмена'}
            </Button>
            
            <div className="flex flex-col items-end gap-2">
              {/* Сообщение о валидации */}
              {!canProceedToNextStep() && getStepValidationMessage() && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1 border-2 border-red-300">
                  ⚠️ {getStepValidationMessage()}
                </div>
              )}
              
              <div className="flex gap-2">
                {currentStep < 3 ? (
                  <Button 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={!canProceedToNextStep()}
                    className="border-2 border-black bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    Далее
                  </Button>
                ) : (
                  <Button 
                    onClick={submitAccreditation}
                    disabled={!canProceedToNextStep() || loading}
                    className="border-2 border-orange-600 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-300"
                  >
                    {loading ? 'Отправка...' : 'Подать заявку на аккредитацию'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 