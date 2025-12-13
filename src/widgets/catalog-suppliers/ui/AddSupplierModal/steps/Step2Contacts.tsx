/**
 * Шаг 2: Контактная информация
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal/steps
 */

import React from 'react'
import type { SupplierFormData } from '@/src/entities/supplier'

interface Step2ContactsProps {
  formData: SupplierFormData
  errors: Record<string, string>
  updateField: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void
}

export const Step2Contacts: React.FC<Step2ContactsProps> = ({
  formData,
  errors,
  updateField
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Контактная информация</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.email ? 'border-red-500' : ''}`}
          placeholder="contact@company.com"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Телефон *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : ''}`}
          placeholder="+7 (999) 123-45-67"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Контактное лицо *</label>
        <input
          type="text"
          value={formData.contact_person}
          onChange={(e) => updateField('contact_person', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.contact_person ? 'border-red-500' : ''}`}
          placeholder="Иван Иванов"
        />
        {errors.contact_person && <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Веб-сайт</label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => updateField('website', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.website ? 'border-red-500' : ''}`}
          placeholder="https://example.com"
        />
        {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
      </div>
    </div>
  )
}
