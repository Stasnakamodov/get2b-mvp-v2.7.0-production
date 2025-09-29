'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Building,
  CreditCard,
  Bitcoin,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react'
import RequisitesForm from '../forms/RequisitesForm'
import type { ExtendedRequisitesData } from '@/types/project-constructor.types'

interface RequisitesStep5ManagerProps {
  data: ExtendedRequisitesData | null
  onDataChange: (data: ExtendedRequisitesData) => void
  stepConfig: 'manual' | 'catalog' | 'echo' | 'echoData'
  onStepConfigChange: (config: 'manual' | 'catalog' | 'echo' | 'echoData') => void
  getStepData?: (stepId: number) => any
  supplierData?: any
  echoSuggestions?: any
}

// Типы реквизитов
type RequisiteType = 'bank_account' | 'p2p_card' | 'crypto_wallet' | 'cash'

// Маппинг иконок для типов реквизитов
const requisiteIcons: Record<RequisiteType, React.ReactNode> = {
  bank_account: <Building className="h-5 w-5" />,
  p2p_card: <CreditCard className="h-5 w-5" />,
  crypto_wallet: <Bitcoin className="h-5 w-5" />,
  cash: <FileText className="h-5 w-5" />
}

// Названия типов реквизитов
const requisiteNames: Record<RequisiteType, string> = {
  bank_account: 'Банковский счет',
  p2p_card: 'P2P карта',
  crypto_wallet: 'Крипто-кошелек',
  cash: 'Наличные'
}

