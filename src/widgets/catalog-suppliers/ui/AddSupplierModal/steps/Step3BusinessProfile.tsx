/**
 * Шаг 3: Бизнес-профиль
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal/steps
 */

import React from 'react'
import type { SupplierFormData } from '@/src/entities/supplier'
import { MIN_ORDER_RANGES, RESPONSE_TIMES, EMPLOYEE_RANGES } from '@/src/shared/config'

interface Step3BusinessProfileProps {
  formData: SupplierFormData
  errors: Record<string, string>
  updateField: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void
}

export const Step3BusinessProfile: React.FC<Step3BusinessProfileProps> = ({
  formData,
  errors,
  updateField
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Бизнес-профиль</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Минимальный заказ *</label>
        <select
          value={formData.min_order}
          onChange={(e) => updateField('min_order', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.min_order ? 'border-red-500' : ''}`}
        >
          <option value="">Выберите...</option>
          {MIN_ORDER_RANGES.map(range => (
            <option key={range} value={range}>{range}</option>
          ))}
        </select>
        {errors.min_order && <p className="text-red-500 text-sm mt-1">{errors.min_order}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Время ответа *</label>
        <select
          value={formData.response_time}
          onChange={(e) => updateField('response_time', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.response_time ? 'border-red-500' : ''}`}
        >
          <option value="">Выберите...</option>
          {RESPONSE_TIMES.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
        {errors.response_time && <p className="text-red-500 text-sm mt-1">{errors.response_time}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Количество сотрудников *</label>
        <select
          value={formData.employees}
          onChange={(e) => updateField('employees', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.employees ? 'border-red-500' : ''}`}
        >
          <option value="">Выберите...</option>
          {EMPLOYEE_RANGES.map(range => (
            <option key={range} value={range}>{range}</option>
          ))}
        </select>
        {errors.employees && <p className="text-red-500 text-sm mt-1">{errors.employees}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Год основания *</label>
        <input
          type="text"
          value={formData.established}
          onChange={(e) => updateField('established', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.established ? 'border-red-500' : ''}`}
          placeholder="2010"
        />
        {errors.established && <p className="text-red-500 text-sm mt-1">{errors.established}</p>}
      </div>
    </div>
  )
}
