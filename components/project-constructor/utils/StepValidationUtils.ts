// Утилиты для проверки состояния шагов в конструкторе проектов

export interface StepValidationContext {
  stepConfigs: any
  manualData: any
  receiptApprovalStatus: 'pending' | 'approved' | 'rejected' | 'waiting' | null
  hasManagerReceipt: boolean
  clientReceiptUrl: string | null
}

/**
 * Проверяет, заполнен ли шаг пользователем (не эхо данными)
 *
 * @param stepId - ID шага для проверки
 * @param context - Контекст с состояниями
 * @returns true если шаг заполнен пользователем
 */
export const isStepFilledByUser = (stepId: number, context: StepValidationContext): boolean => {
  const { stepConfigs, manualData, receiptApprovalStatus, hasManagerReceipt, clientReceiptUrl } = context

  // Шаг 1: проверяем что пользователь выбрал источник данных И есть данные
  if (stepId === 1) {
    const hasSource = Boolean(stepConfigs[1]) && stepConfigs[1] !== undefined
    const hasData = manualData[1] && Object.keys(manualData[1] || {}).length > 0
    const result = hasSource && hasData

    console.log(`🔍 Шаг 1: hasSource=${hasSource}, hasData=${hasData}, результат=${result}`)
    console.log(`🔍 stepConfigs[1]:`, stepConfigs[1])
    console.log(`🔍 manualData[1]:`, manualData[1])

    return result
  }

  // Шаг 2: проверяем что пользователь выбрал источник данных И есть товары
  if (stepId === 2) {
    const hasSource = Boolean(stepConfigs[2]) && stepConfigs[2] !== undefined
    const hasItems = manualData[2] && manualData[2].items && manualData[2].items.length > 0
    const result = hasSource && hasItems

    console.log(`🔍 Шаг 2: hasSource=${hasSource}, hasItems=${hasItems}, результат=${result}`)
    console.log(`🔍 stepConfigs[2]:`, stepConfigs[2])
    console.log(`🔍 manualData[2]:`, manualData[2])

    return result
  }

  // Шаг 3: считаем заполненным если чек одобрен менеджером
  if (stepId === 3) {
    // Проверяем receiptApprovalStatus (локальное состояние)
    const result = receiptApprovalStatus === 'approved' || receiptApprovalStatus === 'waiting'

    console.log(`🔍 Шаг 3: receiptApprovalStatus=${receiptApprovalStatus}, результат=${result}`)

    return result
  }

  // Шаг 6: считаем заполненным если есть чек от менеджера
  if (stepId === 6) {
    const result = hasManagerReceipt

    console.log(`🔍 Шаг 6: hasManagerReceipt=${hasManagerReceipt}, результат=${result}`)

    return result
  }

  // Шаг 7: считаем заполненным если клиент загрузил чек о получении средств
  if (stepId === 7) {
    const result = !!clientReceiptUrl

    console.log(`🔍 Шаг 7: clientReceiptUrl=${clientReceiptUrl}, результат=${result}`)

    return result
  }

  // Шаги 4, 5: считаем заполненными если пользователь явно выбрал (включая эхо данные)
  if (stepId === 4 || stepId === 5) {
    // Проверяем, есть ли выбор пользователя (включая примененные эхо данные)
    const hasUserChoice = manualData[stepId] && manualData[stepId].user_choice

    // Проверяем источник данных
    const source = stepConfigs[stepId]

    // Проверяем наличие данных
    const hasData = manualData[stepId] && Object.keys(manualData[stepId] || {}).length > 0

    // Считаем заполненным если:
    // 1. Пользователь явно выбрал (user_choice: true)
    // 2. ИЛИ есть источник данных (включая echoData)
    // 3. ИЛИ есть данные в manualData
    const result = hasUserChoice || source || hasData

    console.log(`🔍 Шаг ${stepId}: user_choice=${hasUserChoice}, source=${source}, hasData=${hasData}, результат=${result}`)
    console.log(`🔍 manualData[${stepId}]:`, manualData[stepId])
    return result
  }

  // Остальные шаги
  return !!(stepConfigs[stepId] || manualData[stepId])
}

/**
 * Проверяет готовность к показу сводки
 *
 * @param requiredSteps - Массив обязательных шагов
 * @param context - Контекст с состояниями
 * @returns объект с информацией о готовности
 */
export const checkSummaryReadiness = (
  requiredSteps: readonly number[],
  context: StepValidationContext
) => {
  const filledSteps = requiredSteps.filter(stepId => isStepFilledByUser(stepId, context))

  return {
    filledSteps,
    allFilled: filledSteps.length === requiredSteps.length,
    progress: Math.round((filledSteps.length / requiredSteps.length) * 100)
  }
}

/**
 * Получает сводку настроенных шагов
 *
 * @param constructorSteps - Массив всех шагов конструктора
 * @param dataSources - Объект с источниками данных
 * @param context - Контекст с состояниями
 * @returns массив заполненных шагов с метаданными
 */
export const getConfiguredStepsSummary = (
  constructorSteps: any[],
  dataSources: any,
  context: StepValidationContext
) => {
  const { stepConfigs, manualData } = context
  const summary = []

  // Проверяем все шаги
  for (let stepId = 1; stepId <= 7; stepId++) {
    const isFilled = isStepFilledByUser(stepId, context)

    if (isFilled) {
      const step = constructorSteps.find(s => s.id === stepId)
      const source = stepConfigs[stepId]

      const sourceInfo = source ? dataSources[source as keyof typeof dataSources] : null

      const item = {
        stepId: stepId,
        stepName: step?.name,
        sourceName: sourceInfo?.name || 'Вручную',
        source: source,
        data: manualData[stepId]
      }

      summary.push(item)
    }
  }

  return summary.sort((a, b) => a.stepId - b.stepId)
}