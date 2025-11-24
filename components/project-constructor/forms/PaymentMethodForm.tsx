'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eraser, Eye } from 'lucide-react'
import type { FormProps } from '@/types/project-constructor.types'

// Старый интерфейс для PaymentMethodForm (до рефакторинга типов)
interface LegacyPaymentMethodData {
  method: string
  supplier: string
  suggested?: boolean
  source?: string
}

interface PaymentMethodFormProps extends FormProps<LegacyPaymentMethodData> {
  getStepData?: (stepId: number) => any
}

const PaymentMethodForm = ({ onSave, onCancel, initialData, getStepData }: PaymentMethodFormProps) => {
  const [method, setMethod] = useState(initialData?.method || '')
  const [supplier, setSupplier] = useState(initialData?.supplier || '')

  // 🔥 НОВОЕ: Автоматически получаем поставщика из шага 2, если его нет в initialData
  useEffect(() => {
    if (!supplier && !initialData?.supplier && getStepData) {
      const step2Data = getStepData(2);
      if (step2Data?.supplier) {
        setSupplier(step2Data.supplier);
      }
    }
  }, [supplier, initialData?.supplier, getStepData]);

  // 🔥 ДОПОЛНИТЕЛЬНО: Обновляем поставщика при изменении данных шага 2
  useEffect(() => {
    if (getStepData) {
      const step2Data = getStepData(2);
      if (step2Data?.supplier && step2Data.supplier !== supplier) {
        setSupplier(step2Data.supplier);
      }
    }
  }, [getStepData, supplier]);

  // 🔥 ПРИНУДИТЕЛЬНО: Обновляем поставщика при каждом рендере, если он пустой
  useEffect(() => {
    if (getStepData && !supplier) {
      const step2Data = getStepData(2);
      if (step2Data?.supplier) {
        setSupplier(step2Data.supplier);
      }
    }
  });

  // Если есть предложение из OCR, показываем его
  const hasSuggestion = initialData?.suggested && initialData?.source === 'ocr_invoice';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (method) {
      onSave({ method, supplier, suggested: false, source: 'manual' })
    }
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
          <div className="bg-white border border-blue-300 rounded p-3">
            <span className="text-sm font-medium">Банковский перевод</span>
            <p className="text-xs text-gray-600 mt-1">
              Рекомендуется для международных платежей
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="method">Способ оплаты *</Label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Выберите способ оплаты</option>
          <option value="bank-transfer">Банковский перевод</option>
          <option value="p2p">P2P платеж</option>
          <option value="crypto">Криптовалюта</option>
        </select>
        </div>

        <div>
          <Label htmlFor="supplier">Поставщик</Label>
          <Input
            id="supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Введите название поставщика"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Сохранить и вернуться
        </Button>
        <Button type="button" onClick={() => {
          setMethod('')
          setSupplier('')
        }}>
          <Eraser className="h-4 w-4 mr-2" />
          Очистить форму
        </Button>
      </div>
    </form>
  )
}

export default PaymentMethodForm