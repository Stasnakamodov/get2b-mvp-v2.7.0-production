'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eraser } from 'lucide-react'
import type { FormProps, BankData } from '@/types/project-constructor.types'
import { BankDataSchema } from '@/types/project-constructor.types'

const BankForm = ({ onSave, onCancel, initialData }: FormProps<BankData>) => {

  const [formData, setFormData] = useState({
    bank_name: initialData?.bank_name || '',
    bank_account: initialData?.bank_account || '',
    corr_account: initialData?.corr_account || '',
    bik: initialData?.bik || '',
    inn: initialData?.inn || '',
    kpp: initialData?.kpp || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Валидация через Zod схему
    try {
      const validatedData = BankDataSchema.parse(formData)
      onSave(validatedData)
    } catch (error: any) {
      console.error('Ошибка валидации формы банковских данных:', error)
      if (error.errors) {
        alert(`Ошибка заполнения: ${error.errors[0].message}`)
      } else {
        alert('Заполните все обязательные поля')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Название банка */}
      <div className="space-y-2">
        <Label htmlFor="bank_name" className="text-sm font-semibold text-gray-700">
          Название банка <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="bank_name"
          value={formData.bank_name}
          onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="Сбербанк России"
        />
      </div>

      {/* Расчетный счет */}
      <div className="space-y-2">
        <Label htmlFor="bank_account" className="text-sm font-semibold text-gray-700">
          Расчетный счет <span className="text-red-500 font-bold">*</span>
        </Label>
        <Input
          id="bank_account"
          value={formData.bank_account}
          onChange={(e) => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
          required
          className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="40702810123456789012"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Корреспондентский счет */}
        <div className="space-y-2">
          <Label htmlFor="corr_account" className="text-sm font-semibold text-gray-700">
            Корр. счет <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            id="corr_account"
            value={formData.corr_account}
            onChange={(e) => setFormData(prev => ({ ...prev, corr_account: e.target.value }))}
            required
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="30101810123456789012"
          />
        </div>

        {/* БИК */}
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ИНН */}
        <div className="space-y-2">
          <Label htmlFor="inn" className="text-sm font-semibold text-gray-700">
            ИНН
          </Label>
          <Input
            id="inn"
            value={formData.inn}
            onChange={(e) => setFormData(prev => ({ ...prev, inn: e.target.value }))}
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="1234567890"
          />
        </div>

        {/* КПП */}
        <div className="space-y-2">
          <Label htmlFor="kpp" className="text-sm font-semibold text-gray-700">
            КПП
          </Label>
          <Input
            id="kpp"
            value={formData.kpp}
            onChange={(e) => setFormData(prev => ({ ...prev, kpp: e.target.value }))}
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="123456789"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleSubmit} className="flex-1 h-12 text-base font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Сохранить и вернуться
        </Button>
        <Button type="button" onClick={() => {
          setFormData({
            bank_name: '',
            bank_account: '',
            corr_account: '',
            bik: '',
            inn: '',
            kpp: ''
          })
        }} className="flex-1 h-12 text-base font-medium bg-red-600 hover:bg-red-700">
          <Eraser className="h-4 w-4 mr-2" />
          Очистить форму
        </Button>
      </div>
    </form>
  )
}

export default BankForm