'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Eraser } from 'lucide-react'
import type { FormProps, ContactsData } from '@/types/project-constructor.types'
import { ContactsDataSchema } from '@/types/project-constructor.types'

interface ContactsFormProps extends FormProps<ContactsData> {
  isInlineView?: boolean
}

const ContactsForm = ({ onSave, onCancel, initialData, isInlineView = false }: ContactsFormProps) => {

  const [formData, setFormData] = useState({
    contact_person: initialData?.contact_person || '',
    position: initialData?.position || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    telegram: initialData?.telegram || '',
    additional_info: initialData?.additional_info || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveFormData()
  }

  const saveFormData = () => {
    // Валидация через Zod схему
    try {
      const validatedData = ContactsDataSchema.parse(formData)
      onSave(validatedData)
    } catch (error: any) {
      console.error('Ошибка валидации формы контактов:', error)
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
      {/* Контактное лицо */}
      <div className="space-y-2">
        <Label htmlFor="contact_person" className="text-sm font-semibold text-gray-700">
          Контактное лицо <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="contact_person"
          value={formData.contact_person}
          onChange={(e) => handleFieldChange('contact_person', e.target.value)}
          required
          className={`${isInlineView ? 'h-9 px-3 text-sm' : 'h-12 px-4 text-base'} border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200`}
          placeholder="Иванов Иван Иванович"
        />
      </div>

      {/* Должность */}
      <div className="space-y-2">
        <Label htmlFor="position" className="text-sm font-semibold text-gray-700">
          Должность
        </Label>
        <Input
          id="position"
          value={formData.position}
          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="Генеральный директор"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Телефон */}
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

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="info@company.ru"
          />
        </div>
      </div>

      {/* Telegram */}
      <div className="space-y-2">
        <Label htmlFor="telegram" className="text-sm font-semibold text-gray-700">
          Telegram
        </Label>
        <Input
          id="telegram"
          value={formData.telegram}
          onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="@username"
        />
      </div>

      {/* Дополнительная информация */}
      <div className="space-y-2">
        <Label htmlFor="additional_info" className="text-sm font-semibold text-gray-700">
          Дополнительная информация
        </Label>
        <Textarea
          id="additional_info"
          value={formData.additional_info}
          onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
          className="min-h-[100px] px-4 py-3 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="Дополнительные контактные данные, комментарии..."
        />
      </div>

      {!isInlineView && (
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={saveFormData} className="flex-1 h-12 text-base font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Сохранить и вернуться
          </Button>
          <Button type="button" onClick={() => {
            setFormData({
              contact_person: '',
              position: '',
              phone: '',
              email: '',
              telegram: '',
              additional_info: ''
            })
          }} className="flex-1 h-12 text-base font-medium bg-red-600 hover:bg-red-700">
            <Eraser className="h-4 w-4 mr-2" />
            Очистить форму
          </Button>
        </div>
      )}
      {isInlineView && (
        <div className="flex justify-end pt-2">
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Eraser className="h-3 w-3 mr-1" />
            Очистить форму
          </Button>
        </div>
      )}
    </form>
  )
}

export default ContactsForm