'use client'

import { logger } from "@/src/shared/lib/logger"
import React from 'react'
import { CreditCard, CheckCircle2, CheckCircle } from 'lucide-react'
type PaymentMethod = 'bank-transfer' | 'p2p' | 'crypto'

interface Step4PaymentMethodCubesProps {
  manualData: any
  selectedSupplierData: any
  onMethodSelect: (method: string, supplierData: any) => void
}

export function Step4PaymentMethodCubes({
  manualData,
  selectedSupplierData,
  onMethodSelect
}: Step4PaymentMethodCubesProps) {
  const methods: PaymentMethod[] = ['bank-transfer', 'p2p', 'crypto']

  const getMethodTitle = (method: PaymentMethod): string => {
    switch (method) {
      case 'crypto': return 'Криптовалюта'
      case 'p2p': return 'P2P перевод'
      case 'bank-transfer': return 'Банковский перевод'
    }
  }

  const getMethodSubtitle = (method: PaymentMethod): string => {
    switch (method) {
      case 'crypto': return 'Крипто платеж'
      case 'p2p': return 'P2P платеж'
      case 'bank-transfer': return 'Банковский платеж'
    }
  }

  const isMethodSelected = (method: PaymentMethod): boolean => {
    return manualData[4]?.selectedMethod === method ||
           manualData[4]?.method === method ||
           manualData[4]?.defaultMethod === method
  }

  const hasSupplierDataForMethod = (method: PaymentMethod): boolean => {
    let hasData = false

    // Приоритет 1: Проверяем selectedSupplierData (самый актуальный источник)
    if (selectedSupplierData) {
      if (method === 'bank-transfer' &&
          (selectedSupplierData.bank_accounts?.length > 0 ||
           selectedSupplierData.payment_methods?.includes('bank-transfer' as any))) {
        hasData = true
      }
      if (method === 'p2p' &&
          (selectedSupplierData.p2p_cards?.length > 0 ||
           selectedSupplierData.payment_methods?.includes('p2p'))) {
        hasData = true
      }
      if (method === 'crypto' &&
          (selectedSupplierData.crypto_wallets?.length > 0 ||
           selectedSupplierData.payment_methods?.includes('crypto'))) {
        hasData = true
      }
    }

    // Приоритет 2: Проверяем через manualData[4] (если selectedSupplierData недоступен)
    if (!hasData && manualData[4]) {
      // Проверяем по методам из manualData[4] (из каталога)
      if (manualData[4].methods && manualData[4].methods.includes(method)) {
        hasData = true
      }
      // Проверяем по доступным данным поставщика в manualData[4]
      if (!hasData && manualData[4].supplier_data) {
        const supplier = manualData[4].supplier_data
        if (method === 'bank-transfer' &&
            (supplier.bank_accounts?.length > 0 ||
             supplier.payment_methods?.includes('bank-transfer' as any))) {
          hasData = true
        }
        if (method === 'p2p' &&
            (supplier.p2p_cards?.length > 0 ||
             supplier.payment_methods?.includes('p2p'))) {
          hasData = true
        }
        if (method === 'crypto' &&
            (supplier.crypto_wallets?.length > 0 ||
             supplier.payment_methods?.includes('crypto'))) {
          hasData = true
        }
      }
    }

    logger.info('🔍 [DEBUG] Method Check:', {
      method,
      hasSupplierData: hasData,
      manualData4: manualData[4],
      selectedSupplierData: {
        name: selectedSupplierData?.name,
        payment_methods: selectedSupplierData?.payment_methods,
        bank_accounts: selectedSupplierData?.bank_accounts,
        p2p_cards: selectedSupplierData?.p2p_cards,
        crypto_wallets: selectedSupplierData?.crypto_wallets
      }
    })

    return hasData
  }

  const getColorClasses = (method: PaymentMethod, isSelected: boolean, hasData: boolean) => {
    const colors = {
      crypto: {
        selected: 'ring-4 ring-green-400 border-green-500 bg-green-100',
        hasData: 'border-green-300 bg-green-50 hover:border-green-400',
        icon: isSelected ? 'bg-green-600 ring-2 ring-green-300' : hasData ? 'bg-green-500' : 'bg-gray-400',
        text: isSelected ? 'text-green-600 font-bold' : 'text-green-600'
      },
      p2p: {
        selected: 'ring-4 ring-blue-400 border-blue-500 bg-blue-100',
        hasData: 'border-blue-300 bg-blue-50 hover:border-blue-400',
        icon: isSelected ? 'bg-blue-600 ring-2 ring-blue-300' : hasData ? 'bg-blue-500' : 'bg-gray-400',
        text: isSelected ? 'text-blue-600 font-bold' : 'text-blue-600'
      },
      'bank-transfer': {
        selected: 'ring-4 ring-orange-400 border-orange-500 bg-orange-100',
        hasData: 'border-orange-300 bg-orange-50 hover:border-orange-400',
        icon: isSelected ? 'bg-orange-600 ring-2 ring-orange-300' : hasData ? 'bg-orange-500' : 'bg-gray-400',
        text: isSelected ? 'text-orange-600 font-bold' : 'text-gray-600'
      }
    }

    return colors[method]
  }

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-4 w-full">
        {methods.map((method, index) => {
          const isSelected = isMethodSelected(method)
          const hasData = hasSupplierDataForMethod(method)
          const colors = getColorClasses(method, isSelected, hasData)

          const containerClass = isSelected
            ? colors.selected
            : hasData
              ? colors.hasData
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'

          return (
            <div
              key={index}
              className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${containerClass}`}
              onClick={() => onMethodSelect(method, selectedSupplierData)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.icon}`}>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    {getMethodTitle(method)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getMethodSubtitle(method)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-800">Статус</div>
              <div className="text-xs text-gray-500">
                {isSelected ? 'ВЫБРАН' : hasData ? 'Автозаполнение' : 'Ручное заполнение'}
              </div>
              <div className={`text-xs mt-2 flex items-center gap-1 ${colors.text}`}>
                <span>{isSelected ? 'ВЫБРАНО' : 'Выбрать'}</span>
                {isSelected ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
