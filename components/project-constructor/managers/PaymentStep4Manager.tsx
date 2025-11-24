'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CreditCard,
  Building,
  DollarSign,
  Bitcoin,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import PaymentMethodForm from '../forms/PaymentMethodForm'
import type { ExtendedPaymentMethodsData } from '@/types/project-constructor.types'

interface PaymentStep4ManagerProps {
  data: ExtendedPaymentMethodsData | null
  onDataChange: (data: ExtendedPaymentMethodsData) => void
  stepConfig: 'manual' | 'catalog' | 'echo' | 'echoData'
  onStepConfigChange: (config: 'manual' | 'catalog' | 'echo' | 'echoData') => void
  getStepData?: (stepId: number) => any
  supplierData?: any
  echoSuggestions?: any
}

// Типы методов оплаты
type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'crypto' | 'p2p'

// Маппинг иконок для методов оплаты
const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  bank_transfer: <Building className="h-5 w-5" />,
  card: <CreditCard className="h-5 w-5" />,
  cash: <DollarSign className="h-5 w-5" />,
  crypto: <Bitcoin className="h-5 w-5" />,
  p2p: <Smartphone className="h-5 w-5" />
}

// Названия методов оплаты
const paymentNames: Record<PaymentMethod, string> = {
  bank_transfer: 'Банковский перевод',
  card: 'Оплата картой',
  cash: 'Наличные',
  crypto: 'Криптовалюта',
  p2p: 'P2P перевод'
}

const PaymentStep4Manager: React.FC<PaymentStep4ManagerProps> = ({
  data,
  onDataChange,
  stepConfig,
  onStepConfigChange,
  getStepData,
  supplierData,
  echoSuggestions
}) => {
  const [showForm, setShowForm] = useState(false)
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([])
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([])
  const [isAutoFilled, setIsAutoFilled] = useState(false)

  // Загрузка доступных методов оплаты из данных поставщика
  useEffect(() => {
    if (supplierData?.payment_methods) {
      setAvailableMethods(supplierData.payment_methods)

      // Автоматически выбираем первый доступный метод
      if (!data && supplierData.payment_methods.length > 0) {
        handleMethodSelect(supplierData.payment_methods[0])
        setIsAutoFilled(true)
        onStepConfigChange('catalog')
      }
    }
  }, [supplierData])

  // Загрузка эхо предложений
  useEffect(() => {
    if (echoSuggestions?.payment_methods) {
      if (!data) {
        setAvailableMethods(echoSuggestions.payment_methods)
        onStepConfigChange('echo')
      }
    }
  }, [echoSuggestions])

  // Проверка заполненности шага
  const isStepFilled = useCallback(() => {
    return !!(data?.methods && data.methods.length > 0)
  }, [data])

  // Проверка доступности метода оплаты
  const checkMethodAvailability = useCallback((method: PaymentMethod): boolean => {
    if (!supplierData) return true

    // Проверяем наличие соответствующих данных для метода
    switch(method) {
      case 'bank_transfer':
        return !!(supplierData.bank_accounts?.length > 0)
      case 'card':
        return !!(supplierData.payment_methods?.includes('card'))
      case 'p2p':
        return !!(supplierData.p2p_cards?.length > 0)
      case 'crypto':
        return !!(supplierData.crypto_wallets?.length > 0)
      case 'cash':
        return !!(supplierData.payment_methods?.includes('cash'))
      default:
        return false
    }
  }, [supplierData])

  // Обработка выбора метода оплаты
  const handleMethodSelect = useCallback((method: PaymentMethod) => {
    const newMethods = selectedMethods.includes(method)
      ? selectedMethods.filter(m => m !== method)
      : [...selectedMethods, method]

    setSelectedMethods(newMethods)

    // Обновляем данные
    const updatedData: ExtendedPaymentMethodsData = {
      payment_methods: newMethods,
      methods: newMethods,
      primary_method: newMethods[0] || null,
      bank_details: supplierData?.bank_accounts?.[0] || null,
      card_details: supplierData?.p2p_cards?.[0] || null,
      crypto_details: supplierData?.crypto_wallets?.[0] || null,
      user_choice: true,
      auto_filled: isAutoFilled
    }

    onDataChange(updatedData)
    onStepConfigChange('manual')
  }, [selectedMethods, supplierData, isAutoFilled, onDataChange, onStepConfigChange])

  // Обработка сохранения данных из формы
  const handleFormSave = useCallback((formData: any) => {
    const updatedData: ExtendedPaymentMethodsData = {
      payment_methods: [formData.method],
      methods: [formData.method],
      primary_method: formData.method,
      bank_details: null,
      card_details: null,
      crypto_details: null,
      user_choice: true,
      auto_filled: false
    }

    onDataChange(updatedData)
    onStepConfigChange('manual')
    setShowForm(false)
  }, [onDataChange, onStepConfigChange])

  // Очистка данных шага
  const clearStepData = useCallback(() => {
    setSelectedMethods([])
    onDataChange(null as any)
    onStepConfigChange('manual')
    setIsAutoFilled(false)
  }, [onDataChange, onStepConfigChange])

  // Рендеринг статуса шага
  const renderStepStatus = () => {
    if (!isStepFilled()) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Выберите способ оплаты</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">
          {selectedMethods.length} {selectedMethods.length === 1 ? 'способ' : 'способа'} выбрано
        </span>
      </div>
    )
  }

  // Основной рендер
  return (
    <div className="space-y-4">
      {/* Заголовок и статус */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Шаг 4: Способы оплаты</h3>
        {renderStepStatus()}
      </div>

      {/* Информация о поставщике */}
      {supplierData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Поставщик: {supplierData.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Доступные методы оплаты настроены автоматически
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Выбор методов оплаты */}
      {!showForm && (
        <div className="space-y-3">
          {/* Доступные методы */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(paymentNames).map(([method, name]) => {
              const isAvailable = checkMethodAvailability(method as PaymentMethod)
              const isSelected = selectedMethods.includes(method as PaymentMethod)

              return (
                <Card
                  key={method}
                  className={`
                    cursor-pointer transition-all duration-200
                    ${isAvailable ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'}
                    ${isSelected ? 'border-blue-500 bg-blue-50' : ''}
                  `}
                  onClick={() => isAvailable && handleMethodSelect(method as PaymentMethod)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-lg
                        ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {paymentIcons[method as PaymentMethod]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{name}</p>
                        {!isAvailable && (
                          <p className="text-xs text-red-500">Недоступно</p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowForm(true)}
              className="flex-1"
            >
              Ручной ввод
            </Button>
            {isStepFilled() && (
              <Button
                variant="outline"
                onClick={clearStepData}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Очистить
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Форма ручного ввода */}
      {showForm && (
        <PaymentMethodForm
          onSave={handleFormSave}
          onCancel={() => setShowForm(false)}
          initialData={data as any}
          getStepData={getStepData}
        />
      )}

      {/* Детали выбранных методов */}
      {isStepFilled() && !showForm && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-3">Выбранные методы:</h4>
            <div className="space-y-2">
              {selectedMethods.map((method, index) => (
                <div key={method} className="flex items-center gap-2">
                  <span className="text-gray-400">{index + 1}.</span>
                  <div className="p-1 bg-white rounded">
                    {paymentIcons[method]}
                  </div>
                  <span className="text-sm font-medium">
                    {paymentNames[method]}
                  </span>
                  {index === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Основной
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PaymentStep4Manager