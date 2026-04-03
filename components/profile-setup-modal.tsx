"use client"
import { db } from "@/lib/db/client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building, Users, ArrowRight, ArrowLeft, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { sendClientProfileNotificationClient, sendSupplierProfileNotificationClient } from "@/lib/telegram-client"

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
      
      const { data: clientProfile, error } = await db
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
      const { error: userProfileError } = await db
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
        const { data: userData } = await db.auth.getUser()
        
        await sendClientProfileNotificationClient({
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
      
      const { data: supplierProfile, error } = await db
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
      const { error: userProfileError } = await db
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
        const { data: userData } = await db.auth.getUser()
        
        await sendSupplierProfileNotificationClient({
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
            <p className="text-center text-gray-600 dark:text-gray-400">
              Для начала работы необходимо создать профиль. Выберите тип профиля:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Клиент */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                onClick={() => handleProfileTypeSelect('client')}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Клиент</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Покупаю товары и услуги</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Создание заявок на покупку</li>
                  <li>• Работа с поставщиками</li>
                  <li>• Управление проектами</li>
                </ul>
              </motion.div>

              {/* Поставщик */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-green-200 dark:border-green-800 rounded-lg p-6 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors"
                onClick={() => handleProfileTypeSelect('supplier')}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Поставщик</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Предоставляю товары и услуги</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Каталог товаров и услуг</li>
                  <li>• Работа с клиентами</li>
                  <li>• Аккредитация</li>
                </ul>
              </motion.div>
            </div>

            {/* Пропустить настройку */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
              >
                Пропустить настройку профиля
              </button>
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

// Шаги клиентской формы
const CLIENT_STEPS = [
  { id: 1, title: 'Основное' },
  { id: 2, title: 'Юр. данные' },
  { id: 3, title: 'Банк. реквизиты' },
] as const

// Степпер — визуальный прогресс
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: readonly { id: number; title: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                s.id < currentStep
                  ? 'bg-blue-600 text-white'
                  : s.id === currentStep
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-900'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {s.id < currentStep ? <CheckCircle className="w-4 h-4" /> : s.id}
            </div>
            <span className={`text-xs whitespace-nowrap ${
              s.id === currentStep
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {s.title}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-0.5 mb-5 mx-1 transition-colors ${
              s.id < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"

// Компонент формы клиента с банковскими реквизитами (степпер)
function ClientProfileForm({ onSubmit, onBack, loading, error }: any) {
  const [clientStep, setClientStep] = useState(1)
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
    bank_name: '',
    bank_account: '',
    bank_corr_account: '',
    bank_bik: ''
  })

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const canGoNext = () => {
    if (clientStep === 1) return formData.name && formData.inn && formData.email && formData.phone
    if (clientStep === 2) return formData.company_name && formData.kpp && formData.ogrn && formData.address
    return true
  }

  const handleNext = () => {
    if (clientStep < 3) setClientStep(clientStep + 1)
  }

  const handlePrev = () => {
    if (clientStep > 1) setClientStep(clientStep - 1)
    else onBack()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleSkipBank = () => {
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepIndicator currentStep={clientStep} steps={CLIENT_STEPS} />

      <AnimatePresence mode="wait">
        {/* Шаг 1 — Основное */}
        {clientStep === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Название компании *</label>
              <input
                type="text"
                required
                className={inputClasses}
                placeholder="ООО «Компания»"
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">ИНН *</label>
              <input
                type="text"
                required
                className={inputClasses}
                placeholder="10 или 12 цифр"
                value={formData.inn}
                onChange={(e) => update('inn', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
              <input
                type="email"
                required
                className={inputClasses}
                placeholder="info@company.ru"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Телефон *</label>
              <input
                type="tel"
                required
                className={inputClasses}
                placeholder="+7 (999) 123-45-67"
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Описание деятельности</label>
              <input
                type="text"
                className={inputClasses}
                placeholder="Чем занимается компания"
                value={formData.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
          </motion.div>
        )}

        {/* Шаг 2 — Юридические данные */}
        {clientStep === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Юридические данные компании</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Полное юридическое название *</label>
                <input
                  type="text"
                  required
                  className={inputClasses}
                  placeholder="Общество с ограниченной ответственностью «Компания»"
                  value={formData.company_name}
                  onChange={(e) => update('company_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">КПП *</label>
                <input
                  type="text"
                  required
                  className={inputClasses}
                  placeholder="9 цифр"
                  value={formData.kpp}
                  onChange={(e) => update('kpp', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">ОГРН *</label>
                <input
                  type="text"
                  required
                  className={inputClasses}
                  placeholder="13 цифр"
                  value={formData.ogrn}
                  onChange={(e) => update('ogrn', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Юридический адрес *</label>
                <input
                  type="text"
                  required
                  className={inputClasses}
                  placeholder="г. Москва, ул. Примерная, д. 1"
                  value={formData.address}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Шаг 3 — Банковские реквизиты */}
        {clientStep === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Банковские реквизиты</p>
              <span className="text-xs text-gray-400 dark:text-gray-500">Можно заполнить позже</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Название банка</label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="ПАО Сбербанк"
                  value={formData.bank_name}
                  onChange={(e) => update('bank_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Расчётный счёт</label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="20 цифр"
                  value={formData.bank_account}
                  onChange={(e) => update('bank_account', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Корр. счёт</label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="20 цифр"
                  value={formData.bank_corr_account}
                  onChange={(e) => update('bank_corr_account', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">БИК</label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="9 цифр"
                  value={formData.bank_bik}
                  onChange={(e) => update('bank_bik', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {clientStep === 1 ? 'Назад' : 'Предыдущий шаг'}
        </Button>

        {clientStep < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Далее
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipBank}
              disabled={loading}
            >
              Пропустить
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Создание..." : "Создать профиль"}
            </Button>
          </div>
        )}
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