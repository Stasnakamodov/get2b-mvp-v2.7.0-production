/**
 * AutoFillService - Централизованная система автозаполнения атомарного конструктора
 *
 * @priority CRITICAL
 * @affects Steps 1-7
 * @documentation docs/ATOMIC_CONSTRUCTOR_MASTER_ARCHITECTURE.md
 *
 * Реализует систему приоритетов автозаполнения для предотвращения конфликтов
 * между различными источниками данных (Catalog, OCR, Template, Profile, Echo).
 */

/**
 * Типы источников данных (по приоритету от высшего к низшему)
 */
export type DataSourceType =
  | 'manual'          // Приоритет 6: Ручной ввод пользователя
  | 'catalog'         // Приоритет 5: Каталог товаров
  | 'blue_room'       // Приоритет 5: Личные поставщики
  | 'orange_room'     // Приоритет 5: Проверенные поставщики
  | 'ocr_suggestion'  // Приоритет 4: Предложения из OCR
  | 'upload'          // Приоритет 4: OCR через загрузку файла
  | 'template'        // Приоритет 3: Шаблоны проектов
  | 'profile'         // Приоритет 2: Профили клиентов/поставщиков
  | 'echo'            // Приоритет 1: Данные из завершенных проектов

/**
 * Состояние атомарного конструктора
 * Принимает гибкий тип для stepConfigs чтобы быть совместимым с PartialStepConfigs
 */
export interface AtomicConstructorState {
  stepConfigs: Record<number, string | undefined>
  manualData: Record<number, any>
}

/**
 * Сервис автозаполнения с проверкой приоритетов
 */
export class AutoFillService {
  /**
   * Таблица приоритетов источников данных
   * Большее число = выше приоритет
   */
  private static readonly PRIORITIES: Record<DataSourceType, number> = {
    'manual': 6,
    'catalog': 5,
    'blue_room': 5,
    'orange_room': 5,
    'ocr_suggestion': 4,
    'upload': 4,
    'template': 3,
    'profile': 2,
    'echo': 1
  }

  /**
   * Проверяет возможность автозаполнения шага
   *
   * Правила:
   * 1. USER_CHOICE абсолютный - нельзя перезаписывать
   * 2. Иерархия приоритетов - новый источник должен быть выше текущего
   * 3. Пустое поле - можно заполнять любым источником
   *
   * @param step - Номер шага (1-7)
   * @param newSource - Новый источник данных
   * @param currentState - Текущее состояние конструктора
   * @returns true если можно заполнять, false если нельзя
   *
   * @example
   * // Проверка перед заполнением из каталога
   * if (AutoFillService.canAutoFill(4, 'catalog', { stepConfigs, manualData })) {
   *   // Можно заполнять
   * }
   */
  static canAutoFill(
    step: number,
    newSource: DataSourceType,
    currentState: AtomicConstructorState
  ): boolean {
    const currentConfig = currentState.stepConfigs[step]
    const currentData = currentState.manualData[step]

    // Правило 1: USER_CHOICE абсолютный
    if (currentData?.user_choice === true) {
      console.log(`⏸️ AutoFill: Пропущен Step ${step} - user_choice установлен`)
      return false
    }

    // Правило 2: Если поле пустое - можно заполнять
    if (!currentConfig && !currentData) {
      console.log(`✅ AutoFill: Step ${step} пустой - можно заполнять из ${newSource}`)
      return true
    }

    // Правило 3: Иерархия приоритетов
    const currentPriority = currentConfig ? this.PRIORITIES[currentConfig as DataSourceType] : 0
    const newPriority = this.PRIORITIES[newSource]

    if (newPriority <= currentPriority) {
      console.log(
        `⏸️ AutoFill: Пропущен Step ${step} - ` +
        `${newSource}(приоритет ${newPriority}) <= ${currentConfig}(приоритет ${currentPriority})`
      )
      return false
    }

    // Правило 4: Можно заполнять
    console.log(
      `✅ AutoFill: Step ${step} можно заполнить - ` +
      `${newSource}(приоритет ${newPriority}) > ${currentConfig || 'empty'}(приоритет ${currentPriority})`
    )
    return true
  }

  /**
   * Безопасное автозаполнение с проверками
   *
   * Выполняет автозаполнение только если это разрешено системой приоритетов.
   * Автоматически логирует все действия для отладки.
   *
   * @param step - Номер шага (1-7)
   * @param data - Данные для заполнения
   * @param source - Источник данных
   * @param currentState - Текущее состояние
   * @param onSuccess - Callback для обновления состояния (вызывается только при успехе)
   * @returns true если заполнение выполнено, false если пропущено
   *
   * @example
   * // Безопасное заполнение из каталога
   * AutoFillService.safeAutoFill(
   *   4,
   *   { method: 'bank-transfer', supplier: 'Test Supplier' },
   *   'catalog',
   *   { stepConfigs, manualData },
   *   (newManualData, newStepConfigs) => {
   *     setManualData(newManualData)
   *     setStepConfigs(newStepConfigs)
   *   }
   * )
   */
  static safeAutoFill(
    step: number,
    data: any,
    source: DataSourceType,
    currentState: AtomicConstructorState,
    onSuccess: (newManualData: Record<number, any>, newStepConfigs: Record<number, string | undefined>) => void
  ): boolean {
    // Проверка возможности автозаполнения
    if (!this.canAutoFill(step, source, currentState)) {
      console.log(`⏸️ AutoFill: Пропущен Step ${step} из ${source}`)
      return false
    }

    // Создаём новое состояние
    const newManualData = {
      ...currentState.manualData,
      [step]: {
        ...data,
        source,
        auto_filled: true,
        filled_at: new Date().toISOString()
      }
    }

    const newStepConfigs = {
      ...currentState.stepConfigs,
      [step]: source
    }

    // Вызываем callback для обновления состояния
    onSuccess(newManualData, newStepConfigs)

    console.log(`✅ AutoFill: Заполнен Step ${step} из ${source}`)
    console.log(`📋 AutoFill: Данные Step ${step}:`, {
      source,
      dataKeys: Object.keys(data),
      timestamp: new Date().toISOString()
    })

    return true
  }

  /**
   * Получить приоритет источника данных
   *
   * @param source - Источник данных
   * @returns Числовой приоритет (1-6)
   */
  static getPriority(source: DataSourceType): number {
    return this.PRIORITIES[source]
  }

  /**
   * Сравнить приоритеты двух источников
   *
   * @param source1 - Первый источник
   * @param source2 - Второй источник
   * @returns положительное число если source1 выше, отрицательное если ниже, 0 если равны
   */
  static comparePriorities(source1: DataSourceType, source2: DataSourceType): number {
    return this.PRIORITIES[source1] - this.PRIORITIES[source2]
  }

  /**
   * Проверить, является ли источник источником с высоким приоритетом
   *
   * @param source - Источник данных
   * @returns true если приоритет >= 4 (catalog или выше)
   */
  static isHighPrioritySource(source: DataSourceType): boolean {
    return this.PRIORITIES[source] >= 4
  }
}