const RequisitesStep5Manager: React.FC<RequisitesStep5ManagerProps> = ({
  data,
  onDataChange,
  stepConfig,
  onStepConfigChange,
  getStepData,
  supplierData,
  echoSuggestions
}) => {
  const [showForm, setShowForm] = useState(false)
  const [selectedRequisites, setSelectedRequisites] = useState<any[]>([])
  const [isAutoFilled, setIsAutoFilled] = useState(false)
  const [expandedRequisite, setExpandedRequisite] = useState<number | null>(null)

  // Загрузка реквизитов из данных поставщика
  useEffect(() => {
    if (supplierData) {
      console.log('🔍 [STEP 5] Загружены реквизиты поставщика:', supplierData)

      // Собираем все доступные реквизиты
      const requisites: any[] = []

      // Банковские счета
      if (supplierData.bank_accounts?.length > 0) {
        supplierData.bank_accounts.forEach((account: any) => {
          requisites.push({
            type: 'bank_account',
            name: account.bank_name || 'Банковский счет',
            details: account,
            primary: requisites.length === 0
          })
        })
      }

      // P2P карты
      if (supplierData.p2p_cards?.length > 0) {
        supplierData.p2p_cards.forEach((card: any) => {
          requisites.push({
            type: 'p2p_card',
            name: card.bank_name || 'P2P карта',
            details: card,
            primary: requisites.length === 0
          })
        })
      }

      // Крипто-кошельки
      if (supplierData.crypto_wallets?.length > 0) {
        supplierData.crypto_wallets.forEach((wallet: any) => {
          requisites.push({
            type: 'crypto_wallet',
            name: wallet.currency || 'Крипто-кошелек',
            details: wallet,
            primary: requisites.length === 0
          })
        })
      }

      if (requisites.length > 0 && !data) {
        setSelectedRequisites(requisites)
        handleRequisitesUpdate(requisites)
        setIsAutoFilled(true)
        onStepConfigChange('catalog')
      }
    }
  }, [supplierData])

  // Загрузка эхо предложений
  useEffect(() => {
    if (echoSuggestions?.requisites) {
      console.log('📊 [STEP 5] Найдены эхо предложения реквизитов:', echoSuggestions.requisites)
      if (!data) {
        setSelectedRequisites(echoSuggestions.requisites)
        handleRequisitesUpdate(echoSuggestions.requisites)
        onStepConfigChange('echo')
      }
    }
  }, [echoSuggestions])

  // Синхронизация с шагом 4 (методы оплаты)
  useEffect(() => {
    if (getStepData) {
      const step4Data = getStepData(4)
      if (step4Data?.primary_method && supplierData) {
        console.log('🔄 [STEP 5] Синхронизация с выбранным методом оплаты:', step4Data.primary_method)

        // Фильтруем реквизиты в соответствии с выбранным методом
        const filteredRequisites = selectedRequisites.filter(req => {
          if (step4Data.primary_method === 'bank_transfer') return req.type === 'bank_account'
          if (step4Data.primary_method === 'p2p') return req.type === 'p2p_card'
          if (step4Data.primary_method === 'crypto') return req.type === 'crypto_wallet'
          return true
        })

        if (filteredRequisites.length !== selectedRequisites.length) {
          setSelectedRequisites(filteredRequisites)
          handleRequisitesUpdate(filteredRequisites)
        }
      }
    }
  }, [getStepData, supplierData])

  // Проверка заполненности шага
  const isStepFilled = useCallback(() => {
    return !!(data?.requisites && data.requisites.length > 0)
  }, [data])

  // Обновление данных реквизитов
  const handleRequisitesUpdate = useCallback((requisites: any[]) => {
    const primaryRequisite = requisites.find(r => r.primary) || requisites[0] || null

    const updatedData: ExtendedRequisitesData = {
      // Обязательные поля из RequisitesDataSchema
      recipient_name: primaryRequisite?.name || '',
      recipient_inn: primaryRequisite?.inn || '',
      recipient_kpp: primaryRequisite?.kpp || '',
      recipient_address: primaryRequisite?.address || '',
      recipient_bank_name: primaryRequisite?.bank_name || '',
      recipient_account: primaryRequisite?.account || '',
      recipient_bik: primaryRequisite?.bik || '',
      payment_purpose: 'Оплата по договору',

      // Дополнительные поля
      requisites: requisites,
      primary_requisite: primaryRequisite,
      bank_details: requisites.find(r => r.type === 'bank_account')?.details || null,
      p2p_details: requisites.find(r => r.type === 'p2p_card')?.details || null,
      crypto_details: requisites.find(r => r.type === 'crypto_wallet')?.details || null,
      user_choice: true,
      auto_filled: isAutoFilled
    }

    onDataChange(updatedData)
  }, [isAutoFilled, onDataChange])

  // Обработка добавления реквизита
  const handleAddRequisite = useCallback((type: RequisiteType) => {
    setShowForm(true)
    // Передаем тип в форму через временное состояние
  }, [])

  // Обработка удаления реквизита
  const handleRemoveRequisite = useCallback((index: number) => {
    const newRequisites = selectedRequisites.filter((_, i) => i !== index)
    setSelectedRequisites(newRequisites)
    handleRequisitesUpdate(newRequisites)
  }, [selectedRequisites, handleRequisitesUpdate])

  // Обработка установки основного реквизита
  const handleSetPrimary = useCallback((index: number) => {
    const newRequisites = selectedRequisites.map((req, i) => ({
      ...req,
      primary: i === index
    }))
    setSelectedRequisites(newRequisites)
    handleRequisitesUpdate(newRequisites)
  }, [selectedRequisites, handleRequisitesUpdate])

  // Обработка сохранения данных из формы
  const handleFormSave = useCallback((formData: any) => {
    const newRequisite = {
      type: 'bank_account', // Временно, нужно определять из формы
      name: formData.bankName || 'Новые реквизиты',
      details: formData,
      primary: selectedRequisites.length === 0
    }

    const newRequisites = [...selectedRequisites, newRequisite]
    setSelectedRequisites(newRequisites)
    handleRequisitesUpdate(newRequisites)
    onStepConfigChange('manual')
    setShowForm(false)
  }, [selectedRequisites, handleRequisitesUpdate, onStepConfigChange])

  // Копирование реквизитов в буфер
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    // Можно добавить toast уведомление
  }, [])

  // Очистка данных шага
  const clearStepData = useCallback(() => {
    setSelectedRequisites([])
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
          <span className="text-sm">Добавьте реквизиты для оплаты</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">
          {selectedRequisites.length} {selectedRequisites.length === 1 ? 'реквизит' : 'реквизита'} добавлено
        </span>
      </div>
    )
  }

  // Рендеринг деталей реквизита
  const renderRequisiteDetails = (requisite: any) => {
    const details = requisite.details

    if (requisite.type === 'bank_account') {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Банк:</span>
            <span className="font-medium">{details.bank_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Счет:</span>
            <div className="flex items-center gap-1">
              <span className="font-mono">{details.account_number}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(details.account_number)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {details.bik && (
            <div className="flex justify-between">
              <span className="text-gray-500">БИК:</span>
              <span className="font-mono">{details.bik}</span>
            </div>
          )}
        </div>
      )
    }

    if (requisite.type === 'p2p_card') {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Банк:</span>
            <span className="font-medium">{details.bank_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Карта:</span>
            <div className="flex items-center gap-1">
              <span className="font-mono">{details.card_number}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(details.card_number)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {details.holder_name && (
            <div className="flex justify-between">
              <span className="text-gray-500">Владелец:</span>
              <span>{details.holder_name}</span>
            </div>
          )}
        </div>
      )
    }

    if (requisite.type === 'crypto_wallet') {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Валюта:</span>
            <span className="font-medium">{details.currency}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Адрес:</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs">{details.address?.slice(0, 20)}...</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(details.address)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  // Основной рендер
  return (
    <div className="space-y-4">
      {/* Заголовок и статус */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Шаг 5: Реквизиты для оплаты</h3>
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
                  Реквизиты загружены автоматически из каталога
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список реквизитов */}
      {!showForm && selectedRequisites.length > 0 && (
        <div className="space-y-3">
          {selectedRequisites.map((requisite, index) => (
            <Card
              key={index}
              className={`
                ${requisite.primary ? 'border-blue-500' : ''}
                ${expandedRequisite === index ? 'shadow-md' : ''}
              `}
            >
              <CardContent className="p-4">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedRequisite(expandedRequisite === index ? null : index)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg
                      ${requisite.primary ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {requisiteIcons[requisite.type as RequisiteType]}
                    </div>
                    <div>
                      <p className="font-medium">{requisite.name}</p>
                      <p className="text-sm text-gray-500">
                        {requisiteNames[requisite.type as RequisiteType]}
                      </p>
                      {requisite.primary && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
                          Основной
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!requisite.primary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetPrimary(index)
                        }}
                      >
                        Сделать основным
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveRequisite(index)
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>

                {/* Развернутые детали */}
                {expandedRequisite === index && (
                  <div className="mt-4 pt-4 border-t">
                    {renderRequisiteDetails(requisite)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Кнопки добавления реквизитов */}
      {!showForm && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleAddRequisite('bank_account')}
          >
            <Building className="h-4 w-4 mr-2" />
            Добавить банковский счет
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddRequisite('p2p_card')}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Добавить P2P карту
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddRequisite('crypto_wallet')}
          >
            <Bitcoin className="h-4 w-4 mr-2" />
            Добавить крипто-кошелек
          </Button>
          {isStepFilled() && (
            <Button
              variant="outline"
              onClick={clearStepData}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Очистить все
            </Button>
          )}
        </div>
      )}

      {/* Форма ручного ввода */}
      {showForm && (
        <RequisitesForm
          onSave={handleFormSave}
          onCancel={() => setShowForm(false)}
          initialData={data as any}
        />
      )}
    </div>
  )
}

export default RequisitesStep5Manager