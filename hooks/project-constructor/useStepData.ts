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
  setLastHoveredStep?: (step: number | null) => void

  // Проверка готовности к переходу на Stage 2
  checkSummaryReadiness: () => void

  // Текущий этап
  currentStage: number

  // Опциональные функции для сброса выбранных профилей
  setSelectedProfileId?: (id: string | null) => void
  setSelectedSupplierProfileId?: (id: string | null) => void
}

export function useStepData(params: StepDataParams) {
  const {
    manualData,
    setManualData,
    setSelectedSource,
    setEditingType,
    setStepConfigs,
    setLastHoveredStep,
    checkSummaryReadiness,
    currentStage,
    setSelectedProfileId,
    setSelectedSupplierProfileId
  } = params

  /**
   * Сохранение данных шага (РУЧНОЙ ВВОД - без автозаполнения)
   */
  const saveStepData = (stepId: StepNumber, data: any) => {
    console.log('🔍 [useStepData] saveStepData вызван');
    console.log('  - stepId:', stepId);
    console.log('  - data:', data);

    // 1. Валидация
    const validation = validateStepData(stepId, data)
    console.log('  - validation.success:', validation.success);
    console.log('  - validation.errors:', validation.errors);

    if (!validation.success) {
      console.error(`❌ Ошибка валидации шага ${stepId}:`, validation.errors)
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

      // ✅ СПЕЦИАЛЬНО для Step 4: автоматически подготавливаем Step 5
      if (stepId === 4 && data.method) {
        console.log('🔗 [SYNC] Подготовка Step 5 при сохранении Step 4 с методом:', data.method)

        // Создаём базовую структуру для Step 5 на основе выбранного метода
        const requisiteType = data.method === 'bank-transfer' ? 'bank' : data.method
        newData[5] = {
          user_choice: true,
          type: requisiteType,
          source: 'manual'
        }

        console.log('✅ [SYNC] Step 5 подготовлен с типом:', requisiteType)
      }

      // Проверяем готовность к сводке
      setTimeout(() => {
        if (currentStage < 2) {
          checkSummaryReadiness()
        }
      }, 100)

      return newData
    })

    // 3. Устанавливаем stepConfigs для сохранённого шага
    setStepConfigs((prev: any) => ({
      ...prev,
      [stepId]: 'manual'
    }))

    // 4. Закрываем модалы
    setSelectedSource(null)
    setEditingType('')

    // 5. Закрываем область настройки
    if (setLastHoveredStep) {
      setLastHoveredStep(null)
    }
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

    // Сбрасываем выбранные профили при удалении Step 1 (клиент) или Step 3 (поставщик)
    if (stepId === 1 && setSelectedProfileId) {
      console.log('🔄 Сбрасываем выбранный профиль клиента')
      setSelectedProfileId(null)
    }
    if (stepId === 3 && setSelectedSupplierProfileId) {
      console.log('🔄 Сбрасываем выбранный профиль поставщика')
      setSelectedSupplierProfileId(null)
    }
  }

  return {
    saveStepData,
    removeStepData
  }
}
