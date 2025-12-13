/**
 * Шаг 4: Сертификации
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal/steps
 */

import React from 'react'
import type { SupplierFormData } from '@/src/entities/supplier'
import { CATEGORY_CERTIFICATIONS } from '@/src/shared/config'

interface Step4CertificationsProps {
  formData: SupplierFormData
  errors: Record<string, string>
  updateField: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void
}

export const Step4Certifications: React.FC<Step4CertificationsProps> = ({
  formData,
  errors,
  updateField
}) => {
  const categoryData = CATEGORY_CERTIFICATIONS.find(cat => cat.category === formData.category)
  const certifications = categoryData?.certifications || []

  const handleToggleCertification = (cert: string) => {
    const currentCerts = formData.certifications
    if (currentCerts.includes(cert)) {
      updateField('certifications', currentCerts.filter(c => c !== cert))
    } else {
      updateField('certifications', [...currentCerts, cert])
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Сертификации</h3>

      <p className="text-sm text-gray-600 mb-4">
        Выберите сертификации для категории: <strong>{formData.category}</strong>
      </p>

      {errors.certifications && (
        <p className="text-red-500 text-sm mb-2">{errors.certifications}</p>
      )}

      {certifications.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {certifications.map(cert => (
            <label
              key={cert}
              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                formData.certifications.includes(cert)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.certifications.includes(cert)}
                onChange={() => handleToggleCertification(cert)}
                className="rounded"
              />
              <span className="text-sm font-medium">{cert}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Для данной категории нет доступных сертификаций
        </div>
      )}
    </div>
  )
}
