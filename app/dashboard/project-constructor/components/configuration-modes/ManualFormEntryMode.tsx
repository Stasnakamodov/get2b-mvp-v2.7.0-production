'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import CompanyForm from '@/components/project-constructor/forms/CompanyForm'
import ContactsForm from '@/components/project-constructor/forms/ContactsForm'
import BankForm from '@/components/project-constructor/forms/BankForm'
import SpecificationForm from '@/components/project-constructor/forms/SpecificationForm'
import FileUploadForm from '@/components/project-constructor/forms/FileUploadForm'
import PaymentMethodForm from '@/components/project-constructor/forms/PaymentMethodForm'
import RequisitesForm from '@/components/project-constructor/forms/RequisitesForm'

interface ManualFormEntryModeProps {
  lastHoveredStep: number | null
  editingType: string
  manualData: Record<number, any>
  onSave: (stepId: number, data: any) => void
  onCancel: () => void
  onFileUpload: (stepId: number, file: File) => void
  getStepData: (stepId: number) => any
}

/**
 * MODE 3: Manual Form Entry
 * Component for manual data entry through forms
 * Extracted from monolithic page.tsx (lines 2192-2271)
 */
export function ManualFormEntryMode({
  lastHoveredStep,
  editingType,
  manualData,
  onSave,
  onCancel,
  onFileUpload,
  getStepData
}: ManualFormEntryModeProps) {
  if (!lastHoveredStep) return null

  return (
    <div>
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700">Заполнение вручную</h4>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Forms for different steps */}
      {lastHoveredStep === 1 && editingType === 'company' && (
        <CompanyForm
          onSave={(data) => onSave(lastHoveredStep, data)}
          onCancel={onCancel}
          initialData={manualData[lastHoveredStep] as any}
        />
      )}

      {lastHoveredStep === 1 && editingType === 'contacts' && (
        <ContactsForm
          onSave={(data) => onSave(lastHoveredStep, data)}
          onCancel={onCancel}
          initialData={manualData[lastHoveredStep] as any}
        />
      )}

      {lastHoveredStep === 1 && editingType === 'bank' && (
        <BankForm
          onSave={(data) => onSave(lastHoveredStep, data)}
          onCancel={onCancel}
          initialData={manualData[lastHoveredStep] as any}
        />
      )}

      {lastHoveredStep === 1 && !editingType && (
        <CompanyForm
          onSave={(data) => onSave(lastHoveredStep, data)}
          onCancel={onCancel}
          initialData={manualData[lastHoveredStep] as any}
        />
      )}

      {lastHoveredStep === 2 && (
        <SpecificationForm
          onSave={(data) => onSave(lastHoveredStep, data)}
          onCancel={onCancel}
          initialData={manualData[lastHoveredStep] as any}
        />
      )}

      {lastHoveredStep === 3 && (
        <FileUploadForm
          onSave={(data) => {
            if (data.file) {
              onFileUpload(lastHoveredStep, data.file)
            }
            onSave(lastHoveredStep, data)
          }}
          onCancel={onCancel}
        />
      )}

      {lastHoveredStep === 4 && (
        <PaymentMethodForm
          onSave={(data) => onSave(lastHoveredStep, data)}
          onCancel={onCancel}
          initialData={manualData[lastHoveredStep] as any}
          getStepData={getStepData}
        />
      )}

      {lastHoveredStep === 5 && (
        <RequisitesForm
          onSave={(data) => onSave(lastHoveredStep, data)}
          onCancel={onCancel}
          initialData={manualData[lastHoveredStep] as any}
        />
      )}
    </div>
  )
}
