/**
 * Шаг 6: Платежные реквизиты
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal/steps
 */

import React from 'react'
import type { SupplierFormData } from '@/src/entities/supplier'
import { CRYPTO_NETWORKS } from '@/src/shared/config'

interface Step6PaymentDetailsProps {
  formData: SupplierFormData
  errors: Record<string, string>
  updateField: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void
}

export const Step6PaymentDetails: React.FC<Step6PaymentDetailsProps> = ({
  formData,
  errors,
  updateField
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Платежные реквизиты</h3>

      {errors.payment_methods && (
        <p className="text-red-500 text-sm mb-2">{errors.payment_methods}</p>
      )}

      {/* Банковский перевод */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-3">Банковский перевод</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={formData.bank_name}
            onChange={(e) => updateField('bank_name', e.target.value)}
            placeholder="Название банка"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            value={formData.bank_account}
            onChange={(e) => updateField('bank_account', e.target.value)}
            placeholder="Номер счета"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            value={formData.swift_code}
            onChange={(e) => updateField('swift_code', e.target.value)}
            placeholder="SWIFT код (опционально)"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* P2P карта */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-3">P2P оплата картой</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={formData.card_bank || ''}
            onChange={(e) => updateField('card_bank', e.target.value)}
            placeholder="Банк-эмитент"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            value={formData.card_number || ''}
            onChange={(e) => updateField('card_number', e.target.value)}
            placeholder="Номер карты"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            value={formData.card_holder || ''}
            onChange={(e) => updateField('card_holder', e.target.value)}
            placeholder="Владелец карты"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Криптовалюта */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-3">Криптовалюта</h4>
        <div className="space-y-3">
          <select
            value={formData.crypto_network || ''}
            onChange={(e) => updateField('crypto_network', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Выберите сеть...</option>
            {CRYPTO_NETWORKS.map(network => (
              <option key={network} value={network}>{network}</option>
            ))}
          </select>
          <input
            type="text"
            value={formData.crypto_address || ''}
            onChange={(e) => updateField('crypto_address', e.target.value)}
            placeholder="Адрес кошелька"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  )
}
