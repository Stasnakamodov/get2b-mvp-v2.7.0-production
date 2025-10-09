'use client'

import React from 'react'
import { Building, Banknote, Mail, Eye } from 'lucide-react'

interface Step1CompanyCubesProps {
  data: any
  onPreview: (type: string, data: any) => void
}

/**
 * Step 1 Company Data Cubes
 * Displays 3 interactive cubes showing filled company data:
 * - Company info (name, legal details)
 * - Bank account details
 * - Contact information
 */
export function Step1CompanyCubes({ data, onPreview }: Step1CompanyCubesProps) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
      {/* Кубик 1: Данные компании - кликабельный */}
      <div
        className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:scale-105"
        onClick={() => onPreview('company', data)}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Building className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Данные компании</div>
            <div className="text-xs text-gray-500">Основная информация</div>
          </div>
        </div>
        <div className="text-sm text-gray-800 font-medium">{data.name}</div>
        <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
          <span>Нажмите для просмотра</span>
          <Eye className="h-3 w-3" />
        </div>
      </div>

      {/* Кубик 2: Данные расчетного счета - кликабельный */}
      <div
        className="bg-white border-2 border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300 hover:scale-105"
        onClick={() => onPreview('bank', data)}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <Banknote className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Расчетный счет</div>
            <div className="text-xs text-gray-500">Банковские реквизиты</div>
          </div>
        </div>
        <div className="text-sm text-gray-800">{data.bankName}</div>
        {data.bankAccount && (
          <div className="text-xs text-gray-500">{data.bankAccount}</div>
        )}
        <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
          <span>Нажмите для просмотра</span>
          <Eye className="h-3 w-3" />
        </div>
      </div>

      {/* Кубик 3: Дополнительные данные - кликабельный */}
      <div
        className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-purple-300 hover:scale-105"
        onClick={() => onPreview('contacts', data)}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Дополнительно</div>
            <div className="text-xs text-gray-500">Контакты и детали</div>
          </div>
        </div>
        <div className="text-sm text-gray-800">{data.email}</div>
        {data.phone && (
          <div className="text-sm text-gray-800 mt-1">{data.phone}</div>
        )}
        <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
          <span>Нажмите для просмотра</span>
          <Eye className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}
