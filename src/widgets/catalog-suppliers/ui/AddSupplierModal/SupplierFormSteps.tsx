/**
 * Компонент Timeline для отображения прогресса по шагам
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal
 */

import React from 'react'
import { SUPPLIER_FORM_STEPS, toRoman } from '@/src/shared/config'

interface SupplierFormStepsProps {
  currentStep: number
  maxStep: number
  onStepClick: (step: number) => void
}

export const SupplierFormSteps: React.FC<SupplierFormStepsProps> = ({
  currentStep,
  maxStep,
  onStepClick
}) => {
  return (
    <div className="flex items-center justify-between">
      {SUPPLIER_FORM_STEPS.map((step, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep || stepNum <= maxStep
        const Icon = step.icon

        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => onStepClick(stepNum)}
              disabled={stepNum > maxStep}
              className={`flex flex-col items-center gap-1 transition-all ${
                stepNum > maxStep ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              type="button"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-blue-500 text-white scale-110'
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {toRoman(stepNum)}
              </span>
            </button>
            {index < SUPPLIER_FORM_STEPS.length - 1 && (
              <div className={`h-1 flex-1 mx-2 rounded ${
                stepNum < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
