# 🏗️ АТОМАРНЫЙ КОНСТРУКТОР - МАСТЕР-АРХИТЕКТУРА

**Версия:** 2.0
**Дата:** 2 октября 2025
**Статус:** 🟢 Активная разработка
**Основной файл:** `app/dashboard/project-constructor/page.tsx` (5808 строк)

---

## 📋 ОГЛАВЛЕНИЕ

1. [Общая концепция](#-общая-концепция)
2. [Архитектура системы](#️-архитектура-системы)
3. [Система приоритетов автозаполнения](#-система-приоритетов-автозаполнения)
4. [Подсистемы](#-подсистемы)
5. [План рефакторинга](#-план-рефакторинга)
6. [Правила разработки](#-правила-разработки)

---

## 🎯 ОБЩАЯ КОНЦЕПЦИЯ

### Что такое Атомарный Конструктор?

**Атомарный конструктор** - это гибкая система создания сделок Get2B, позволяющая пользователям выбирать источники данных для каждого из 7 шагов независимо.

### Ключевые принципы:

1. **Атомарность** - каждый шаг независим
2. **Гибкость источников** - множество способов заполнения
3. **Умное автозаполнение** - система приоритетов
4. **Неблокирующий UX** - пользователь всегда главнее автоматики

---

## 🏛️ АРХИТЕКТУРА СИСТЕМЫ

### Структура интерфейса

```
┌─────────────────────────────────────────────────────────┐
│  Block 1: 7 КУБИКОВ-ШАГОВ                               │
│  [I]  [II]  [III]  [IV]  [V]  [VI]  [VII]              │
│  Карт  Спец  Попол Метод Рекв  Получ  Подтв             │
└─────────────────────────────────────────────────────────┘
           ↓ hover/click
┌─────────────────────────────────────────────────────────┐
│  Block 2: ИНТЕРАКТИВНАЯ ОБЛАСТЬ                          │
│  • Выбор источника (профиль/шаблон/каталог/OCR/вручную) │
│  • Формы заполнения                                      │
│  • Анимации загрузки                                     │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│  Block 3: СВОДКА И ЗАПУСК                                │
│  • Прогресс-бар                                          │
│  • Список заполненных шагов                              │
│  • Кнопка "Запустить проект"                             │
└─────────────────────────────────────────────────────────┘
```

### Состояние приложения

```typescript
interface AtomicConstructorState {
  // Конфигурация источников для каждого шага
  stepConfigs: Record<number, DataSourceType>;
  // 1: 'profile' | 'manual' | 'catalog' | 'ocr' | 'template' | 'echo' | 'upload'

  // Данные каждого шага
  manualData: Record<number, StepData>;
  // { 1: CompanyData, 2: SpecificationData, 4: PaymentMethod, 5: Requisites }

  // Загруженные файлы
  uploadedFiles: Record<number, string>;

  // UI состояние
  hoveredStep: number | null;
  lastHoveredStep: number | null;
  selectedSource: string | null;

  // OCR состояние
  ocrAnalyzing: Record<number, boolean>;
  ocrError: Record<number, string>;
}
```

---

## 🎭 СИСТЕМА ПРИОРИТЕТОВ АВТОЗАПОЛНЕНИЯ

### ⚠️ КРИТИЧЕСКИ ВАЖНО

Система автозаполнения имеет **строгую иерархию приоритетов** для предотвращения конфликтов:

### Иерархия приоритетов (от высшего к низшему):

```
1. USER_CHOICE (manual input with user_choice: true)
   └─ Пользователь вручную заполнил поле
   └─ НИКОГДА не перезаписывать

2. CATALOG (catalog/blue_room/orange_room)
   └─ Данные из каталога поставщиков
   └─ Можно перезаписать только USER_CHOICE

3. OCR_SUGGESTION (ocr_suggestion)
   └─ Предложения из OCR анализа
   └─ Можно перезаписать CATALOG или выше

4. TEMPLATE (template)
   └─ Данные из шаблонов проектов
   └─ Можно перезаписать OCR или выше

5. PROFILE (profile)
   └─ Данные из профилей (клиент/поставщик)
   └─ Можно перезаписать TEMPLATE или выше

6. ECHO (echo)
   └─ Данные из завершенных проектов
   └─ Самый низкий приоритет
```

### Правила автозаполнения:

#### ✅ РАЗРЕШЕНО:
```typescript
// Низкий приоритет → Высокий приоритет (OK)
if (!manualData[step]?.user_choice) {
  setManualData({ ...data }); // ОК
}

// Пустое поле → Любой источник (OK)
if (!stepConfigs[step]) {
  autoFill(step, data); // ОК
}
```

#### ❌ ЗАПРЕЩЕНО:
```typescript
// Высокий приоритет → Низкий приоритет (ПЛОХО!)
if (stepConfigs[step] === 'catalog') {
  // НЕ перезаписывать OCR!
  if (source === 'ocr') return; // СТОП
}

// USER_CHOICE → Что угодно (ПЛОХО!)
if (manualData[step]?.user_choice) {
  // НИЧЕГО НЕ ДЕЛАТЬ!
  return;
}
```

### Проверка перед автозаполнением:

```typescript
/**
 * Универсальная функция проверки возможности автозаполнения
 */
function canAutoFill(
  step: number,
  newSource: DataSourceType,
  currentConfig: DataSourceType | undefined,
  currentData: any
): boolean {
  // Правило 1: USER_CHOICE абсолютный
  if (currentData?.user_choice === true) {
    console.log(`⏸️ Пропускаем автозаполнение Step ${step} - user_choice`);
    return false;
  }

  // Правило 2: Иерархия приоритетов
  const priorities: Record<DataSourceType, number> = {
    'manual': 6,        // Высший (с user_choice)
    'catalog': 5,
    'blue_room': 5,
    'orange_room': 5,
    'ocr_suggestion': 4,
    'upload': 4,        // OCR через upload
    'template': 3,
    'profile': 2,
    'echo': 1           // Низший
  };

  const currentPriority = currentConfig ? priorities[currentConfig] : 0;
  const newPriority = priorities[newSource];

  if (newPriority <= currentPriority) {
    console.log(`⏸️ Пропускаем автозаполнение Step ${step}: ${newSource}(${newPriority}) <= ${currentConfig}(${currentPriority})`);
    return false;
  }

  // Правило 3: Можно заполнять
  return true;
}
```

---

## 🔧 ПОДСИСТЕМЫ

### 1. OCR Processing System

**Расположение:** `page.tsx` строки 1650-2137 (487 строк)

**Ответственность:**
- Загрузка файлов в Supabase Storage
- OCR анализ через Yandex Vision API
- Извлечение данных компаний (Step 1)
- Извлечение спецификаций (Step 2)
- Извлечение банковских реквизитов (Step 4/5)

**Ключевые функции:**

```typescript
// Главная точка входа
handleFileUpload(stepId, file) → uploadFileToStorage → analyzeDocument

// Анализаторы
analyzeCompanyCard(fileUrl, fileType) → /api/document-analysis → Step 1
analyzeSpecification(fileUrl, fileType) → /api/document-analysis → Step 2

// Извлечение реквизитов
extractBankRequisitesFromInvoice(ocrData) → BankRequisites

// Предложение оплаты
suggestPaymentMethodAndRequisites(bankRequisites, supplierName) → Step 4/5
```

**Флоу OCR для Step 2 → Step 4/5:**

```
1. User uploads invoice
   ↓
2. analyzeSpecification(fileUrl)
   ↓
3. extractBankRequisitesFromInvoice(ocrData)
   ↓ (if bankRequisites.hasRequisites)
4. suggestPaymentMethodAndRequisites(bankRequisites, supplierName)
   ↓
5. ✅ Проверка canAutoFill(4, 'ocr_suggestion', ...)
   ✅ Проверка canAutoFill(5, 'ocr_suggestion', ...)
   ↓ (if can)
6. setManualData({
     4: { method: 'bank-transfer', suggested: true, source: 'ocr' },
     5: { type: 'bank', ...bankRequisites, suggested: true, source: 'ocr' }
   })
   ↓
7. setStepConfigs({ 4: 'ocr_suggestion', 5: 'ocr_suggestion' })
```

**Статус:** ✅ Работает
**Риск поломок:** 🟡 Средний (конфликты с каталогом)
**План защиты:** Добавить `canAutoFill()` проверки (см. раздел "План рефакторинга")

---

### 2. Catalog Integration System

**Расположение:** `page.tsx` строки 2213-2852 (639 строк)

**Ответственность:**
- Выбор товаров из каталога (Step 2)
- Автозаполнение реквизитов поставщика (Step 4/5)
- Работа с 3 комнатами (Blue/Echo/Orange)

**Компоненты:**

```typescript
// Главная функция добавления товаров
handleCatalogProductsAdd(products: CatalogProduct[])
  ↓
  1. Заполнить Step 2 (товары, поставщик, сумма)
  2. setStepConfigs[2] = 'catalog'
  3. Загрузить данные поставщика из API
  4. ❌ ПРОБЛЕМА: Заполнить Step 4/5 БЕЗ проверки приоритета

// Blue Room (личные поставщики)
handleBlueRoomSource() → показывает catalog_user_suppliers

// Orange Room (проверенные поставщики)
handleOrangeRoomSource() → показывает catalog_verified_suppliers

// Echo Cards (из завершенных проектов)
handleEchoSource() → показывает supplier_usage_patterns
```

**Флоу каталога:**

```
1. User clicks "Каталог" на Step 2
   ↓
2. CatalogModal открывается
   ↓
3. User выбирает товары → Корзина
   ↓
4. User clicks "Добавить в проект"
   ↓
5. handleCatalogProductsAdd(cart)
   ↓
6. setManualData[2] = { items, supplier, totalAmount }
   ↓
7. ❌ БАГ: setManualData[4/5] БЕЗ canAutoFill()
   ↓
8. Появляется кубик Step 5 РАНЬШЕ чем Step 4
```

**Статус:** 🔴 Требует исправления
**Проблема:** Автозаполнение Step 4/5 игнорирует `user_choice` и OCR
**План исправления:** См. раздел "План рефакторинга"

---

### 3. Template & Profile System

**Расположение:** `page.tsx` строки 960-1190 (230 строк)

**Ответственность:**
- Загрузка шаблонов проектов
- Применение профилей клиентов/поставщиков
- Заполнение шагов из готовых данных

**Ключевые функции:**

```typescript
applyClientProfile(profileId) → Step 1
applyTemplateStep(templateId, stepId) → Any step
handleFillAllTemplateSteps(templateId) → All steps
```

**Статус:** ✅ Работает
**Риск поломок:** 🟢 Низкий (нет автозаполнения других шагов)

---

### 4. AutoFill System (Legacy)

**Расположение:** `page.tsx` строки 418-461, 844-957 (140 строк)

**Ответственность:**
- Обратное автозаполнение между шагами
- Синхронизация данных

**⚠️ УСТАРЕВШАЯ СИСТЕМА - НЕ ТРОГАТЬ**

```typescript
// useEffect для автоконфигурации Step 5
useEffect(() => {
  // ❌ ПРОБЛЕМА: Срабатывает БЕЗ проверки user_choice
  if (selectedSupplierData || manualData[4]) {
    setStepConfigs[5] = 'catalog';
  }
}, [selectedSupplierData, manualData[4]]);

// Функции автозаполнения
autoFillStepsFromSupplier(step2Data) → Step 4/5
autoFillStepFromRequisites(step4or5Data) → Step 2
```

**Статус:** 🔴 Требует рефакторинга
**Проблема:** Дублирует логику, игнорирует приоритеты
**План:** Заменить на централизованный `AutoFillService`

---

### 5. Step Handlers System

**Расположение:** `page.tsx` строки 1200-1620 (420 строк)

**Ответственность:**
- Обработка кликов по кубикам
- Сохранение данных форм
- Управление UI состоянием

**Ключевые функции:**

```typescript
handleStepHover(stepId) → Наведение на кубик
handleStepClick(stepId) → Клик по кубику
handleSourceSelect(stepId, source) → Выбор источника
handleManualDataSave(stepId, data) → Сохранение данных
```

**Статус:** ✅ Работает
**Риск поломок:** 🟢 Низкий

---

## 📐 ПЛАН РЕФАКТОРИНГА

### Текущие проблемы:

1. 🔴 **Монолитный файл** - 5808 строк, сложно найти логику
2. 🔴 **Конфликты автозаполнения** - каталог vs OCR vs template
3. 🔴 **Дублирование кода** - 3 места вызова OCR autofill
4. 🟡 **Нет системы приоритетов** - источники перезаписывают друг друга
5. 🟡 **Нет защиты от поломок** - нет тестов, нет документации функций

---

### 🎯 Фаза 1: Централизация автозаполнения (ПРИОРИТЕТ 1)

**Время:** 2-4 часа
**Риск:** 🟡 Средний (30-40%)

#### Задачи:

**1.1. Создать AutoFillService**

```typescript
// /lib/services/AutoFillService.ts

export class AutoFillService {

  /**
   * Проверка возможности автозаполнения
   */
  static canAutoFill(
    step: number,
    newSource: DataSourceType,
    currentState: AtomicConstructorState
  ): boolean {
    const currentConfig = currentState.stepConfigs[step];
    const currentData = currentState.manualData[step];

    // Правило 1: USER_CHOICE абсолютный
    if (currentData?.user_choice === true) {
      return false;
    }

    // Правило 2: Иерархия приоритетов
    const priorities = {
      'manual': 6,
      'catalog': 5,
      'blue_room': 5,
      'orange_room': 5,
      'ocr_suggestion': 4,
      'upload': 4,
      'template': 3,
      'profile': 2,
      'echo': 1
    };

    const currentPriority = currentConfig ? priorities[currentConfig] : 0;
    const newPriority = priorities[newSource];

    return newPriority > currentPriority;
  }

  /**
   * Безопасное автозаполнение с проверками
   */
  static safeAutoFill(
    step: number,
    data: any,
    source: DataSourceType,
    state: AtomicConstructorState,
    setState: (newState: Partial<AtomicConstructorState>) => void
  ): boolean {
    if (!this.canAutoFill(step, source, state)) {
      console.log(`⏸️ AutoFill: Пропущен Step ${step} - приоритет ${source}`);
      return false;
    }

    setState({
      manualData: {
        ...state.manualData,
        [step]: { ...data, source }
      },
      stepConfigs: {
        ...state.stepConfigs,
        [step]: source
      }
    });

    console.log(`✅ AutoFill: Заполнен Step ${step} из ${source}`);
    return true;
  }
}
```

**1.2. Обновить OCR suggestPaymentMethodAndRequisites**

```typescript
// page.tsx строка 2061
const suggestPaymentMethodAndRequisites = (bankRequisites, supplierName) => {
  console.log("💡 OCR: Предлагаем реквизиты...");

  // ✅ НОВОЕ: Проверка приоритетов
  const canFillStep4 = AutoFillService.canAutoFill(4, 'ocr_suggestion', {
    stepConfigs,
    manualData
  });

  const canFillStep5 = AutoFillService.canAutoFill(5, 'ocr_suggestion', {
    stepConfigs,
    manualData
  });

  if (!canFillStep4 && !canFillStep5) {
    console.log("⏸️ OCR: Пропускаем - уже заполнено источником с выше приоритетом");
    return;
  }

  // Заполняем только разрешенные шаги
  if (canFillStep4) {
    AutoFillService.safeAutoFill(
      4,
      { method: 'bank-transfer', supplier: supplierName, suggested: true },
      'ocr_suggestion',
      { stepConfigs, manualData },
      ({ manualData: md, stepConfigs: sc }) => {
        setManualData(md);
        setStepConfigs(sc);
      }
    );
  }

  if (canFillStep5) {
    AutoFillService.safeAutoFill(
      5,
      { type: 'bank', ...bankRequisites, suggested: true },
      'ocr_suggestion',
      { stepConfigs, manualData },
      ({ manualData: md, stepConfigs: sc }) => {
        setManualData(md);
        setStepConfigs(sc);
      }
    );
  }
};
```

**1.3. Обновить handleCatalogProductsAdd**

```typescript
// page.tsx строка 2213
const handleCatalogProductsAdd = async (products) => {
  // ... существующий код заполнения Step 2 ...

  // Загружаем данные поставщика
  const supplierData = await fetchCatalogData(...);

  // ✅ НОВОЕ: Безопасное автозаполнение Step 4/5
  if (supplierData.payment_methods?.includes('bank')) {
    AutoFillService.safeAutoFill(4, {
      method: 'bank-transfer',
      supplier: supplierData.name
    }, 'catalog', { stepConfigs, manualData }, setState);

    AutoFillService.safeAutoFill(5, {
      type: 'bank',
      bankName: supplierData.bank_accounts?.[0]?.bank_name,
      accountNumber: supplierData.bank_accounts?.[0]?.account_number,
      // ...
    }, 'catalog', { stepConfigs, manualData }, setState);
  }
};
```

**1.4. Исправить useEffect (строка 418)**

```typescript
useEffect(() => {
  // ✅ НОВОЕ: Проверка приоритета
  if (selectedSupplierData || manualData[4]) {
    const canFill = AutoFillService.canAutoFill(5, 'catalog', {
      stepConfigs,
      manualData
    });

    if (canFill && hasStep5AutofillData) {
      setStepConfigs(prev => ({ ...prev, 5: 'catalog' }));
    }
  }
}, [selectedSupplierData, manualData[4], stepConfigs[5]]);
```

---

### 🎯 Фаза 2: Извлечение OCR в сервис (ПРИОРИТЕТ 2)

**Время:** 3-5 часов
**Риск:** 🟢 Низкий (10-20%)

#### Новые файлы:

```
/lib/services/OCRProcessingService.ts (300 строк)
  ├─ analyzeCompanyCard()
  ├─ analyzeSpecification()
  ├─ extractBankRequisites()
  └─ suggestPaymentMethod()

/hooks/useOCRProcessing.ts (150 строк)
  ├─ handleFileUpload()
  ├─ handleOCRAnalysis()
  └─ handleOCRSuggestion()

/types/ocr.types.ts (50 строк)
  └─ OCRResult, BankRequisites, PaymentSuggestion
```

#### Преимущества:
- ✅ Изолированная система OCR
- ✅ Rollback при ошибках
- ✅ Легко тестировать
- ✅ Уменьшает page.tsx на ~487 строк

---

### 🎯 Фаза 3: Разделение JSX (ПРИОРИТЕТ 3)

**Время:** 4-6 часов
**Риск:** 🟢 Низкий (15-20%)

#### Новые компоненты:

```
/components/project-constructor/blocks/
  ├─ StepCubesBlock.tsx (165 строк) - 7 кубиков
  ├─ StepConfigurationBlock.tsx (800 строк) - выбор источников
  ├─ DealAnimationBlock.tsx (400 строк) - анимации
  ├─ SummaryBlock.tsx (300 строк) - сводка и запуск
  └─ StepFormsRenderer.tsx (500 строк) - формы шагов
```

#### Преимущества:
- ✅ Уменьшает page.tsx на ~2057 строк
- ✅ Улучшает читаемость
- ✅ Упрощает поиск UI элементов

---

### 🎯 Фаза 4: Юнит-тесты (ПРИОРИТЕТ 4)

**Время:** 2-3 часа
**Риск:** 🟢 Низкий (5%)

```typescript
// __tests__/AutoFillService.test.ts
describe('AutoFill Priority System', () => {
  test('USER_CHOICE блокирует всё', () => {
    const state = {
      manualData: { 4: { user_choice: true } }
    };
    expect(AutoFillService.canAutoFill(4, 'catalog', state)).toBe(false);
    expect(AutoFillService.canAutoFill(4, 'ocr', state)).toBe(false);
  });

  test('Catalog > OCR', () => {
    const state = { stepConfigs: { 4: 'catalog' } };
    expect(AutoFillService.canAutoFill(4, 'ocr', state)).toBe(false);
  });

  test('OCR > Template', () => {
    const state = { stepConfigs: { 4: 'template' } };
    expect(AutoFillService.canAutoFill(4, 'ocr', state)).toBe(true);
  });
});
```

---

## 📏 ПРАВИЛА РАЗРАБОТКИ

### 1. Иерархия приоритетов - СВЯЩЕННА

```typescript
// ✅ ВСЕГДА проверяй перед автозаполнением
if (!AutoFillService.canAutoFill(step, source, state)) {
  return; // СТОП
}

// ❌ НИКОГДА не перезаписывай напрямую
setManualData({ ...prev, [step]: data }); // ПЛОХО!
```

### 2. Логирование - ОБЯЗАТЕЛЬНО

```typescript
// ✅ Логируй ВСЕ автозаполнения
console.log(`✅ AutoFill: Step ${step} ← ${source}`);
console.log(`⏸️ AutoFill: Пропущен Step ${step} - ${reason}`);
console.log(`🔍 AutoFill: Проверка Step ${step}: ${source} vs ${current}`);
```

### 3. TypeScript - СТРОГО

```typescript
// ✅ Типизируй всё
type DataSourceType =
  | 'manual'
  | 'catalog'
  | 'blue_room'
  | 'orange_room'
  | 'ocr_suggestion'
  | 'upload'
  | 'template'
  | 'profile'
  | 'echo';

// ❌ Избегай any
const data: any = {}; // ПЛОХО!
const data: StepData = {}; // ХОРОШО!
```

### 4. Функции - ЧИСТЫЕ И ТЕСТИРУЕМЫЕ

```typescript
// ✅ Чистая функция - легко тестировать
function canAutoFill(step, source, state): boolean {
  // Нет side effects
  return true/false;
}

// ❌ Грязная функция - сложно тестировать
function autoFill(step, data) {
  setManualData(...); // side effect
  setStepConfigs(...); // side effect
  callAPI(...); // side effect
}
```

### 5. Документация - ПЕРЕД КОДОМ

```typescript
/**
 * Проверяет возможность автозаполнения шага
 *
 * @priority CRITICAL
 * @affects Steps 1-7
 *
 * @param step - Номер шага (1-7)
 * @param source - Источник данных
 * @param state - Текущее состояние
 *
 * @returns true если можно заполнять, false если нельзя
 *
 * @example
 * if (canAutoFill(4, 'ocr', state)) {
 *   // можно заполнять
 * }
 */
function canAutoFill(...) { ... }
```

---

## 🚨 КРИТИЧНЫЕ ЗОНЫ - НЕ ТРОГАТЬ БЕЗ ТЕСТОВ

### ⛔ Функции под защитой:

```typescript
// page.tsx
- suggestPaymentMethodAndRequisites (2061-2136) ← OCR Step 4/5
- extractBankRequisitesFromInvoice (1944-2058) ← OCR реквизиты
- analyzeSpecification (1808-1941) ← OCR Step 2
- analyzeCompanyCard (1709-1805) ← OCR Step 1
- handleCatalogProductsAdd (2213-2401) ← Каталог

// Перед изменением:
1. Прочитать эту документацию
2. Написать тест
3. Убедиться что приоритеты соблюдены
4. Протестировать все сценарии
```

---

## 📊 МЕТРИКИ КАЧЕСТВА

### Текущее состояние:

| Метрика | Значение | Цель |
|---------|----------|------|
| Размер page.tsx | 5808 строк | <2000 строк |
| Покрытие тестами | 0% | >80% |
| Документация | 40% | 100% |
| TypeScript strict | Частично | Полностью |
| Дублирование кода | ~15% | <5% |

### После рефакторинга (Фазы 1-4):

| Метрика | Значение |
|---------|----------|
| Размер page.tsx | ~1795 строк (-69%) |
| Покрытие тестами | >80% |
| Документация | 100% |
| Дублирование кода | <5% |

---

## 🎓 ГЛОССАРИЙ

- **Атомарность** - независимость шагов друг от друга
- **Автозаполнение** - автоматическое заполнение шагов из разных источников
- **Приоритет источника** - важность источника данных (USER > CATALOG > OCR > TEMPLATE > PROFILE > ECHO)
- **user_choice** - флаг что пользователь вручную заполнил поле
- **suggested** - флаг что данные предложены системой, но не подтверждены пользователем
- **stepConfigs** - конфигурация источников для каждого шага
- **manualData** - фактические данные каждого шага

---

## 📚 СВЯЗАННЫЕ ДОКУМЕНТЫ

- [ATOMIC_DEAL_CONSTRUCTOR_DOCUMENTATION.md](../archive/documentation/ATOMIC_DEAL_CONSTRUCTOR_DOCUMENTATION.md) - Базовая документация
- [OCR_INTEGRATION_ATOMIC_CONSTRUCTOR.md](../OCR_INTEGRATION_ATOMIC_CONSTRUCTOR.md) - OCR интеграция
- API документация: `/api/document-analysis/route.ts`
- Компоненты: `/components/project-constructor/`

---

## ✍️ ИСТОРИЯ ИЗМЕНЕНИЙ

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-10-02 | 2.0 | Создана мастер-архитектура, добавлена система приоритетов | AI Assistant |
| 2025-01-12 | 1.1 | Добавлена OCR интеграция | - |
| 2025-01-12 | 1.0 | Создана базовая документация | - |

---

**ВАЖНО:** Эта документация - **ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ** для разработки атомарного конструктора. Любые изменения в коде должны отражаться здесь.
