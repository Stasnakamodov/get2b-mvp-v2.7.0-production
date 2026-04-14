"use client"

import { useState } from 'react'
import { templatePayload, isCompanyDataEmpty } from '@/lib/templates/projectTemplateMapper'

interface TemplateData {
  id: string
  name: string
  availableSteps: number[]
  data: {
    1?: any
    2?: any
    [key: number]: any
  }
}

interface UseTemplateSystemProps {
  templates: any[] | null
  setStepConfigs: any // Используем any чтобы избежать конфликта типов PartialStepConfigs vs Record<number, string>
  setManualData: React.Dispatch<React.SetStateAction<Record<number, any>>>
  setSelectedSource: React.Dispatch<React.SetStateAction<any>>
}

export function useTemplateSystem({
  templates,
  setStepConfigs,
  setManualData,
  setSelectedSource
}: UseTemplateSystemProps) {
  const [templateSelection, setTemplateSelection] = useState<boolean>(false)
  const [templateStepSelection, setTemplateStepSelection] = useState<{
    templateId: string
    availableSteps: number[]
  } | null>(null)

  /**
   * Получить данные шаблона по ID.
   * availableSteps вычисляется из контента: [1] если есть компания, [2] если есть спецификация,
   * [1, 2] если оба. Модалка выбора шагов показывается только при length > 1.
   */
  const getTemplateData = (templateId: string): TemplateData | null => {
    const template = templates?.find(t => t.id === templateId)

    if (!template) {
      console.error('Шаблон не найден:', templateId)
      return null
    }

    const { company, specification } = templatePayload(template)
    const availableSteps: number[] = []
    if (!isCompanyDataEmpty(company)) availableSteps.push(1)
    if (specification.length > 0) availableSteps.push(2)
    // Fallback: пустой шаблон — применим пустой step 1 (no-op на свежем проекте)
    if (availableSteps.length === 0) availableSteps.push(1)

    return {
      id: template.id,
      name: template.name || 'Без названия',
      availableSteps,
      data: {
        1: company,
        2: {
          supplier: (specification[0] as any)?.supplier_name || '',
          currency: 'RUB',
          items: specification,
        },
      },
    }
  }

  /**
   * Применить данные шаблона к конкретному шагу
   */
  const applyTemplateStep = (stepId: number, templateData: TemplateData) => {

    if (templateData.data[stepId as keyof typeof templateData.data]) {
      // Применяем данные шаблона
      setStepConfigs((prev: any) => ({
        ...prev,
        [stepId]: "template"
      }))
      const stepData = templateData.data[stepId as keyof typeof templateData.data]
      setManualData(prev => ({
        ...prev,
        [stepId]: stepData
      }))
      setSelectedSource(null)
      setTemplateStepSelection(null)

      // autoFillStepsFromSupplier удалена (для шаблонов не нужна)
    } else {
    }
  }

  /**
   * Обработчик выбора шаблона
   */
  const handleTemplateSelect = (templateId: string) => {
    const templateData = getTemplateData(templateId)
    if (!templateData) return

    const availableSteps = templateData.availableSteps

    // Если шаблон содержит несколько шагов, показываем выбор
    if (availableSteps.length > 1) {
      setTemplateStepSelection({
        templateId: templateId,
        availableSteps: availableSteps
      })
      setTemplateSelection(false)
    } else if (availableSteps.length === 1) {
      // Если только один шаг, применяем его автоматически
      applyTemplateStep(availableSteps[0], templateData)
      setTemplateSelection(false)
    }
  }

  /**
   * Обработчик выбора шага в шаблоне
   */
  const handleTemplateStepSelect = (stepId: number) => {
    if (templateStepSelection) {
      const templateData = getTemplateData(templateStepSelection.templateId)
      if (templateData) {
        applyTemplateStep(stepId, templateData)
      }
    }
  }

  /**
   * Обработчик заполнения всех шагов из шаблона
   */
  const handleFillAllTemplateSteps = () => {
    if (templateStepSelection) {
      const templateData = getTemplateData(templateStepSelection.templateId)
      if (!templateData) return

      // Применяем данные для всех доступных шагов
      templateStepSelection.availableSteps.forEach(stepId => {
        if (templateData.data[stepId as keyof typeof templateData.data]) {
          const stepData = templateData.data[stepId as keyof typeof templateData.data]
          setStepConfigs((prev: any) => ({
            ...prev,
            [stepId]: "template"
          }))
          setManualData(prev => ({
            ...prev,
            [stepId]: stepData
          }))

          // autoFillStepsFromSupplier и autoFillStepFromRequisites удалены (для шаблонов не нужны)
        }
      })

      setSelectedSource(null)
      setTemplateStepSelection(null)
    }
  }

  return {
    // State
    templateSelection,
    setTemplateSelection,
    templateStepSelection,
    setTemplateStepSelection,

    // Functions
    getTemplateData,
    handleTemplateSelect,
    handleTemplateStepSelect,
    handleFillAllTemplateSteps
  }
}
