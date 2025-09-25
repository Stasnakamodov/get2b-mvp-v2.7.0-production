'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Save, Eye } from 'lucide-react'
import type { FormProps } from '@/types/project-constructor.types'

// Старый интерфейс для RequisitesForm (до рефакторинга типов)
interface LegacyRequisitesData {
  bankName: string
  accountNumber: string
  swift: string
  recipientName: string
  recipientAddress: string
  transferCurrency: string
  supplier: string
  suggested?: boolean
  source?: string
}

interface RequisitesFormProps extends FormProps<LegacyRequisitesData> {}

const RequisitesForm = ({ onSave, onCancel, initialData }: RequisitesFormProps) => {
  const [formData, setFormData] = useState({
    bankName: initialData?.bankName || '',
    accountNumber: initialData?.accountNumber || '',
    swift: initialData?.swift || '',
    recipientName: initialData?.recipientName || '',
    recipientAddress: initialData?.recipientAddress || '',
    transferCurrency: initialData?.transferCurrency || 'USD',
    supplier: initialData?.supplier || initialData?.recipientName || ''
  })

  // 🔥 НОВОЕ: Автоматически заполняем поставщика из получателя
  useEffect(() => {
    if (formData.recipientName && !formData.supplier) {
      setFormData(prev => ({ ...prev, supplier: formData.recipientName }));
    }
  }, [formData.recipientName, formData.supplier]);

  // Если есть предложение из OCR, показываем его
  const hasSuggestion = initialData?.suggested && initialData?.source === 'ocr_invoice';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...formData, suggested: false, source: 'manual' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Показываем предложение из OCR */}
      {hasSuggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Предложение из инвойса</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            На основе банковских реквизитов в инвойсе предлагаем:
          </p>
          <div className="bg-white border border-blue-300 rounded p-3 space-y-2">
            {initialData?.accountNumber && (
              <div>
                <span className="text-xs text-gray-600">Номер счета:</span>
                <p className="text-sm font-medium">{initialData.accountNumber}</p>
              </div>
            )}
            {initialData?.swift && (
              <div>
                <span className="text-xs text-gray-600">SWIFT код:</span>
                <p className="text-sm font-medium">{initialData.swift}</p>
              </div>
            )}
            {initialData?.recipientName && (
              <div>
                <span className="text-xs text-gray-600">Получатель:</span>
                <p className="text-sm font-medium">{initialData.recipientName}</p>
              </div>
            )}
            {initialData?.transferCurrency && (
              <div>
                <span className="text-xs text-gray-600">Валюта:</span>
                <p className="text-sm font-medium">{initialData.transferCurrency}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bankName">Название банка</Label>
          <Input
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
            placeholder="Введите название банка"
          />
        </div>
        <div>
          <Label htmlFor="accountNumber">Номер счета *</Label>
          <Input
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
            required
            placeholder="Введите номер счета"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="swift">SWIFT/BIC код</Label>
        <Input
          id="swift"
          value={formData.swift}
          onChange={(e) => setFormData(prev => ({ ...prev, swift: e.target.value }))}
          placeholder="Введите SWIFT/BIC код"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipientName">Полное наименование получателя</Label>
          <Input
            id="recipientName"
            value={formData.recipientName}
            onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
            placeholder="Введите название получателя"
          />
        </div>
        <div>
          <Label htmlFor="supplier">Поставщик</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            placeholder="Введите название поставщика"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="recipientAddress">Юридический адрес получателя</Label>
        <Textarea
          id="recipientAddress"
          value={formData.recipientAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
          placeholder="Введите адрес получателя"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="transferCurrency">Валюта перевода</Label>
        <select
          id="transferCurrency"
          value={formData.transferCurrency}
          onChange={(e) => setFormData(prev => ({ ...prev, transferCurrency: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USD">USD - Доллар США</option>
          <option value="EUR">EUR - Евро</option>
          <option value="RUB">RUB - Российский рубль</option>
          <option value="CNY">CNY - Китайский юань</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  )
}

export default RequisitesForm