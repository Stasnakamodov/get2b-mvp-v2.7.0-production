"use client"
import { db } from "@/lib/db/client"

import { logger } from "@/src/shared/lib/logger"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Building,
  Users,
  Plus,
  Trash2,
  Edit,
  X,
  Shield,
  Eye,
} from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AddSupplierModal } from "@/app/dashboard/catalog/components/AddSupplierModal"
import KonturEniCheckModal from "@/components/KonturEniCheckModal"

export default function ProfilePage() {
  // Состояния для пользователя
  const [userId, setUserId] = useState<string | null>(null)
  
  // Состояния для профилей
  const [clientProfiles, setClientProfiles] = useState<any[]>([])
  const [supplierProfiles, setSupplierProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Состояния для модальных окон
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [showClientEditor, setShowClientEditor] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [showKonturEniCheck, setShowKonturEniCheck] = useState(false)
  const [checkingClient, setCheckingClient] = useState<any>(null)
  
  // Состояния для формы клиента
  const [clientForm, setClientForm] = useState({
    name: '',
    legal_name: '',
    inn: '',
    kpp: '',
    ogrn: '',
    legal_address: '',
    email: '',
    phone: '',
    website: '',
    bank_name: '',
    bank_account: '',
    corr_account: '',
    bik: '',
    logo_url: '' // Поле для логотипа
  })

  // Состояния для загрузки логотипа
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoInputRef, setLogoInputRef] = useState<HTMLInputElement | null>(null)

  // Состояния для OCR
  const [showOcrUploader, setShowOcrUploader] = useState(false)
  const [ocrAnalyzing, setOcrAnalyzing] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isOcrData, setIsOcrData] = useState(false) // Флаг: данные получены через OCR
  
  // Состояния для подтверждения удаления
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [deleteType, setDeleteType] = useState<'client' | 'supplier'>('client')

  // Получение пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await db.auth.getUser()
      if (error) {
        logger.error('Ошибка получения пользователя:', error)
        return
      }
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  // Загрузка профилей
  useEffect(() => {
    if (userId) {
      loadProfiles()
    }
  }, [userId])

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showClientDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('button')) {
          setShowClientDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showClientDropdown])

  const loadProfiles = async () => {
    if (!userId) return
    
    setLoading(true)
    
    try {
      // Загружаем профили клиентов
      const { data: clients, error: clientsError } = await db
        .from('client_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (clientsError) throw clientsError
      
      // Загружаем профили поставщиков
      const { data: suppliers, error: suppliersError } = await db
        .from('supplier_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        
      if (suppliersError) throw suppliersError
      
      setClientProfiles(clients || [])
      setSupplierProfiles(suppliers || [])
    } catch (error) {
      logger.error('Ошибка загрузки профилей:', error)
    } finally {
      setLoading(false)
    }
  }

  // Сохранение профиля клиента
  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    try {
      const clientData = {
        ...clientForm,
        user_id: userId
      }
      
      if (editingClient) {
        // Обновление
        const { error } = await db
          .from('client_profiles')
          .update(clientData)
          .eq('id', editingClient.id)
        
        if (error) throw error
      } else {
        // Создание
        const { error } = await db
          .from('client_profiles')
          .insert([clientData])

      if (error) throw error
      }
      
      setShowClientEditor(false)
      setEditingClient(null)
      setIsOcrData(false) // Сбрасываем флаг OCR
      setClientForm({
        name: '',
        legal_name: '',
        inn: '',
        kpp: '',
        ogrn: '',
        legal_address: '',
        email: '',
        phone: '',
        website: '',
        bank_name: '',
        bank_account: '',
        corr_account: '',
        bik: '',
        logo_url: ''
      })

      loadProfiles()
    } catch (error) {
      logger.error('Ошибка сохранения клиента:', error)
      alert('Ошибка сохранения профиля клиента')
    }
  }

  // Редактирование клиента
  const editClient = (client: any) => {
    setEditingClient(client)
    setClientForm({
      name: client.name || '',
      legal_name: client.legal_name || '',
      inn: client.inn || '',
      kpp: client.kpp || '',
      ogrn: client.ogrn || '',
      legal_address: client.legal_address || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      bank_name: client.bank_name || '',
      bank_account: client.bank_account || '',
      corr_account: client.corr_account || '',
      bik: client.bik || '',
      logo_url: client.logo_url || ''
    })
    setIsOcrData(false) // Редактирование существующего - НЕ OCR
    setShowClientEditor(true)
  }

  // Редактирование поставщика
  const editSupplier = (supplier: any) => {
    setEditingSupplier(supplier)
    setShowAddSupplierModal(true)
  }

  // Функция конвертации файла в Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Функция загрузки логотипа
  const handleLogoUpload = async (file: File) => {
    if (!file) return

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      alert('Поддерживаются только изображения: JPEG, PNG, WebP, SVG')
      return
    }

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    setUploadingLogo(true)

    try {
      // Создаем уникальное имя файла
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Попытка загрузки в Supabase Storage
      const { data, error } = await db.storage
        .from('company-logos')
        .upload(fileName, file)

      if (error) {
        logger.warn('⚠️ Ошибка загрузки в Supabase Storage:', error.message)
        // Fallback на Base64
        const base64 = await convertToBase64(file)
        setClientForm(prev => ({ ...prev, logo_url: base64 }))
      } else {
        // Получаем публичный URL
        const { data: urlData } = db.storage
          .from('company-logos')
          .getPublicUrl(fileName)
        
        setClientForm(prev => ({ ...prev, logo_url: urlData.publicUrl }))
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки логотипа:', error)
      // Fallback на Base64
      try {
        const base64 = await convertToBase64(file)
        setClientForm(prev => ({ ...prev, logo_url: base64 }))
      } catch (base64Error) {
        logger.error('❌ Ошибка конвертации в Base64:', base64Error)
        alert('Ошибка загрузки логотипа')
      }
    } finally {
      setUploadingLogo(false)
    }
  }

  // Функция для открытия файлового диалога
  const openLogoFileDialog = () => {
    if (logoInputRef) {
      logoInputRef.click()
    }
  }

  // Функция обработки OCR загрузки файла
  const handleOcrFileUpload = async (file: File) => {
    if (!userId) return

    setOcrAnalyzing(true)
    setOcrError(null)
    setUploadedFile(file)

    try {
      // 1. Загружаем файл в Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `ocr_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data: uploadData, error: uploadError } = await db.storage
        .from('project-files')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error(`Ошибка загрузки файла: ${uploadError.message}`)
      }

      // 2. Получаем публичную ссылку
      const { data: urlData } = db.storage
        .from('project-files')
        .getPublicUrl(fileName)

      const fileUrl = urlData.publicUrl


      // 3. Отправляем на анализ в API
      const analysisResponse = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: fileUrl,
          fileType: file.type,
          documentType: 'company_card'
        })
      })


      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text()
        logger.error('❌ Analysis Error:', errorText)
        throw new Error(`Ошибка анализа документа: ${analysisResponse.status}`)
      }

      const analysisResult = await analysisResponse.json()


      // 4. Автозаполняем форму клиента
      if (analysisResult.success && analysisResult.suggestions) {
        const ocrData = analysisResult.suggestions

        setClientForm({
          name: ocrData.companyName || '',
          legal_name: ocrData.companyName || '',
          inn: ocrData.inn || '',
          kpp: ocrData.kpp || '',
          ogrn: ocrData.ogrn || '',
          legal_address: ocrData.address || '',
          email: ocrData.email || '',
          phone: ocrData.phone || '',
          website: ocrData.website || '',
          bank_name: ocrData.bankName || '',
          bank_account: ocrData.bankAccount || '',
          corr_account: ocrData.bankCorrAccount || '',
          bik: ocrData.bankBik || '',
          logo_url: ''
        })

        // Закрываем OCR загрузчик и открываем форму
        setShowOcrUploader(false)
        setIsOcrData(true) // Помечаем, что данные из OCR
        setShowClientEditor(true)
      } else {
        throw new Error(analysisResult.error || 'Не удалось извлечь данные из документа')
      }
    } catch (error: any) {
      logger.error('Ошибка OCR обработки:', error)
      setOcrError(error.message || 'Произошла ошибка при обработке документа')
    } finally {
      setOcrAnalyzing(false)
    }
  }

  // Обработчик drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleOcrFileUpload(files[0])
    }
  }



  // Удаление профиля
  const deleteProfile = async () => {
    if (!itemToDelete) return
    
    try {
      const table = deleteType === 'client' ? 'client_profiles' : 'supplier_profiles'
      
      const { error } = await db
        .from(table)
        .delete()
        .eq('id', itemToDelete.id)
      
        if (error) throw error
      
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      loadProfiles()
      } catch (error) {
      logger.error('Ошибка удаления:', error)
      alert('Ошибка удаления профиля')
    }
  }

  // Обработка успешного добавления поставщика
  const handleSupplierSuccess = (supplier: any) => {
    setShowAddSupplierModal(false)
    setEditingSupplier(null)
    loadProfiles()
  }

  const handleCheckClient = (client: any) => {
    setCheckingClient(client)
    setShowKonturEniCheck(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Загрузка профилей...</div>
      </div>
    )
  }

    return (
    <div className="container mx-auto py-4">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Ваши карточки</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => {
                setEditingClient(null)
                setClientForm({
                  name: '',
                  legal_name: '',
                  inn: '',
                  kpp: '',
                  ogrn: '',
                  legal_address: '',
                  email: '',
                  phone: '',
                  website: '',
                  bank_name: '',
                  bank_account: '',
                  corr_account: '',
                  bik: '',
                  logo_url: ''
                })
                setShowClientDropdown(!showClientDropdown)
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" /> Добавить клиента
            </Button>

            {/* Dropdown меню */}
            {showClientDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowClientDropdown(false)
                    setIsOcrData(false)
                    setShowClientEditor(true)
                  }}
                  className="w-full p-4 border-b border-border hover:bg-accent transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground text-sm">
                        Заполнить вручную
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Ввести данные компании через форму
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowClientDropdown(false)
                    setShowOcrUploader(true)
                  }}
                  className="w-full p-4 hover:bg-accent transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground text-sm">
                        Загрузить карточку
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Извлечь данные через Yandex Vision OCR
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setEditingSupplier(null)
              setShowAddSupplierModal(true)
            }}
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" /> Добавить поставщика
          </Button>
        </div>
      </motion.div>

      {/* Две колонки: Клиенты и Поставщики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Колонка клиентов */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Клиенты</h2>
            <span className="text-sm text-muted-foreground">({clientProfiles.length})</span>
          </div>

          <div className="space-y-4">
            {clientProfiles.length > 0 ? (
              clientProfiles.map((clientProfile, index) => (
                <motion.div
                  key={clientProfile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center bg-muted/30 overflow-hidden flex-shrink-0">
                          {clientProfile.logo_url ? (
                            <img src={clientProfile.logo_url} alt={clientProfile.name || 'Логотип'} className="w-full h-full object-contain" />
                          ) : (
                            <Users className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">{clientProfile.name || 'Без названия'}</h3>
                          <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            <p>ИНН: {clientProfile.inn || '—'}</p>
                            <p>Email: {clientProfile.email || '—'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => editClient(clientProfile)}>
                          <Edit className="h-3.5 w-3.5 mr-1.5" /> Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckClient(clientProfile)}
                          disabled={!clientProfile.inn || !clientProfile.ogrn}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title={!clientProfile.inn || !clientProfile.ogrn ? "Для проверки нужны ИНН и ОГРН" : "Проверить через Контур.Эни"}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1.5" /> Проверить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setItemToDelete(clientProfile); setDeleteType('client'); setShowDeleteConfirm(true) }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Нет карточек клиентов</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingClient(null)
                      setClientForm({ name: '', legal_name: '', inn: '', kpp: '', ogrn: '', legal_address: '', email: '', phone: '', website: '', bank_name: '', bank_account: '', corr_account: '', bik: '', logo_url: '' })
                      setIsOcrData(false)
                      setShowClientEditor(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Добавить первого клиента
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Колонка поставщиков */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Building className="h-4 w-4 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Поставщики</h2>
            <span className="text-sm text-muted-foreground">({supplierProfiles.length})</span>
          </div>

          <div className="space-y-4">
            {supplierProfiles.length > 0 ? (
              supplierProfiles.map((supplierProfile, index) => (
                <motion.div
                  key={supplierProfile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center bg-muted/30 overflow-hidden flex-shrink-0">
                          {supplierProfile.logo_url ? (
                            <img src={supplierProfile.logo_url} alt={supplierProfile.name || 'Логотип'} className="w-full h-full object-contain" />
                          ) : (
                            <Building className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">{supplierProfile.name || 'Без названия'}</h3>
                          <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            <p>Страна: {supplierProfile.country || '—'}</p>
                            <p>Категория: {supplierProfile.category || '—'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button variant="outline" size="sm" onClick={() => editSupplier(supplierProfile)}>
                          <Edit className="h-3.5 w-3.5 mr-1.5" /> Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setItemToDelete(supplierProfile); setDeleteType('supplier'); setShowDeleteConfirm(true) }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-8 text-center">
                  <Building className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Нет карточек поставщиков</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSupplier(null)
                      setShowAddSupplierModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Добавить первого поставщика
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      {/* Модальное окно добавления поставщика (7 шагов) */}
      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => {
          setShowAddSupplierModal(false)
          setEditingSupplier(null)
        }}
        onSuccess={handleSupplierSuccess}
        editingSupplier={editingSupplier}
        targetTable="supplier_profiles"
      />

      {/* Модальное окно редактирования клиента */}
      {showClientEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl w-full bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
              <h2 className="text-xl font-semibold text-foreground">
                {editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowClientEditor(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={saveClient} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название компании *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_name">Полное название</Label>
                  <Input
                    id="legal_name"
                    type="text"
                    value={clientForm.legal_name}
                    onChange={(e) => setClientForm({...clientForm, legal_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inn">ИНН</Label>
                  <Input
                    id="inn"
                    type="text"
                    value={clientForm.inn}
                    onChange={(e) => setClientForm({...clientForm, inn: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kpp">КПП</Label>
                  <Input
                    id="kpp"
                    type="text"
                    value={clientForm.kpp}
                    onChange={(e) => setClientForm({...clientForm, kpp: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogrn">ОГРН</Label>
                  <Input
                    id="ogrn"
                    type="text"
                    value={clientForm.ogrn}
                    onChange={(e) => setClientForm({...clientForm, ogrn: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Блок загрузки логотипа */}
              <div className="space-y-2">
                <Label>Логотип компании</Label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg border border-border flex items-center justify-center bg-muted/30 relative overflow-hidden flex-shrink-0">
                    {clientForm.logo_url ? (
                      <img
                        src={clientForm.logo_url}
                        alt="Логотип компании"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">LOGO</span>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs">Загрузка...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleLogoUpload(file)
                      }}
                      className="hidden"
                      id="logo-upload"
                      ref={(el) => setLogoInputRef(el)}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          {clientForm.logo_url ? 'Изменить' : 'Загрузить'}
                        </label>
                      </Button>
                      {clientForm.logo_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setClientForm({...clientForm, logo_url: ''})}
                          className="text-red-500 hover:text-red-600"
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPEG, PNG, WebP, SVG. Макс. 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Банковские реквизиты */}
              <div className="border-t border-border pt-6">
                <h3 className="text-base font-semibold text-foreground mb-4">Банковские реквизиты</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Название банка</Label>
                    <Input
                      id="bank_name"
                      type="text"
                      value={clientForm.bank_name}
                      onChange={(e) => setClientForm({...clientForm, bank_name: e.target.value})}
                      placeholder="Сбербанк России"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Расчетный счет</Label>
                    <Input
                      id="bank_account"
                      type="text"
                      value={clientForm.bank_account}
                      onChange={(e) => setClientForm({...clientForm, bank_account: e.target.value})}
                      placeholder="40702810..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="corr_account">Корреспондентский счет</Label>
                    <Input
                      id="corr_account"
                      type="text"
                      value={clientForm.corr_account}
                      onChange={(e) => setClientForm({...clientForm, corr_account: e.target.value})}
                      placeholder="30101810..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bik">БИК</Label>
                    <Input
                      id="bik"
                      type="text"
                      value={clientForm.bik}
                      onChange={(e) => setClientForm({...clientForm, bik: e.target.value})}
                      placeholder="044525225"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal_address">Юридический адрес</Label>
                <Textarea
                  id="legal_address"
                  value={clientForm.legal_address}
                  onChange={(e) => setClientForm({...clientForm, legal_address: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClientEditor(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {editingClient ? 'Обновить' : isOcrData ? 'Создать профиль' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Подтверждение удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-6 bg-card border border-border rounded-xl shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">Подтвердить удаление</h3>
            <p className="text-muted-foreground mb-6">
              Вы уверены, что хотите удалить профиль &laquo;{itemToDelete?.name}&raquo;?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={deleteProfile}>
                Удалить
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Модальное окно проверки Контур.Эни */}
      {showKonturEniCheck && checkingClient && (
        <KonturEniCheckModal
          open={showKonturEniCheck}
          onClose={() => {
            setShowKonturEniCheck(false)
            setCheckingClient(null)
          }}
          companyData={{
            name: checkingClient.name,
            inn: checkingClient.inn,
            ogrn: checkingClient.ogrn,
          }}
        />
      )}


      {/* Модальное окно OCR загрузчика */}
      {showOcrUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                Загрузка карточки компании
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowOcrUploader(false)
                  setOcrError(null)
                  setUploadedFile(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              {/* Drag & Drop зона */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-orange-400 dark:border-orange-600 rounded-xl bg-orange-50 dark:bg-orange-900/10 p-10 text-center hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all duration-300 cursor-pointer"
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleOcrFileUpload(file)
                  }}
                  className="hidden"
                  id="ocr-file-input"
                />

                {ocrAnalyzing ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto"></div>
                    <p className="text-base font-semibold text-orange-700 dark:text-orange-400">
                      Анализируем документ...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Yandex Vision обрабатывает карточку компании
                    </p>
                  </div>
                ) : (
                  <label htmlFor="ocr-file-input" className="cursor-pointer space-y-3 block">
                    <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center mx-auto">
                      <Eye className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Перетащите файл сюда
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      или нажмите для выбора файла
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG, XLSX, DOCX
                    </p>
                  </label>
                )}
              </div>

              {/* Информация о поддерживаемых документах */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground text-sm mb-2">
                  Поддерживаемые документы:
                </h4>
                <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                  <span>Карточки компаний РФ</span>
                  <span>Свидетельства о регистрации</span>
                  <span>Договоры с реквизитами</span>
                  <span>Банковские документы</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-orange-500" />
                <span>Powered by Yandex Vision OCR</span>
              </div>

              {/* Ошибка */}
              {ocrError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 font-medium text-sm">Ошибка:</p>
                  <p className="text-red-600 dark:text-red-500 text-sm mt-1">{ocrError}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
