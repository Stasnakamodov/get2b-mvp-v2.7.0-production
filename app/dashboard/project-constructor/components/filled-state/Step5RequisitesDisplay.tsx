'use client'

import React from 'react'
import { Banknote, Eye, CheckCircle2 } from 'lucide-react'

type RequisiteType = 'bank' | 'p2p' | 'crypto'

interface Requisite {
  type: RequisiteType
  crypto_network?: string
  card_bank?: string
  accountNumber?: string
  [key: string]: any
}

interface Step5RequisitesDisplayProps {
  data: any
  onPreview: (type: string, data: any) => void
}

export function Step5RequisitesDisplay({ data, onPreview }: Step5RequisitesDisplayProps) {
  const getTitle = (type: RequisiteType): string => {
    switch (type) {
      case 'crypto': return 'Криптокошелек'
      case 'p2p': return 'Карта поставщика'
      default: return 'Расчетный счет'
    }
  }

  const getSubtitle = (type: RequisiteType): string => {
    switch (type) {
      case 'crypto': return 'Криптореквизиты'
      case 'p2p': return 'P2P реквизиты'
      default: return 'Банковские реквизиты'
    }
  }

  const getLabel = (type: RequisiteType): string => {
    switch (type) {
      case 'crypto': return 'Сеть'
      case 'p2p': return 'Банк карты'
      default: return 'Банк поставщика'
    }
  }

  const getValue = (requisite: Requisite): string => {
    switch (requisite.type) {
      case 'crypto':
        return requisite.crypto_network || 'Не указана'
      case 'p2p':
        return requisite.card_bank || 'Не указан'
      default:
        return requisite.accountNumber || 'Не указано'
    }
  }

  const getColorClasses = (type: RequisiteType) => {
    switch (type) {
      case 'crypto':
        return {
          border: 'border-green-200 hover:border-green-300',
          bg: 'bg-green-500',
          text: 'text-green-600'
        }
      case 'p2p':
        return {
          border: 'border-blue-200 hover:border-blue-300',
          bg: 'bg-blue-500',
          text: 'text-blue-600'
        }
      default:
        return {
          border: 'border-gray-200 hover:border-gray-300',
          bg: 'bg-gray-500',
          text: 'text-gray-600'
        }
    }
  }

  const getSelectedColorClasses = (type: RequisiteType) => {
    switch (type) {
      case 'crypto':
        return {
          container: 'border-green-500 bg-green-100 hover:border-green-600 ring-green-400',
          icon: 'bg-green-600 ring-green-300',
          text: 'text-green-600'
        }
      case 'p2p':
        return {
          container: 'border-blue-500 bg-blue-100 hover:border-blue-600 ring-blue-400',
          icon: 'bg-blue-600 ring-blue-300',
          text: 'text-blue-600'
        }
      default:
        return {
          container: 'border-orange-500 bg-orange-100 hover:border-orange-600 ring-orange-400',
          icon: 'bg-orange-600 ring-orange-300',
          text: 'text-orange-600'
        }
    }
  }

  // Множественные реквизиты
  if (data.type === 'multiple' && data.requisites) {
    return (
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-4 w-full">
          {data.requisites.map((requisite: Requisite, index: number) => {
            const colors = getColorClasses(requisite.type)
            return (
              <div
                key={index}
                className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${colors.border}`}
                onClick={() => onPreview('requisites', requisite)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bg}`}>
                    <Banknote className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {getTitle(requisite.type)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getSubtitle(requisite.type)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-800">{getLabel(requisite.type)}</div>
                <div className="text-xs text-gray-500">{getValue(requisite)}</div>
                <div className={`text-xs mt-2 flex items-center gap-1 ${colors.text}`}>
                  <span>Нажмите для просмотра</span>
                  <Eye className="h-3 w-3" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Одиночный реквизит (выбранный)
  const colors = getSelectedColorClasses(data.type)

  // Формируем детали - ТОЛЬКО самое важное
  const getSupplierName = () => {
    return data.supplier_name || data.recipientName || 'Поставщик'
  }

  const getMainDetails = () => {
    if (data.type === 'crypto') {
      return {
        first: { label: 'Криптовалюта', value: data.crypto_name || 'USDT' },
        second: { label: 'Адрес кошелька', value: data.crypto_address ? `${data.crypto_address.substring(0, 20)}...${data.crypto_address.substring(data.crypto_address.length - 8)}` : 'Не указан', mono: true }
      }
    } else if (data.type === 'p2p') {
      return {
        first: { label: 'Банк карты', value: data.card_bank || 'Не указан' },
        second: { label: 'Номер карты', value: data.card_number ? `**** **** **** ${data.card_number.slice(-4)}` : 'Не указан', mono: true }
      }
    } else {
      // bank
      return {
        first: { label: 'Банк поставщика', value: data.bankName || 'Не указан' },
        second: { label: 'Расчетный счет', value: data.accountNumber || 'Не указан', mono: true }
      }
    }
  }

  const supplierName = getSupplierName()
  const mainDetails = getMainDetails()

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-4 w-full">
        <div
          className={`bg-white border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 col-span-3 ring-4 ${colors.container}`}
          onClick={() => onPreview('requisites', data)}
        >
          {/* Заголовок и статус */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ${colors.icon}`}>
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {getTitle(data.type)}
                </div>
                <div className="text-sm text-gray-500">
                  {getSubtitle(data.type)}
                </div>
              </div>
            </div>
            <div className={`text-base flex items-center gap-2 font-bold ${colors.text}`}>
              <CheckCircle2 className="h-4 w-4" />
              <span>ЗАПОЛНЕНО</span>
            </div>
          </div>

          {/* Название поставщика - КРУПНО */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Поставщик
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {supplierName}
            </div>
          </div>

          {/* Ключевые реквизиты - два поля */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                {mainDetails.first.label}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {mainDetails.first.value}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                {mainDetails.second.label}
              </div>
              <div className={`text-lg font-semibold text-gray-900 ${mainDetails.second.mono ? 'font-mono' : ''}`}>
                {mainDetails.second.value}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
