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

  // Формируем детали для отображения - ВСЕ доступные поля
  const getDetails = () => {
    if (data.type === 'crypto') {
      return [
        { label: 'Криптовалюта', value: data.crypto_name || data.crypto_address?.substring(0, 3).toUpperCase() || 'Не указана', highlight: true },
        { label: 'Адрес кошелька', value: data.crypto_address ? `${data.crypto_address.substring(0, 16)}...${data.crypto_address.substring(data.crypto_address.length - 6)}` : 'Не указан', mono: true },
        { label: 'Сеть блокчейна', value: data.crypto_network || 'Не указана' },
        { label: 'Полный адрес', value: data.crypto_address || 'Не указан', mono: true, small: true }
      ]
    } else if (data.type === 'p2p') {
      return [
        { label: 'Банк-эмитент карты', value: data.card_bank || 'Не указан', highlight: true },
        { label: 'Номер карты', value: data.card_number ? `**** **** **** ${data.card_number.slice(-4)}` : 'Не указан', mono: true },
        { label: 'Владелец карты', value: data.card_holder || 'Не указан' },
        { label: 'Срок действия', value: data.card_expiry || 'Бессрочно' }
      ]
    } else {
      // bank - показываем ВСЕ поля
      return [
        { label: 'Название банка', value: data.bankName || 'Не указан', highlight: true },
        { label: 'Номер счета', value: data.accountNumber || 'Не указан', mono: true },
        { label: 'SWIFT код', value: data.swift || 'Не указан', mono: true },
        { label: 'IBAN', value: data.iban || 'Не указан', mono: true },
        { label: 'Получатель платежа', value: data.recipientName || 'Не указан' },
        { label: 'Валюта счета', value: data.transferCurrency || 'RUB' }
      ]
    }
  }

  const details = getDetails()

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-4 w-full">
        <div
          className={`bg-white border-2 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 col-span-3 ring-4 ${colors.container}`}
          onClick={() => onPreview('requisites', data)}
        >
          {/* Заголовок и статус в одной строке */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ring-2 ${colors.icon}`}>
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800">
                  {getTitle(data.type)}
                </div>
                <div className="text-base text-gray-500">
                  {getSubtitle(data.type)}
                </div>
              </div>
            </div>
            <div className={`text-lg flex items-center gap-2 font-bold ${colors.text}`}>
              <CheckCircle2 className="h-5 w-5" />
              <span>ЗАПОЛНЕНО</span>
            </div>
          </div>

          {/* Детали реквизитов - все доступные поля */}
          <div className="grid grid-cols-3 gap-4">
            {details.map((detail, index) => (
              <div key={index} className="bg-white/70 rounded-lg p-4 border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  {detail.label}
                </div>
                <div
                  className={`font-semibold text-gray-900 break-all ${
                    detail.small ? 'text-xs' : 'text-base'
                  } ${detail.mono ? 'font-mono' : ''} ${
                    detail.highlight ? 'text-orange-600' : ''
                  }`}
                  title={detail.value}
                >
                  {detail.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
