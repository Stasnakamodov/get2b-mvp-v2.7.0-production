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
  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-4 w-full">
        <div
          className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 col-span-3 ring-4 ${colors.container}`}
          onClick={() => onPreview('requisites', data)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ${colors.icon}`}>
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">
                {getTitle(data.type)}
              </div>
              <div className="text-xs text-gray-500">
                {getSubtitle(data.type)}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-800">{getLabel(data.type)}</div>
          <div className="text-xs text-gray-500">{getValue(data)}</div>
          <div className={`text-xs mt-2 flex items-center gap-1 font-bold ${colors.text}`}>
            <span>ЗАПОЛНЕНО</span>
            <CheckCircle2 className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  )
}
