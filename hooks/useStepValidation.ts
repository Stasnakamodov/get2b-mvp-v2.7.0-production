'use client'

import { useState, useCallback, useEffect } from 'react'
import { validateStepData } from '@/types/project-constructor.types'

interface StepValidationResult {
  isValid: boolean
  isFilled: boolean
  errors: string[]
  warnings: string[]
  data: any
  status: 'empty' | 'partial' | 'complete' | 'error'
  message: string
}

interface UseStepValidationProps {
  stepNumber: number
  data: any
  stepConfig?: 'manual' | 'catalog' | 'echo' | 'echoData'
  required?: boolean
}

/**
 * Унифицированный хук для валидации шагов конструктора проектов
 * Заменяет множественные проверки isStepFilledByUser и дублированную логику
 */
export const useStepValidation = ({
  stepNumber,
  data,
  stepConfig = 'manual',
  required = true
}: UseStepValidationProps): StepValidationResult => {
  const [validationResult, setValidationResult] = useState<StepValidationResult>({
    isValid: false,
    isFilled: false,
    errors: [],
    warnings: [],
    data: null,
    status: 'empty',
    message: ''
  })

  // Проверка заполненности шага
  const checkStepFilled = useCallback((stepNum: number, stepData: any): boolean => {
    if (!stepData) return false

    switch (stepNum) {
      case 1: // Данные клиента
        return !!(stepData.name && (stepData.inn || stepData.legal_name))

      case 2: // Спецификация
        return !!(stepData.items && stepData.items.length > 0 && stepData.items[0].item_name)

      case 3: // Банковские данные
        return !!(stepData.bank_name && stepData.bank_account)

      case 4: // Способы оплаты
        // Унифицированная проверка для Extended и Legacy типов
        if (stepData.methods && Array.isArray(stepData.methods)) {
          return stepData.methods.length > 0
        }
        return !!(stepData.method || stepData.payment_method)

      case 5: // Реквизиты
        // Унифицированная проверка для Extended и Legacy типов
        if (stepData.requisites && Array.isArray(stepData.requisites)) {
          return stepData.requisites.length > 0
        }
        return !!(stepData.bankName || stepData.bank_details || stepData.accountNumber)

      case 6: // Файлы
        return !!(stepData.files && stepData.files.length > 0)

      case 7: // Реквизиты клиента
        return !!(stepData.client_bank_name && stepData.client_account)

      default:
        return false
    }
  }, [])

  // Проверка, был ли шаг заполнен пользователем
  const checkUserChoice = useCallback((stepData: any): boolean => {
    // Проверяем наличие флага user_choice
    if (stepData?.user_choice === true) return true

    // Проверяем, что данные не автозаполненные
    if (stepData?.auto_filled === true) return false

    // Проверяем источник данных
    if (stepConfig === 'manual') return true

    return false
  }, [stepConfig])

  // Получение сообщения статуса
  const getStatusMessage = useCallback((stepNum: number, status: string): string => {
    const stepNames: Record<number, string> = {
      1: 'Данные клиента',
      2: 'Спецификация',
      3: 'Банковские данные',
      4: 'Способы оплаты',
      5: 'Реквизиты для оплаты',
      6: 'Файлы',
      7: 'Реквизиты клиента'
    }

    const stepName = stepNames[stepNum] || `Шаг ${stepNum}`

    switch (status) {
      case 'empty':
        return `${stepName}: не заполнено`
      case 'partial':
        return `${stepName}: заполнено частично`
      case 'complete':
        return `${stepName}: заполнено полностью`
      case 'error':
        return `${stepName}: ошибка валидации`
      default:
        return stepName
    }
  }, [])

  // Основная функция валидации
  const validateStep = useCallback(() => {
    // Пустые данные
    if (!data) {
      return {
        isValid: !required,
        isFilled: false,
        errors: required ? [`Шаг ${stepNumber} обязателен для заполнения`] : [],
        warnings: [],
        data: null,
        status: 'empty' as const,
        message: getStatusMessage(stepNumber, 'empty')
      }
    }

    // Проверяем заполненность
    const isFilled = checkStepFilled(stepNumber, data)

    // Используем встроенную валидацию через Zod схемы
    const validationResult = validateStepData(stepNumber, data)

    // Проверяем, заполнен ли шаг пользователем
    const isUserFilled = checkUserChoice(data)

    // Определяем статус
    let status: 'empty' | 'partial' | 'complete' | 'error' = 'empty'
    if (!isFilled) {
      status = 'empty'
    } else if (validationResult.success) {
      status = 'complete'
    } else if (isFilled && !validationResult.success) {
      status = validationResult.errors.length > 2 ? 'error' : 'partial'
    }

    // Формируем warnings для автозаполненных данных
    const warnings: string[] = []
    if (data?.auto_filled) {
      warnings.push('Данные заполнены автоматически. Проверьте их корректность.')
    }
    if (!isUserFilled && stepConfig !== 'manual') {
      warnings.push(`Данные загружены из ${stepConfig === 'catalog' ? 'каталога' : 'эхо-данных'}`)
    }

    return {
      isValid: validationResult.success,
      isFilled,
      errors: validationResult.success ? [] : validationResult.errors,
      warnings,
      data: validationResult.success ? validationResult.data : data,
      status,
      message: getStatusMessage(stepNumber, status)
    }
  }, [stepNumber, data, stepConfig, required, checkStepFilled, checkUserChoice, getStatusMessage])

  // Обновляем результат при изменении данных
  useEffect(() => {
    const result = validateStep()
    setValidationResult(result)
  }, [validateStep])

  return validationResult
}

