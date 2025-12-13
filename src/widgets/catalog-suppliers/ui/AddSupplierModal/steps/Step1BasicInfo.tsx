/**
 * Шаг 1: Основная информация поставщика
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal/steps
 */

import React from 'react'
import type { SupplierFormData } from '@/src/entities/supplier'
import { COUNTRIES, CATEGORY_CERTIFICATIONS } from '@/src/shared/config'

interface Step1BasicInfoProps {
  formData: SupplierFormData
  errors: Record<string, string>
  uploadingImages: Record<string, boolean>
  updateField: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void
  handleLogoUpload: (file: File) => void
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  formData,
  errors,
  uploadingImages,
  updateField,
  handleLogoUpload
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLogoUpload(file)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Основная информация</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Название поставщика *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : ''}`}
          placeholder="Введите название"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Название компании *</label>
        <input
          type="text"
          value={formData.company_name}
          onChange={(e) => updateField('company_name', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.company_name ? 'border-red-500' : ''}`}
          placeholder="Официальное название компании"
        />
        {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Категория *</label>
          <select
            value={formData.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            {CATEGORY_CERTIFICATIONS.map(cat => (
              <option key={cat.category} value={cat.category}>{cat.category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Страна *</label>
          <select
            value={formData.country}
            onChange={(e) => updateField('country', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Город *</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.city ? 'border-red-500' : ''}`}
          placeholder="Введите город"
        />
        {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Описание *</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.description ? 'border-red-500' : ''}`}
          rows={4}
          placeholder="Опишите деятельность компании"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Логотип</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border rounded-lg"
        />
        {uploadingImages.logo && <p className="text-sm text-gray-500 mt-1">Загрузка...</p>}
        {formData.logo_url && (
          <img src={formData.logo_url} alt="Logo" className="mt-2 w-20 h-20 object-cover rounded" />
        )}
      </div>
    </div>
  )
}
