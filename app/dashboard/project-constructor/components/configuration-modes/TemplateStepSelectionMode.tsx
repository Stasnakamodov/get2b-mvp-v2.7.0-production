'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, CheckCircle } from 'lucide-react'

interface Step {
  id: number
  name: string
  description?: string
}

interface TemplateStepSelectionModeProps {
  availableSteps: number[]
  constructorSteps: Step[]
  onStepSelect: (stepId: number) => void
  onFillAllSteps: () => void
  onClose: () => void
}

/**
 * MODE 2: Template Step Selection
 * Component for selecting which steps to fill from a template
 * Extracted from monolithic page.tsx (lines 2182-2232)
 */
export function TemplateStepSelectionMode({
  availableSteps,
  constructorSteps,
  onStepSelect,
  onFillAllSteps,
  onClose
}: TemplateStepSelectionModeProps) {

  // Helper function to convert step ID to Roman numeral
  const toRomanNumeral = (num: number): string => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
    return romanNumerals[num - 1] || num.toString()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-gray-800">
          Выберите шаг для заполнения из шаблона
        </h4>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Fill all steps button */}
      {availableSteps.length > 1 && (
        <div className="mb-4">
          <Button
            onClick={onFillAllSteps}
            variant="outline"
            className="w-full h-10 text-sm font-medium border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Заполнить все шаги из шаблона
          </Button>
        </div>
      )}

      {/* Step selection cards */}
      <div className="grid gap-4">
        {availableSteps.map((stepId) => {
          const step = constructorSteps.find(s => s.id === stepId)
          if (!step) return null

          return (
            <div
              key={stepId}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={() => onStepSelect(stepId)}
            >
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">
                  {toRomanNumeral(stepId)}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-800 mb-1">{step.name}</div>
                <div className="text-sm text-gray-600 leading-relaxed">{step.description}</div>
              </div>
              <div className="text-blue-500">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}