'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eraser, Plus, Minus } from 'lucide-react'
import type { FormProps, SpecificationData, SpecificationItem } from '@/types/project-constructor.types'
import { SpecificationDataSchema } from '@/types/project-constructor.types'

const SpecificationForm = ({ onSave, onCancel, initialData }: FormProps<SpecificationData>) => {

  const [formData, setFormData] = useState({
    items: (initialData?.items || [{
      item_name: '',
      quantity: 1,
      unit: 'шт',
      price: 0,
      total: 0,
      supplier_name: '',
      supplier_id: '',
      notes: ''
    }]).map(item => ({
      ...item,
      unit: item.unit || 'шт'  // ← Добавляем дефолтное значение для старых товаров
    })) as SpecificationItem[],
    total_amount: initialData?.total_amount || 0,
    currency: initialData?.currency || 'RUB',
    notes: initialData?.notes || ''
  })

  // Обновляем форму при изменении initialData
  useEffect(() => {
    if (initialData) {
      const newFormData = {
        items: (initialData.items || [{
          item_name: '',
          quantity: 1,
          unit: 'шт',
          price: 0,
          total: 0,
          supplier_name: '',
          supplier_id: '',
          notes: ''
        }]).map(item => ({
          ...item,
          unit: item.unit || 'шт'  // ← Добавляем дефолтное значение для старых товаров
        })),
        total_amount: initialData.total_amount || 0,
        currency: initialData.currency || 'RUB',
        notes: initialData.notes || ''
      };
      setFormData(newFormData);
    }
  }, [initialData]);

  // Пересчитываем общую сумму при изменении товаров
  useEffect(() => {
    const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0)
    setFormData(prev => ({ ...prev, total_amount: totalAmount }))
  }, [formData.items])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Очищаем пустые optional поля перед валидацией
    const cleanedData = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        supplier_name: item.supplier_name || undefined,
        supplier_id: item.supplier_id || undefined,
        notes: item.notes || undefined,
      })),
      notes: formData.notes || undefined,
    }

    // Валидация через Zod схему
    try {
      const validatedData = SpecificationDataSchema.parse(cleanedData)
      onSave(validatedData)
    } catch (error: any) {
      console.error('❌ [VALIDATION] Ошибка валидации формы спецификации:', error)
      if (error.errors) {
        console.error('❌ [VALIDATION] Все ошибки:', error.errors)
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('\n')
        alert(`Ошибка заполнения:\n${errorMessages}`)
      } else {
        alert('Заполните все обязательные поля')
      }
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        item_name: '',
        quantity: 1,
        unit: 'шт',
        price: 0,
        total: 0,
        supplier_name: '',
        supplier_id: '',
        notes: ''
      }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const updateItem = (index: number, field: keyof SpecificationItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          // Автоматически пересчитываем total при изменении quantity или price
          if (field === 'quantity' || field === 'price') {
            updatedItem.total = updatedItem.quantity * updatedItem.price
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Валюта и общие заметки */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-sm font-semibold text-gray-700">
            Валюта
          </Label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="h-12 px-4 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-md w-full bg-white"
          >
            <option value="RUB">RUB - Российский рубль</option>
            <option value="USD">USD - Доллар США</option>
            <option value="EUR">EUR - Евро</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Общая сумма
          </Label>
          <div className="h-12 px-4 bg-gray-100 border-2 border-gray-300 rounded-md flex items-center text-base font-semibold">
            {formData.total_amount.toLocaleString('ru-RU')} {formData.currency}
          </div>
        </div>
      </div>

      {/* Товары */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold text-gray-800">
            Товары <span className="text-red-500 font-bold">*</span>
          </Label>
          <Button type="button" variant="outline" onClick={addItem} className="text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Добавить товар
          </Button>
        </div>

        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
              {/* Название товара и единица измерения */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Название товара <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={item.item_name}
                    onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                    placeholder="Введите название товара"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Единица <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    placeholder="шт"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Количество, цена, сумма */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Количество <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Цена <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Сумма
                  </Label>
                  <div className="h-10 px-3 bg-gray-100 border border-gray-300 rounded-md flex items-center text-sm font-semibold">
                    {item.total.toLocaleString('ru-RU')}
                  </div>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="h-10 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Поставщик и заметки */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Поставщик
                  </Label>
                  <Input
                    value={item.supplier_name || ''}
                    onChange={(e) => updateItem(index, 'supplier_name', e.target.value)}
                    placeholder="Название поставщика"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Заметки
                  </Label>
                  <Input
                    value={item.notes || ''}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    placeholder="Дополнительная информация"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Общие заметки */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
          Заметки к спецификации
        </Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full min-h-[100px] px-4 py-3 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-md resize-vertical"
          placeholder="Дополнительные комментарии к спецификации..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleSubmit} className="flex-1 h-12 text-base font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Сохранить и вернуться
        </Button>
        <Button type="button" onClick={() => {
          setFormData({
            items: [{
              item_name: '',
              quantity: 1,
              unit: 'шт',
              price: 0,
              total: 0,
              supplier_name: '',
              supplier_id: '',
              notes: ''
            }],
            total_amount: 0,
            currency: 'RUB',
            notes: ''
          })
        }} className="flex-1 h-12 text-base font-medium bg-red-600 hover:bg-red-700">
          <Eraser className="h-4 w-4 mr-2" />
          Очистить форму
        </Button>
      </div>
    </form>
  )
}

export default SpecificationForm