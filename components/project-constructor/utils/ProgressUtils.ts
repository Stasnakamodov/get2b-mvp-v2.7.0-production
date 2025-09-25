// Функция для вычисления прогресса заполнения шагов
export const getProgress = (isStepFilledByUser: (stepId: number) => boolean) => {
  // Считаем только шаги, заполненные пользователем (не эхо данными)
  const filledSteps = [1, 2, 3, 4, 5, 6, 7].filter(stepId => isStepFilledByUser(stepId)).length
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

// Определение активного сценария
export const getActiveScenario = (isStepFilledByUser: (stepId: number) => boolean) => {
  // Используем ту же логику, что и в isStepFilledByUser
  if (isStepFilledByUser(1)) {
    return 'A'
  }

  if (isStepFilledByUser(2)) {
    return 'B1'
  }

  if (isStepFilledByUser(4) || isStepFilledByUser(5)) {
    return 'B2'
  }

  return 'none' // Сценарий еще не определен
}