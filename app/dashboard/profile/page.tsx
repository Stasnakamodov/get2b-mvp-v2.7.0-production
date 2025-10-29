"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Building,
  Users,
  Plus,
  Trash2,
  Edit,
  X,
  Star, // Добавляю импорт Star
  Shield,
  Eye,
} from "lucide-react"
import { supabase } from '@/lib/supabaseClient'
import { AddSupplierModal } from '../catalog/components/AddSupplierModal'
import { AccreditationModalV2 } from '../catalog/components/AccreditationModalV2'
import KonturEniCheckModal from '@/components/KonturEniCheckModal'

export default function ProfilePage() {
  // Состояния для пользователя
  const [userId, setUserId] = useState<string | null>(null)
  
  // Состояния для профилей
  const [clientProfiles, setClientProfiles] = useState<any[]>([])
  const [supplierProfiles, setSupplierProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Состояния для модальных окон
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [showAccreditationModal, setShowAccreditationModal] = useState(false)
  const [accreditingSupplier, setAccreditingSupplier] = useState<any>(null)
  const [showClientEditor, setShowClientEditor] = useState(false)
  const [showClientMethodSelector, setShowClientMethodSelector] = useState(false)
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
  
  // Состояния для подтверждения удаления
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [deleteType, setDeleteType] = useState<'client' | 'supplier'>('client')

  // Получение пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Ошибка получения пользователя:', error)
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

  const loadProfiles = async () => {
    if (!userId) return
    
    setLoading(true)
    
    try {
      // Загружаем профили клиентов
      const { data: clients, error: clientsError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (clientsError) throw clientsError
      
      // Загружаем профили поставщиков
      const { data: suppliers, error: suppliersError } = await supabase
        .from('supplier_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        
      if (suppliersError) throw suppliersError
      
      setClientProfiles(clients || [])
      setSupplierProfiles(suppliers || [])
    } catch (error) {
      console.error('Ошибка загрузки профилей:', error)
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
        const { error } = await supabase
          .from('client_profiles')
          .update(clientData)
          .eq('id', editingClient.id)
        
        if (error) throw error
      } else {
        // Создание
        const { error } = await supabase
          .from('client_profiles')
          .insert([clientData])

      if (error) throw error
      }
      
      setShowClientEditor(false)
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
      
      loadProfiles()
    } catch (error) {
      console.error('Ошибка сохранения клиента:', error)
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
      const { data, error } = await supabase.storage
        .from('client-logos')
        .upload(fileName, file)

      if (error) {
        console.warn('⚠️ Ошибка загрузки в Supabase Storage:', error.message)
        // Fallback на Base64
        const base64 = await convertToBase64(file)
        setClientForm(prev => ({ ...prev, logo_url: base64 }))
        console.log('✅ Логотип сохранен как Base64')
      } else {
        // Получаем публичный URL
        const { data: urlData } = supabase.storage
          .from('client-logos')
          .getPublicUrl(fileName)
        
        setClientForm(prev => ({ ...prev, logo_url: urlData.publicUrl }))
        console.log('✅ Логотип загружен в Supabase Storage:', urlData.publicUrl)
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки логотипа:', error)
      // Fallback на Base64
      try {
        const base64 = await convertToBase64(file)
        setClientForm(prev => ({ ...prev, logo_url: base64 }))
        console.log('✅ Логотип сохранен как Base64 (fallback)')
      } catch (base64Error) {
        console.error('❌ Ошибка конвертации в Base64:', base64Error)
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



  // Удаление профиля
  const deleteProfile = async () => {
    if (!itemToDelete) return
    
    try {
      const table = deleteType === 'client' ? 'client_profiles' : 'supplier_profiles'
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemToDelete.id)
      
        if (error) throw error
      
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      loadProfiles()
      } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка удаления профиля')
    }
  }

  // Обработка успешного добавления поставщика
  const handleSupplierSuccess = (supplier: any) => {
    setShowAddSupplierModal(false)
    setEditingSupplier(null)
    loadProfiles()
  }

  // Обработка аккредитации поставщика
  const handleAccreditSupplier = (supplier: any) => {
    setAccreditingSupplier(supplier)
    setShowAccreditationModal(true)
  };

  const handleAccreditationSuccess = () => {
    setShowAccreditationModal(false)
    setAccreditingSupplier(null)
    loadProfiles() // Обновляем список профилей
  };

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
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ваши карточки</h1>
        <div className="flex gap-3">
          <button
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
              setShowClientMethodSelector(true)
            }}
            className="border-2 border-border text-foreground px-6 py-2 hover:bg-foreground hover:text-background transition-all duration-300 uppercase tracking-wider text-sm font-medium flex items-center gap-2"
          >
            <Users className="h-4 w-4" /> Добавить клиента
          </button>
          <button 
            onClick={() => {
              setEditingSupplier(null)
              setShowAddSupplierModal(true)
            }} 
            className="border-2 border-border text-foreground px-6 py-2 hover:bg-foreground hover:text-background transition-all duration-300 uppercase tracking-wider text-sm font-medium flex items-center gap-2"
          >
            <Building className="h-4 w-4" /> Добавить поставщика
          </button>
        </div>
      </div>

      {/* Основные карточки в две колонки */}
      <div className="flex flex-col md:flex-row gap-8 items-stretch min-h-[520px]">
        {/* Левая колонка — клиенты */}
        <div className="flex-1 flex flex-col">
          <div className="mb-2 text-lg font-semibold text-blue-600">Клиенты</div>
          <div className="flex flex-col gap-4 flex-1">
            {clientProfiles.length > 0 ? (
              clientProfiles.map((profile: any) => (
                <motion.div 
                  key={profile.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-border bg-card p-8 hover:shadow-2xl transition-all duration-300 group min-h-[140px] flex flex-col justify-between"
                >
            <div>
                    <div className="flex items-center gap-4 mb-2">
                      {/* Логотип */}
                      <div className="w-12 h-12 border-2 border-gray-300 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                        {profile.logo_url ? (
                          <img 
                            src={profile.logo_url} 
                            alt={profile.name || 'Логотип'} 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{profile.name || 'Без названия'}</h3>
                        <div className="text-sm text-gray-600">
                          Тип: Клиент<br />
                          ИНН: {profile.inn || '—'}<br />
                          Email: {profile.email || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => editClient(profile)}
                      className="border-2 border-border text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all text-sm font-medium uppercase tracking-wider"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleCheckClient(profile)}
                      disabled={!profile.inn || !profile.ogrn}
                      className="border-2 border-blue-500 text-blue-600 px-4 py-2 hover:bg-blue-500 hover:text-white transition-all text-sm font-medium uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!profile.inn || !profile.ogrn ? "Для проверки нужны ИНН и ОГРН" : "Проверить компанию через Контур.Эни"}
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => { 
                        setItemToDelete(profile)
                        setDeleteType('client')
                        setShowDeleteConfirm(true)
                      }}
                      className="border-2 border-border text-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-all text-sm font-medium uppercase tracking-wider"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 min-h-[140px] flex items-center justify-center bg-gray-50">
                Нет карточек клиентов
              </div>
            )}
            
            {/* Пустые слоты до 3 */}
            {Array.from({ length: Math.max(0, 3 - clientProfiles.length) }).map((_, idx) => (
              <div key={`empty-client-${idx}`} className="border-2 border-dashed border-gray-300 bg-gray-50 min-h-[140px] flex items-center justify-center text-gray-400">
                Пустой слот
            </div>
            ))}
          </div>
        </div>

        {/* Правая колонка — поставщики */}
        <div className="flex-1 flex flex-col">
          <div className="mb-2 text-lg font-semibold text-green-600">Поставщики</div>
          <div className="flex flex-col gap-4 flex-1">
            {supplierProfiles.length > 0 ? (
              supplierProfiles.map((profile: any) => (
                <motion.div 
                  key={profile.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-border bg-card p-8 hover:shadow-2xl transition-all duration-300 group min-h-[140px] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      {/* Логотип */}
                      <div className="w-12 h-12 border-2 border-gray-300 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                        {profile.logo_url ? (
                          <img 
                            src={profile.logo_url} 
                            alt={profile.name || 'Логотип'} 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{profile.name || 'Без названия'}</h3>
                        <div className="text-sm text-gray-600">
                          Тип: Поставщик<br />
                          Страна: {profile.country || '—'}<br />
                          Категория: {profile.category || '—'}<br />
                          {profile.accreditation_status && (
                            <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                              profile.accreditation_status === 'approved' ? 'bg-green-100 text-green-800' :
                              profile.accreditation_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              profile.accreditation_status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                              profile.accreditation_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {profile.accreditation_status === 'approved' ? '✅ Аккредитован' :
                               profile.accreditation_status === 'pending' ? '⏳ Заявка подана' :
                               profile.accreditation_status === 'in_review' ? '🔍 На проверке' :
                               profile.accreditation_status === 'rejected' ? '❌ Отклонена' :
                               'Не аккредитован'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => editSupplier(profile)}
                      className="border-2 border-border text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all text-sm font-medium uppercase tracking-wider"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
{(() => {
                      const status = profile.accreditation_status;
                      const isActive = !status || status === 'none' || status === 'rejected';
                      const isApproved = status === 'approved';
                      const isPending = status === 'pending' || status === 'in_review';
                      
                      return (
                        <button 
                          onClick={() => isActive ? handleAccreditSupplier(profile) : null}
                          disabled={!isActive}
                          className={`border-2 px-4 py-2 transition-all text-sm font-medium uppercase tracking-wider ${
                            isApproved 
                              ? 'border-green-500 text-green-600 bg-green-50' 
                              : isPending 
                                ? 'border-yellow-500 text-yellow-600 bg-yellow-50 cursor-not-allowed opacity-75' 
                                : 'border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white'
                          }`}
                          title={
                            isApproved ? 'Поставщик аккредитован' :
                            isPending ? 'Заявка на рассмотрении' :
                            status === 'rejected' ? 'Подать заявку повторно' :
                            'Подать заявку на аккредитацию'
                          }
                        >
                          <Star className={`h-4 w-4 ${isApproved ? 'fill-current' : ''}`} />
                        </button>
                      );
                    })()}
                    <button 
                      onClick={() => { 
                        setItemToDelete(profile)
                        setDeleteType('supplier')
                        setShowDeleteConfirm(true)
                      }}
                      className="border-2 border-border text-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-all text-sm font-medium uppercase tracking-wider"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 min-h-[140px] flex items-center justify-center bg-gray-50">
                Нет карточек поставщиков
              </div>
            )}
            
            {/* Пустые слоты до 3 */}
            {Array.from({ length: Math.max(0, 3 - supplierProfiles.length) }).map((_, idx) => (
              <div key={`empty-supplier-${idx}`} className="border-2 border-dashed border-gray-300 bg-gray-50 min-h-[140px] flex items-center justify-center text-gray-400">
                Пустой слот
                    </div>
                  ))}
                </div>
        </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full p-6 bg-card border-2 border-border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-2xl font-bold text-foreground uppercase tracking-wider">
                {editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
              </h2>
                              <button
                  onClick={() => setShowClientEditor(false)}
                  className="border-2 border-border text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all text-lg font-bold"
                >
                <X className="h-4 w-4" />
              </button>
                    </div>
            
            <form onSubmit={saveClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                    Название компании *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                    className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  </div>
                
                  <div>
                  <Label htmlFor="legal_name" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                    Полное название
                  </Label>
                  <Input
                    id="legal_name"
                    type="text"
                    value={clientForm.legal_name}
                    onChange={(e) => setClientForm({...clientForm, legal_name: e.target.value})}
                    className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                  />
                    </div>
                
                <div>
                  <Label htmlFor="inn" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                    ИНН
                  </Label>
                  <Input
                    id="inn"
                    type="text"
                    value={clientForm.inn}
                    onChange={(e) => setClientForm({...clientForm, inn: e.target.value})}
                    className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                  />
                  </div>
                
                <div>
                  <Label htmlFor="kpp" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                    КПП
                  </Label>
                  <Input
                    id="kpp"
                    type="text"
                    value={clientForm.kpp}
                    onChange={(e) => setClientForm({...clientForm, kpp: e.target.value})}
                    className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ogrn" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                    ОГРН
                  </Label>
                  <Input
                    id="ogrn"
                    type="text"
                    value={clientForm.ogrn}
                    onChange={(e) => setClientForm({...clientForm, ogrn: e.target.value})}
                    className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                  />
              </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                    className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                  />
                      </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                    Телефон
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                    className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                  />
              </div>
            </div>

            {/* Блок загрузки логотипа */}
            <div>
              <Label className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                Логотип компании
              </Label>
              <div className="flex items-start gap-4">
                {/* Превью логотипа */}
                <div className="w-32 h-32 border-2 border-black flex items-center justify-center bg-gray-50 relative">
                  {clientForm.logo_url ? (
                    <img 
                      src={clientForm.logo_url} 
                      alt="Логотип компании" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm text-center font-medium">
                      LOGO
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">Загрузка...</div>
                    </div>
                  )}
                </div>
                
                {/* Кнопки управления */}
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
                  <div className="space-y-2">
                    <label
                      htmlFor="logo-upload"
                      className="block w-full px-4 py-2 border-2 border-black bg-white hover:bg-gray-50 text-center cursor-pointer transition-colors"
                    >
                      {clientForm.logo_url ? 'Изменить логотип' : 'Загрузить логотип'}
                    </label>
                    {clientForm.logo_url && (
                      <button
                        type="button"
                        onClick={() => setClientForm({...clientForm, logo_url: ''})}
                        className="block w-full px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-50 text-center transition-colors"
                      >
                        Удалить логотип
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Поддерживаются: JPEG, PNG, WebP, SVG<br/>
                    Максимальный размер: 5MB
                  </p>
                </div>
              </div>
            </div>

              {/* Банковские реквизиты */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wider">🏦 Банковские реквизиты</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="bank_name" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                      Название банка
                    </Label>
                    <Input
                      id="bank_name"
                        type="text"
                      value={clientForm.bank_name}
                      onChange={(e) => setClientForm({...clientForm, bank_name: e.target.value})}
                      className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                      placeholder="Сбербанк России"
                    />
                    </div>
                    
                    <div>
                    <Label htmlFor="bank_account" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                      Расчетный счет
                    </Label>
                    <Input
                      id="bank_account"
                        type="text"
                      value={clientForm.bank_account}
                      onChange={(e) => setClientForm({...clientForm, bank_account: e.target.value})}
                      className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                      placeholder="40702810..."
                    />
                    </div>
                    
                    <div>
                    <Label htmlFor="corr_account" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                      Корреспондентский счет
                    </Label>
                    <Input
                      id="corr_account"
                      type="text"
                      value={clientForm.corr_account}
                      onChange={(e) => setClientForm({...clientForm, corr_account: e.target.value})}
                      className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                      placeholder="30101810..."
                    />
                    </div>
                    
                    <div>
                    <Label htmlFor="bik" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                      БИК
                    </Label>
                    <Input
                      id="bik"
                        type="text"
                      value={clientForm.bik}
                      onChange={(e) => setClientForm({...clientForm, bik: e.target.value})}
                      className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                      placeholder="044525225"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="legal_address" className="text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Юридический адрес
                </Label>
                <Textarea
                  id="legal_address"
                  value={clientForm.legal_address}
                  onChange={(e) => setClientForm({...clientForm, legal_address: e.target.value})}
                  className="border-2 border-black focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                </div>
              


              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowClientEditor(false)}
                  className="border-2 border-border text-foreground px-6 py-2 hover:bg-foreground hover:text-background transition-all text-sm font-medium uppercase tracking-wider"
                >
                  Отмена
                </button>
                    <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 transition-all text-sm font-medium uppercase tracking-wider"
                    >
                  {editingClient ? 'Обновить' : 'Сохранить'}
                    </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Подтверждение удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="max-w-md w-full p-6 bg-card border-2 border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Подтвердить удаление</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить профиль "{itemToDelete?.name}"?
            </p>
            <div className="flex justify-end gap-3">
                     <button
                onClick={() => setShowDeleteConfirm(false)}
                className="border-2 border-border text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all text-sm font-medium uppercase tracking-wider"
              >
                Отмена
                     </button>
                     <button
                onClick={deleteProfile}
                className="bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-all text-sm font-medium uppercase tracking-wider"
                    >
                Удалить
                     </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно аккредитации */}
      <AccreditationModalV2
        isOpen={showAccreditationModal}
        onClose={() => setShowAccreditationModal(false)}
        supplier={accreditingSupplier}
        onSuccess={handleAccreditationSuccess}
      />

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

      {/* Выдвижная плашка выбора метода создания клиента */}
      {showClientMethodSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="max-w-2xl w-full p-8 bg-card border-2 border-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground uppercase tracking-wider">
                Выберите способ создания профиля клиента
              </h2>
              <button
                onClick={() => setShowClientMethodSelector(false)}
                className="border-2 border-border text-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all text-lg font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Вариант 1: Заполнить вручную */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowClientMethodSelector(false)
                  setShowClientEditor(true)
                }}
                className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-8 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    Заполнить вручную
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ввести все данные компании самостоятельно через форму
                  </p>
                </div>
              </motion.button>

              {/* Вариант 2: Загрузить карточку (OCR) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowClientMethodSelector(false)
                  // TODO: Открыть OCR загрузчик
                  alert('OCR загрузка - будет реализовано')
                }}
                className="border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-8 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                    Загрузить карточку
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Автоматически извлечь данные из карточки компании с помощью Yandex Vision OCR
                  </p>
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-500">
                    <Shield className="h-4 w-4" />
                    <span>Powered by Yandex Vision</span>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
