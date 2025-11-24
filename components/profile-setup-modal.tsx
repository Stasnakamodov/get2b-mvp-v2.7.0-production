"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Building, Users, ArrowRight, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { sendClientProfileNotificationToManager, sendSupplierProfileNotificationToManager } from "@/lib/telegram"

interface ProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
  onClose?: () => void
  userId: string
}

export function ProfileSetupModal({ isOpen, onComplete, onClose, userId }: ProfileSetupModalProps) {
  const [step, setStep] = useState<'select' | 'client' | 'supplier'>('select')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleProfileTypeSelect = (type: 'client' | 'supplier') => {
    setStep(type)
  }

  const handleClientProfileCreate = async (formData: any) => {
    setLoading(true)
    setError(null)

    try {
      
      const { data: clientProfile, error } = await supabase
        .from('client_profiles')
        .insert([{
          user_id: userId,
          name: formData.name,
          legal_name: formData.company_name,
          inn: formData.inn,
          kpp: formData.kpp,
          ogrn: formData.ogrn,
          legal_address: formData.address,
          email: formData.email,
          phone: formData.phone,
          // Банковские реквизиты
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          corr_account: formData.bank_corr_account,
          bik: formData.bank_bik,
          is_default: true
        }])
        .select()
        .single()

      if (error) throw error


      // Создаем запись в user_profiles для отслеживания
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          profile_type: 'client',
          profile_id: clientProfile.id,
          is_primary: true
        }])

      if (userProfileError) {
        console.error('[ProfileSetupModal] Error creating user profile:', userProfileError)
        throw userProfileError
      }

      // Отправляем уведомление менеджеру о создании профиля клиента
      try {
        const { data: userData } = await supabase.auth.getUser()
        
        await sendClientProfileNotificationToManager({
          userId: userId,
          userName: userData?.user?.user_metadata?.name || userData?.user?.email,
          userEmail: userData?.user?.email,
          profileId: clientProfile.id,
          companyName: formData.name,
          legalName: formData.company_name,
          inn: formData.inn,
          kpp: formData.kpp,
          ogrn: formData.ogrn,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          bankName: formData.bank_name,
          bankAccount: formData.bank_account,
          corrAccount: formData.bank_corr_account,
          bik: formData.bank_bik
        })
        
      } catch (notificationError) {
        console.error('[ProfileSetupModal] Error sending manager notification:', notificationError)
        // Не прерываем создание профиля из-за ошибки уведомления
      }

      onComplete()
      router.push('/dashboard')
    } catch (err: any) {
      console.error('[ProfileSetupModal] Error creating client profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierProfileCreate = async (formData: any) => {
    setLoading(true)
    setError(null)

    try {
      
      const { data: supplierProfile, error } = await supabase
        .from('supplier_profiles')
        .insert([{
          user_id: userId,
          name: formData.name,
          company_name: formData.company_name,
          category: formData.category,
          country: formData.country,
          city: formData.city,
          description: formData.description || '',
          contact_email: formData.email,
          contact_phone: formData.phone,
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error


      // Создаем запись в user_profiles для отслеживания
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          profile_type: 'supplier',
          profile_id: supplierProfile.id,
          is_primary: true
        }])

      if (userProfileError) {
        console.error('[ProfileSetupModal] Error creating user profile:', userProfileError)
        throw userProfileError
      }

      // Отправляем уведомление менеджеру о создании профиля поставщика
      try {
        const { data: userData } = await supabase.auth.getUser()
        
        await sendSupplierProfileNotificationToManager({
          userId: userId,
          userName: userData?.user?.user_metadata?.name || userData?.user?.email,
          userEmail: userData?.user?.email,
          profileId: supplierProfile.id,
          companyName: formData.company_name,
          category: formData.category,
          country: formData.country,
          city: formData.city,
          description: formData.description,
          contactEmail: formData.email,
          contactPhone: formData.phone,
          website: formData.website
        })
        
      } catch (notificationError) {
        console.error('[ProfileSetupModal] Error sending manager notification:', notificationError)
        // Не прерываем создание профиля из-за ошибки уведомления
      }

      onComplete()
      router.push('/dashboard')
    } catch (err: any) {
      console.error('[ProfileSetupModal] Error creating supplier profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  const handleBackToSelect = () => {
    setStep('select')
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-center text-2xl font-bold flex-1">
              {step === 'select' && 'Добро пожаловать в Get2B!'}
              {step === 'client' && 'Создание профиля клиента'}
              {step === 'supplier' && 'Создание профиля поставщика'}
            </DialogTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            <p className="text-center text-gray-600">
              Для начала работы необходимо создать профиль. Выберите тип профиля:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Клиент */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-blue-200 rounded-lg p-6 cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => handleProfileTypeSelect('client')}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Клиент</h3>
                    <p className="text-sm text-blue-700">Покупаю товары и услуги</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Создание заявок на покупку</li>
                  <li>• Работа с поставщиками</li>
                  <li>• Управление проектами</li>
                </ul>
              </motion.div>

              {/* Поставщик */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-green-200 rounded-lg p-6 cursor-pointer hover:border-green-400 transition-colors"
                onClick={() => handleProfileTypeSelect('supplier')}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Поставщик</h3>
                    <p className="text-sm text-green-700">Предоставляю товары и услуги</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Каталог товаров и услуг</li>
                  <li>• Работа с клиентами</li>
                  <li>• Аккредитация</li>
                </ul>
              </motion.div>
            </div>
          </div>
        )}

        {step === 'client' && (
          <ClientProfileForm 
            onSubmit={handleClientProfileCreate}
            onBack={handleBackToSelect}
            loading={loading}
            error={error}
          />
        )}

        {step === 'supplier' && (
          <SupplierProfileForm 
            onSubmit={handleSupplierProfileCreate}
            onBack={handleBackToSelect}
            loading={loading}
            error={error}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// Компонент формы клиента с банковскими реквизитами
function ClientProfileForm({ onSubmit, onBack, loading, error }: any) {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    inn: '',
    kpp: '',
    ogrn: '',
    address: '',
    email: '',
    phone: '',
    description: '',
    // Банковские реквизиты
    bank_name: '',
    bank_account: '',
    bank_corr_account: '',
    bank_bik: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Название компании *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Полное название *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.company_name}
            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ИНН *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.inn}
            onChange={(e) => setFormData({...formData, inn: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">КПП *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.kpp}
            onChange={(e) => setFormData({...formData, kpp: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ОГРН *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.ogrn}
            onChange={(e) => setFormData({...formData, ogrn: e.target.value})}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Адрес *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Телефон *</label>
          <input
            type="tel"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Описание деятельности</label>
          <textarea
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Банковские реквизиты */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Банковские реквизиты</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Название банка *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.bank_name}
            onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Расчетный счет *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="20 цифр"
            value={formData.bank_account}
            onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Корр. счет *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="20 цифр"
            value={formData.bank_corr_account}
            onChange={(e) => setFormData({...formData, bank_corr_account: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">БИК *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="9 цифр"
            value={formData.bank_bik}
            onChange={(e) => setFormData({...formData, bank_bik: e.target.value})}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          Назад
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Создание..." : "Создать профиль клиента"}
        </Button>
      </div>
    </form>
  )
}

// Компонент формы поставщика
function SupplierProfileForm({ onSubmit, onBack, loading, error }: any) {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    category: '',
    country: '',
    city: '',
    email: '',
    phone: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Название компании *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Полное название *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.company_name}
            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Категория *</label>
          <select
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="">Выберите категорию</option>
            <option value="Электроника">Электроника</option>
            <option value="Одежда">Одежда</option>
            <option value="Строительные материалы">Строительные материалы</option>
            <option value="Продукты питания">Продукты питания</option>
            <option value="Мебель">Мебель</option>
            <option value="Химия">Химия</option>
            <option value="Логистика">Логистика</option>
            <option value="Другое">Другое</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Страна *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Город *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Телефон *</label>
          <input
            type="tel"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Описание деятельности</label>
          <textarea
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          Назад
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? "Создание..." : "Создать профиль поставщика"}
        </Button>
      </div>
    </form>
  )
} 