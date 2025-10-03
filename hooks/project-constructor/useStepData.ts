/**
 * 📦 Hook: useStepData
 *
 * Извлекает логику сохранения и удаления данных шагов из монолита.
 *
 * ⚠️ ВАЖНО: Этот хук НЕ содержит собственного state!
 * Он работает с ВНЕШНИМ state (manualData, setManualData) переданным из родительского компонента.
 *
 * Это stateless hook - только чистые функции для работы с данными.
 *
 * ⚠️ КРИТИЧНО: НЕ вызываем autoFill* функции при РУЧНОМ заполнении!
 * Автозаполнение только для OCR и Каталога.
 */

import { validateStepData } from '@/types/project-constructor.types'

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface StepDataParams {
  // Внешний state (из page.tsx)
  manualData: Record<number, any>
  setManualData: React.Dispatch<React.SetStateAction<Record<number, any>>>

  // Функции управления UI
  setSelectedSource: (source: string | null) => void
  setEditingType: (type: string) => void
  setStepConfigs: React.Dispatch<React.SetStateAction<any>>

  // Проверка готовности к переходу на Stage 2
  checkSummaryReadiness: () => void

  // Текущий этап
  currentStage: number
}

export function useStepData(params: StepDataParams) {
  const {
    manualData,
    setManualData,
    setSelectedSource,
    setEditingType,
    setStepConfigs,
    checkSummaryReadiness,
    currentStage
  } = params

  /**
   * Сохранение данных шага (РУЧНОЙ ВВОД - без автозаполнения)
   */
  const saveStepData = (stepId: StepNumber, data: any) => {
    // 1. Валидация
    const validation = validateStepData(stepId, data)
    if (!validation.success) {
      console.error(`Ошибка валидации шага ${stepId}:`, validation.errors)
      alert(`Ошибка валидации: ${validation.errors[0]}`)
      return
    }

    console.log('=== СОХРАНЕНИЕ ДАННЫХ (РУЧНОЙ ВВОД) ===')
    console.log('stepId:', stepId)
    console.log('data для сохранения:', data)

    // 2. Сохранение в state
    setManualData(prev => {
      console.log('Текущие manualData:', prev)

      // Для шага 1 объединяем данные с существующими (может быть частичное заполнение)
      if (stepId === 1) {
        const existingData = prev[stepId] || {}
        const mergedData = { ...existingData, ...data }
        console.log('Объединенные данные:', mergedData)

        // Проверяем готовность к сводке
        setTimeout(() => {
          if (currentStage < 2) {
            checkSummaryReadiness()
          }
        }, 100)

        return { ...prev, [stepId]: mergedData }
      }

      // Для остальных шагов просто заменяем
      const newData = { ...prev, [stepId]: data }

      // ❌ НЕ ВЫЗЫВАЕМ autoFillStepsFromSupplier - это только для OCR/Каталога!
      // ❌ НЕ ВЫЗЫВАЕМ autoFillStepFromRequisites - это только для OCR/Каталога!

      // Проверяем готовность к сводке
      setTimeout(() => {
        if (currentStage < 2) {
          checkSummaryReadiness()
        }
      }, 100)

      return newData
    })

    // 3. Закрываем модалы
    setSelectedSource(null)
    setEditingType('')
  }

  /**
   * Удаление данных шага
   */
  const removeStepData = (stepId: number) => {
    console.log(`🗑️ Удаление данных шага ${stepId}`)

    // Удаляем конфигурацию шага
    setStepConfigs((prev: any) => {
      const newConfigs = { ...prev }
      delete newConfigs[stepId]
      return newConfigs
    })

    // Удаляем сохраненные данные
    setManualData(prev => {
      const newData = { ...prev }
      delete newData[stepId]
      return newData
    })

    // Сбрасываем выбранный источник
    setSelectedSource(null)
  }

  return {
    saveStepData,
    removeStepData
  }
}
