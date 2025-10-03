"use client"

import { useState } from 'react'

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
  autoFillStepsFromSupplier: (stepData: any) => void | Promise<void> | Promise<boolean>
  autoFillStepFromRequisites: (stepData: any, stepId: number) => Promise<void> | Promise<boolean>
}

export function useTemplateSystem({
  templates,
  setStepConfigs,
  setManualData,
  setSelectedSource,
  autoFillStepsFromSupplier,
  autoFillStepFromRequisites
}: UseTemplateSystemProps) {
  const [templateSelection, setTemplateSelection] = useState<boolean>(false)
  const [templateStepSelection, setTemplateStepSelection] = useState<{
    templateId: string
    availableSteps: number[]
  } | null>(null)

  /**
   * Получить данные шаблона по ID
   */
  const getTemplateData = (templateId: string): TemplateData | null => {
    // Находим реальный шаблон в базе данных
    const template = templates?.find(t => t.id === templateId)

    if (!template) {
      console.error('Шаблон не найден:', templateId)
      return null
    }

    console.log('=== ДАННЫЕ ШАБЛОНА ДЛЯ СПЕЦИФИКАЦИИ ===')
    console.log('template:', template)
    console.log('template.items:', template.items)
    console.log('template.specification:', template.specification)
    console.log('template.data?.specification:', template.data?.specification)

    return {
      id: template.id,
      name: template.name || 'Без названия',
      availableSteps: [1, 2], // По умолчанию шаблоны содержат шаги 1 и 2
      data: {
        1: {
          name: template.company_name || '',
          legalName: template.company_legal || '',
          inn: template.company_inn || '',
          kpp: template.company_kpp || '',
          ogrn: template.company_ogrn || '',
          address: template.company_address || '',
          bankName: template.company_bank || '',
          bankAccount: template.company_account || '',
          bankCorrAccount: template.company_corr_account || template.company_corr || '',
          bankBik: template.company_bik || '',
          email: template.company_email || '',
          phone: template.company_phone || '',
          website: template.company_website || ''
        },
        2: {
          supplier: template.supplier_name || template.data?.supplier_name || template.data?.supplier || '',
          currency: template.currency || 'RUB',
          items: template.items || template.specification || template.data?.specification || []
        }
      }
    }
  }

  /**
   * Применить данные шаблона к конкретному шагу
   */
  const applyTemplateStep = (stepId: number, templateData: TemplateData) => {
    console.log(`=== ПРИМЕНЕНИЕ ШАБЛОНА ДЛЯ ШАГА ${stepId} ===`)
    console.log('templateData:', templateData)
    console.log('templateData.data:', templateData.data)
    console.log(`templateData.data[${stepId}]:`, templateData.data[stepId as keyof typeof templateData.data])

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
      console.log(`✅ Применены данные шаблона для шага ${stepId}:`, stepData)

      // Проверяем, нужно ли автоматическое заполнение (если это шаг II)
      if (stepId === 2) {
        autoFillStepsFromSupplier(stepData)
      }

      // Проверяем, нужно ли автоматическое заполнение (если это шаги IV или V)
      if (stepId === 4 || stepId === 5) {
        autoFillStepFromRequisites(stepData, stepId).catch(error => {
          console.error('Ошибка автозаполнения из шага', stepId, ':', error)
        })
      }
    } else {
      console.log(`❌ Нет данных шаблона для шага ${stepId}`)
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

          // Проверяем, нужно ли автоматическое заполнение (если это шаг II)
          if (stepId === 2) {
            // Используем setTimeout, чтобы дать время для обновления состояния
            setTimeout(async () => {
              await autoFillStepsFromSupplier(stepData)
            }, 100)
          }

          // Проверяем, нужно ли автоматическое заполнение (если это шаги IV или V)
          if (stepId === 4 || stepId === 5) {
            // Используем setTimeout, чтобы дать время для обновления состояния
            setTimeout(() => {
              autoFillStepFromRequisites(stepData, stepId).catch(error => {
                console.error('Ошибка отложенного автозаполнения из шага', stepId, ':', error)
              })
            }, 100)
          }
        }
      })

      setSelectedSource(null)
      setTemplateStepSelection(null)
      console.log(`Применены данные шаблона для всех шагов: ${templateStepSelection.availableSteps.join(', ')}`)
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