/**
 * Хук для проверки общей валидности всех шагов
 */
export const useProjectValidation = (stepsData: Record<number, any>) => {
  const [isValid, setIsValid] = useState(false)
  const [errors, setErrors] = useState<Record<number, string[]>>({})
  const [filledSteps, setFilledSteps] = useState<number[]>([])

  useEffect(() => {
    let allValid = true
    const newErrors: Record<number, string[]> = {}
    const filled: number[] = []

    // Проверяем шаги 1-7
    for (let step = 1; step <= 7; step++) {
      const result = validateStepData(step, stepsData[step])

      if (!result.success) {
        allValid = false
        newErrors[step] = result.errors
      }

      if (stepsData[step]) {
        filled.push(step)
      }
    }

    setIsValid(allValid)
    setErrors(newErrors)
    setFilledSteps(filled)
  }, [stepsData])

  return {
    isValid,
    errors,
    filledSteps,
    progress: Math.round((filledSteps.length / 7) * 100)
  }
}

/**
 * Хук для синхронизации шагов 4-5
 */
export const useStepsSynchronization = (
  step4Data: any,
  step5Data: any,
  onStep4Change: (data: any) => void,
  onStep5Change: (data: any) => void
) => {
  // Синхронизация шага 5 при изменении шага 4
  useEffect(() => {
    if (!step4Data?.primary_method || !step5Data) return

    // Фильтруем реквизиты в соответствии с выбранным методом оплаты
    let shouldUpdate = false
    const filteredRequisites = step5Data.requisites?.filter((req: any) => {
      if (step4Data.primary_method === 'bank_transfer') {
        return req.type === 'bank_account'
      }
      if (step4Data.primary_method === 'p2p') {
        return req.type === 'p2p_card'
      }
      if (step4Data.primary_method === 'crypto') {
        return req.type === 'crypto_wallet'
      }
      return true
    })

    if (filteredRequisites?.length !== step5Data.requisites?.length) {
      onStep5Change({
        ...step5Data,
        requisites: filteredRequisites
      })
    }
  }, [step4Data, step5Data, onStep5Change])

  // Синхронизация шага 4 при изменении шага 5
  useEffect(() => {
    if (!step5Data?.primary_requisite || !step4Data) return

    // Определяем соответствующий метод оплаты по типу реквизита
    let suggestedMethod: string | null = null
    if (step5Data.primary_requisite.type === 'bank_account') {
      suggestedMethod = 'bank_transfer'
    } else if (step5Data.primary_requisite.type === 'p2p_card') {
      suggestedMethod = 'p2p'
    } else if (step5Data.primary_requisite.type === 'crypto_wallet') {
      suggestedMethod = 'crypto'
    }

    // Обновляем метод оплаты если он не соответствует
    if (suggestedMethod && !step4Data.methods?.includes(suggestedMethod)) {
      onStep4Change({
        ...step4Data,
        methods: [suggestedMethod, ...(step4Data.methods || [])],
        primary_method: suggestedMethod
      })
    }
  }, [step5Data, step4Data, onStep4Change])
}

export default useStepValidation