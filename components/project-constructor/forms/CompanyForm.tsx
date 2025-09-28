'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Save } from 'lucide-react'
import type { FormProps, CompanyData } from '@/types/project-constructor.types'
import { CompanyDataSchema } from '@/types/project-constructor.types'

interface CompanyFormProps extends FormProps<CompanyData> {
  isInlineView?: boolean
}

const CompanyForm = ({ onSave, onCancel, initialData, isInlineView = false }: CompanyFormProps) => {
  console.log("🔍 CompanyForm получил initialData:", initialData);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    legalName: initialData?.legal_name || '',
    inn: initialData?.inn || '',
    kpp: initialData?.kpp || '',
    ogrn: initialData?.ogrn || '',
    address: initialData?.legal_address || '',
    // Банковские реквизиты - автозаполнение из профиля
    bankName: initialData?.bank_name || '',
    bankAccount: initialData?.bank_account || '',
    bik: initialData?.bik || '',
    correspondentAccount: initialData?.corr_account || '',
    // Контактные данные
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    director: initialData?.director || '' // Автозаполнение директора
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveFormData()
  }

  const saveFormData = () => {
    // Валидация через Zod схему
    try {
      const validatedData = CompanyDataSchema.parse({
        name: formData.name,
        legal_name: formData.legalName,
        inn: formData.inn,
        kpp: formData.kpp,
        ogrn: formData.ogrn,
        legal_address: formData.address,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
      })
      onSave(validatedData)
    } catch (error: any) {
      console.error('Ошибка валидации формы компании:', error)
      if (!isInlineView) {
        if (error.errors) {
          alert(`Ошибка заполнения: ${error.errors[0].message}`)
        } else {
          alert('Заполните все обязательные поля')
        }
      }
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Автосохранение для инлайн-режима
    if (isInlineView) {
      setTimeout(() => {
        saveFormData()
      }, 500) // Дебаунс 500мс
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${isInlineView ? 'p-3 bg-white rounded-md border border-gray-100' : 'p-4 bg-gray-50 rounded-lg border border-gray-200'}`}>
      {/* Основные данные компании */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
          Название компании <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          required
          className={`${isInlineView ? 'h-9 px-3 text-sm' : 'h-12 px-4 text-base'} border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200`}
          placeholder="Введите название компании"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="legalName" className="text-sm font-semibold text-gray-700">
          Юридическое название <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="legalName"
          value={formData.legalName}
          onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="Введите юридическое название"
        />
      </div>

      {/* ИНН, КПП, ОГРН */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inn" className="text-sm font-semibold text-gray-700">
            ИНН <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="inn"
            value={formData.inn}
            onChange={(e) => setFormData(prev => ({ ...prev, inn: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="1234567890"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kpp" className="text-sm font-semibold text-gray-700">
            КПП <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="kpp"
            value={formData.kpp}
            onChange={(e) => setFormData(prev => ({ ...prev, kpp: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="123456789"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ogrn" className="text-sm font-semibold text-gray-700">
          ОГРН <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="ogrn"
          value={formData.ogrn}
          onChange={(e) => setFormData(prev => ({ ...prev, ogrn: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="1234567890123"
        />
      </div>

      {/* Адрес */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
          Юридический адрес <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="г. Москва, ул. Примерная, д. 1, оф. 100"
        />
      </div>

      {/* Банковские реквизиты */}
      <div className="space-y-4 pt-4 border-t border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800">Банковские реквизиты</h3>

        <div className="space-y-2">
          <Label htmlFor="bankName" className="text-sm font-semibold text-gray-700">
            Название банка <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="Сбербанк России"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccount" className="text-sm font-semibold text-gray-700">
            Расчетный счет <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="bankAccount"
            value={formData.bankAccount}
            onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="40702810123456789012"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bik" className="text-sm font-semibold text-gray-700">
              БИК <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="bik"
              value={formData.bik}
              onChange={(e) => setFormData(prev => ({ ...prev, bik: e.target.value }))}
              required
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="044525225"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correspondentAccount" className="text-sm font-semibold text-gray-700">
              Корр. счет <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="correspondentAccount"
              value={formData.correspondentAccount}
              onChange={(e) => setFormData(prev => ({ ...prev, correspondentAccount: e.target.value }))}
              required
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="30101810123456789012"
            />
          </div>
        </div>
      </div>

      {/* Контактные данные */}
      <div className="space-y-4 pt-4 border-t border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800">Контактные данные</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="info@company.ru"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Телефон <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="+7 (495) 123-45-67"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
              Веб-сайт
            </Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="https://www.company.ru"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="director" className="text-sm font-semibold text-gray-700">
              Директор
            </Label>
            <Input
              id="director"
              value={formData.director}
              onChange={(e) => setFormData(prev => ({ ...prev, director: e.target.value }))}
              className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="Иванов И.И."
            />
          </div>
        </div>
      </div>

      {!isInlineView && (
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 text-base font-medium">
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button type="submit" className="flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Сохранить
          </Button>
        </div>
      )}
      {isInlineView && (
        <div className="flex justify-end pt-2">
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-3 w-3 mr-1" />
            Сохранить изменения
          </Button>
        </div>
      )}
    </form>
  )
}

export default CompanyForm