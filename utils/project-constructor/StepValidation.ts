/**
 * Step Validation Utilities
 * Determines which steps are enabled/available in each stage
 */

/**
 * Check if a step is enabled based on current stage
 * @param stepId - Step number (1-7)
 * @param currentStage - Current project stage (1-3)
 * @returns true if step is enabled, false otherwise
 */
export function isStepEnabled(stepId: number, currentStage: number): boolean {
  // Этап 1: Подготовка данных
  if (currentStage === 1) {
    // Активные шаги в этапе 1: 1, 2, 4, 5
    if ([1, 2, 4, 5].includes(stepId)) {
      return true
    }

    // Закрытые шаги в этапе 1: 3, 6, 7
    if ([3, 6, 7].includes(stepId)) {
      return false
    }
  }

  // Этап 2: Подготовка инфраструктуры
  if (currentStage === 2) {
    // Все шаги доступны в этапе 2
    return true
  }

  // Этап 3: Анимация сделки
  if (currentStage === 3) {
    // Все шаги доступны в этапе 3
    return true
  }

  return false
}
