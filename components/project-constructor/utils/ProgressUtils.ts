import { isStepFilledByUser, type StepValidationContext } from './StepValidationUtils'

// Функция для вычисления прогресса заполнения шагов
export const getProgress = (isStepFilledByUserFn: (stepId: number) => boolean) => {
  // Считаем только шаги, заполненные пользователем (не эхо данными)
  const filledSteps = [1, 2, 3, 4, 5, 6, 7].filter(stepId => isStepFilledByUserFn(stepId)).length
  return Math.round((filledSteps / 7) * 100)
}

// Функция для вычисления прогресса с контекстом
export const getProgressWithContext = (context: StepValidationContext) => {
  // Считаем только шаги, заполненные пользователем (не эхо данными)
  const filledSteps = [1, 2, 3, 4, 5, 6, 7].filter(stepId => isStepFilledByUser(stepId, context)).length
  return Math.round((filledSteps / 7) * 100)
}

// Функция для определения типа предварительного просмотра
export const getPreviewType = (stepId: number) => {
  switch (stepId) {
    case 1: return 'company'
    case 2: return 'product'
    case 4: return 'payment'
    case 5: return 'requisites'
    default: return 'company'
  }
}