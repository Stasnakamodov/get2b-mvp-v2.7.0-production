/**
 * Модальное окно добавления/редактирования поставщика
 * 7-шаговая форма с валидацией
 * FSD: widgets/catalog-suppliers
 */

import React from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Supplier } from '@/src/entities/supplier'
import { useSupplierForm } from './useSupplierForm'
import { SupplierFormSteps } from './SupplierFormSteps'
import {
  Step1BasicInfo,
  Step2Contacts,
  Step3BusinessProfile,
  Step4Certifications,
  Step5Products,
  Step6PaymentDetails,
  Step7Preview
} from './steps'

interface AddSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (supplier: Supplier) => void
  editingSupplier?: Supplier | null
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingSupplier
}) => {
  const form = useSupplierForm({
    editingSupplier,
    onSuccess,
    onClose,
    isOpen
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingSupplier ? 'Редактировать поставщика' : 'Добавить поставщика'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline */}
          <div className="mt-6">
            <SupplierFormSteps
              currentStep={form.currentStep}
              maxStep={form.maxStep}
              onStepClick={form.handleStepClick}
            />
          </div>
        </div>

        {/* Контент текущего шага */}
        <div className="p-6">
          {/* Ошибка сохранения */}
          {form.errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {form.errors.submit}
            </div>
          )}

          {/* Шаг 1: Основная информация */}
          {form.currentStep === 1 && (
            <Step1BasicInfo
              formData={form.formData}
              errors={form.errors}
              uploadingImages={form.uploadingImages}
              updateField={form.updateField}
              handleLogoUpload={form.handleLogoUpload}
            />
          )}

          {/* Шаг 2: Контакты */}
          {form.currentStep === 2 && (
            <Step2Contacts
              formData={form.formData}
              errors={form.errors}
              updateField={form.updateField}
            />
          )}

          {/* Шаг 3: Бизнес-профиль */}
          {form.currentStep === 3 && (
            <Step3BusinessProfile
              formData={form.formData}
              errors={form.errors}
              updateField={form.updateField}
            />
          )}

          {/* Шаг 4: Сертификации */}
          {form.currentStep === 4 && (
            <Step4Certifications
              formData={form.formData}
              errors={form.errors}
              updateField={form.updateField}
            />
          )}

          {/* Шаг 5: Товары */}
          {form.currentStep === 5 && (
            <Step5Products
              formData={form.formData}
              errors={form.errors}
              updateField={form.updateField}
              handleAddProduct={form.handleAddProduct}
              handleRemoveProduct={form.handleRemoveProduct}
              handleUpdateProduct={form.handleUpdateProduct}
            />
          )}

          {/* Шаг 6: Платежные реквизиты */}
          {form.currentStep === 6 && (
            <Step6PaymentDetails
              formData={form.formData}
              errors={form.errors}
              updateField={form.updateField}
            />
          )}

          {/* Шаг 7: Превью */}
          {form.currentStep === 7 && (
            <Step7Preview formData={form.formData} />
          )}
        </div>

        {/* Футер с кнопками */}
        <div className="p-6 border-t flex justify-between">
          <button
            onClick={form.currentStep === 1 ? onClose : form.handleBack}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            type="button"
          >
            {form.currentStep === 1 ? (
              <>Отмена</>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Назад
              </>
            )}
          </button>

          <button
            onClick={form.currentStep === 7 ? form.handleSave : form.handleNext}
            disabled={form.loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {form.loading ? (
              'Сохранение...'
            ) : form.currentStep === 7 ? (
              'Сохранить'
            ) : (
              <>
                Далее
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
