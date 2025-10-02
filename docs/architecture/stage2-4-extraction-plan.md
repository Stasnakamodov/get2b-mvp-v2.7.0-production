# 📋 ПЛАН БЕЗОПАСНОГО ИЗВЛЕЧЕНИЯ STAGE 2-4 ИЗ МОНОЛИТА

## 🎯 ЦЕЛЬ
Извлечь Stage 2, 3 и 4 из монолита `page.tsx` (4918 строк), оставив только Stage 1 для последующего рефакторинга.

---

## 📊 ТЕКУЩЕЕ СОСТОЯНИЕ

### Монолит page.tsx: 4918 строк
- **Stage 1 (Data Preparation)**: ~3500 строк (основная сложность)
- **Stage 2-4 логика в монолите**: ~400-500 строк
- **Уже извлеченные компоненты Stage 2-4**: 684 строки
  - `PaymentForm.tsx`: 289 строк (Stage 2)
  - `DealAnimation.tsx`: 115 строк (Stage 3)
  - `ManagerReceiptSection.tsx`: 134 строк (Stage 3)
  - `ClientReceiptUploadSection.tsx`: 146 строк (Stage 4)
  - `StageRouter.tsx`: 172 строки (роутер для всех этапов)

### ✅ ЧТО УЖЕ ВЫНЕСЕНО
1. ✅ **StageRouter** - UI рендеринг для Stage 2-4
2. ✅ **PaymentForm** - форма оплаты (Stage 2)
3. ✅ **DealAnimation** - анимация сделки (Stage 3)
4. ✅ **ManagerReceiptSection** - секция чека менеджера (Stage 3)
5. ✅ **ClientReceiptUploadSection** - загрузка чека клиента (Stage 4)

### ❌ ЧТО ОСТАЛОСЬ В МОНОЛИТЕ

#### **Stage 2 состояния (в page.tsx строки 191-242):**
```typescript
const [currentStage, setCurrentStage] = useState<number>(1)
const [dontShowStageTransition, setDontShowStageTransition] = useState<boolean>(false)
const [stageTransitionShown, setStageTransitionShown] = useState<boolean>(false)
const [managerNotification, setManagerNotification] = useState<{...}>()
const [managerApprovalStatus, setManagerApprovalStatus] = useState<...>(null)
const [managerApprovalMessage, setManagerApprovalMessage] = useState<string>('')
const [receiptApprovalStatus, setReceiptApprovalStatus] = useState<...>(null)
```

#### **Stage 3 состояния (строки 218-220):**
```typescript
const [dealAnimationStep, setDealAnimationStep] = useState<number>(0)
const [dealAnimationStatus, setDealAnimationStatus] = useState<string>('')
const [dealAnimationComplete, setDealAnimationComplete] = useState<boolean>(false)
```

#### **Stage 4 состояния (строки 239-242):**
```typescript
const [clientReceiptFile, setClientReceiptFile] = useState<File | null>(null)
const [clientReceiptUrl, setClientReceiptUrl] = useState<string | null>(null)
const [clientReceiptUploadError, setClientReceiptUploadError] = useState<string | null>(null)
```

#### **Функции переходов между этапами:**
- `proceedToStage2()` - строка 1415 (~33 строки)
- `returnToStage1Editing()` - строка 1450 (~15 строк)
- `proceedToStage3()` - строка 1495 (~6 строк)
- `startDealAnimation()` - строка 1466 (~26 строк)
- `handleSendToManager()` - строка 2997 (~52 строки)
- `sendManagerReceiptRequest()` - строка 280 (~78 строк)
- `handleClientReceiptUpload()` - строка 730 (~50 строк)

#### **Хуки для Stage 2-4:**
- `useFileUpload` - уже выделен (строки 264-277)
- `useProjectPolling` - уже выделен (строки 359-370)
- `useReceiptRemoval` - уже выделен (строки 392-399)

---

## ⚠️ КРИТИЧЕСКИЕ ЗАВИСИМОСТИ

### 🔴 **ОПАСНО ТРОГАТЬ:**

1. **Stage 1 функции используют Stage 2-4 состояния:**
   - `checkSummaryReadiness()` проверяет `currentStage >= 2` (строка 1552)
   - `goToNextStage()` вызывает `proceedToStage2()` и `startDealAnimation()` (строки 1398-1408)
   - `isStepEnabled()` зависит от `currentStage` (строки 1505-1532)

2. **Модальные окна Stage 1 переходят в Stage 2:**
   - `SummaryModal` передаёт `proceedToStage2` как `proceedToNextStage` (строка 4894)
   - `Stage2SummaryModal` вызывает `proceedToStage3` (строка 4904)

3. **Polling зависит от currentStage:**
   - `useProjectPolling` получает `currentStage` как зависимость (строка 367)
   - Проверка `currentStage >= 2` в `checkSummaryReadiness()` (строка 1552)

### 🟢 **БЕЗОПАСНО ИЗВЛЕЧЬ:**

1. **Чистые UI компоненты** (уже извлечены)
2. **Изолированные функции анимации** (можно вынести)
3. **Хуки для Stage 2-4** (уже вынесены)

---

## 📝 ПЛАН ИЗВЛЕЧЕНИЯ

### **ФАЗА 1: Создание Stage2Container (~2 часа)**

**Что извлекаем:**
- UI и логику Stage 2 (manager approval & payment)
- Функцию `handleSendToManager()` → перенести в Stage2Container
- Функцию `proceedToStage2()` → упростить в монолите до вызова setCurrentStage(2)
- Состояния `managerApprovalStatus`, `managerApprovalMessage`, `managerNotification`

**Создаём файл:** `/components/project-constructor/Stage2Container.tsx`

**Интерфейс:**
```typescript
interface Stage2ContainerProps {
  currentStage: number
  setCurrentStage: React.Dispatch<React.SetStateAction<number>>
  managerApprovalStatus: string | null
  setManagerApprovalStatus: React.Dispatch<React.SetStateAction<...>>
  managerApprovalMessage: string | null
  setManagerApprovalMessage: React.Dispatch<React.SetStateAction<string>>
  receiptApprovalStatus: string | null
  setReceiptApprovalStatus: React.Dispatch<React.SetStateAction<...>>
  projectRequestId: string
  manualData: Record<number, any>
  uploadSupplierReceipt: (file: File) => Promise<string | null>
  supabase: SupabaseClient
  POLLING_INTERVALS: { PROJECT_STATUS_CHECK: number }
  // Внутри Stage2Container будет:
  // - handleSendToManager() локально
  // - render StageRouter для Stage 2
}
```

**Шаги:**
1. Создать `Stage2Container.tsx`
2. Перенести логику `handleSendToManager()` в Stage2Container
3. Импортировать StageRouter, PaymentForm, WaitingApprovalLoader
4. Удалить из page.tsx:
   - `handleSendToManager()` (52 строки)
   - `managerNotification` state (если не используется в Stage 1)
5. Упростить `proceedToStage2()` до:
   ```typescript
   const proceedToStage2 = () => {
     setCurrentStage(2)
     setManagerApprovalStatus('pending')
   }
   ```

**Результат:** page.tsx сократится на ~60 строк

---

### **ФАЗА 2: Создание Stage3Container (~1.5 часа)**

**Что извлекаем:**
- UI и логику Stage 3 (deal animation & manager receipt)
- Функцию `startDealAnimation()` → перенести в Stage3Container
- Функцию `sendManagerReceiptRequest()` → перенести в Stage3Container
- Состояния `dealAnimationStep`, `dealAnimationStatus`, `dealAnimationComplete`

**Создаём файл:** `/components/project-constructor/Stage3Container.tsx`

**Интерфейс:**
```typescript
interface Stage3ContainerProps {
  currentStage: number
  setCurrentStage: React.Dispatch<React.SetStateAction<number>>
  receiptApprovalStatus: string | null
  projectRequestId: string
  supabase: SupabaseClient
  // Внутри Stage3Container будет:
  // - startDealAnimation() локально
  // - sendManagerReceiptRequest() локально
  // - dealAnimation states локально
  // - render DealAnimation + ManagerReceiptSection
}
```

**Шаги:**
1. Создать `Stage3Container.tsx`
2. Перенести логику `startDealAnimation()` в Stage3Container
3. Перенести логику `sendManagerReceiptRequest()` в Stage3Container
4. Перенести states: `dealAnimationStep`, `dealAnimationStatus`, `dealAnimationComplete`
5. Удалить из page.tsx:
   - `startDealAnimation()` (26 строк)
   - `sendManagerReceiptRequest()` (78 строк)
   - `dealAnimation` states (3 строки)
6. Упростить `proceedToStage3()` до:
   ```typescript
   const proceedToStage3 = () => {
     setCurrentStage(3)
     closeModal('stage2Summary')
   }
   ```

**Результат:** page.tsx сократится на ~110 строк

---

### **ФАЗА 3: Создание Stage4Container (~1 час)**

**Что извлекаем:**
- UI и логику Stage 4 (client receipt upload)
- Функцию `handleClientReceiptUpload()` → перенести в Stage4Container
- Состояния `clientReceiptFile`, `clientReceiptUrl`, `clientReceiptUploadError`

**Создаём файл:** `/components/project-constructor/Stage4Container.tsx`

**Интерфейс:**
```typescript
interface Stage4ContainerProps {
  currentStage: number
  setCurrentStage: React.Dispatch<React.SetStateAction<number>>
  projectRequestId: string
  handleShowProjectDetails: () => Promise<void>
  // Внутри Stage4Container будет:
  // - handleClientReceiptUpload() локально
  // - handleRemoveClientReceipt() из useReceiptRemoval
  // - clientReceipt states локально
  // - render ClientReceiptUploadSection
}
```

**Шаги:**
1. Создать `Stage4Container.tsx`
2. Перенести логику `handleClientReceiptUpload()` в Stage4Container
3. Интегрировать `useReceiptRemoval` внутри Stage4Container
4. Перенести states: `clientReceiptFile`, `clientReceiptUrl`, `clientReceiptUploadError`
5. Удалить из page.tsx:
   - `handleClientReceiptUpload()` (50 строк)
   - `clientReceipt` states (3 строки)
   - Вызов `useReceiptRemoval` (если не нужен в Stage 1)

**Результат:** page.tsx сократится на ~60 строк

---

### **ФАЗА 4: Обновление StageRouter для композиции (~30 мин)**

**Что меняем:**
Вместо того, чтобы StageRouter рендерил UI напрямую, он будет использовать контейнеры:

```typescript
// StageRouter.tsx
if (currentStage === 2) {
  return (
    <Stage2Container
      currentStage={currentStage}
      setCurrentStage={setCurrentStage}
      {...stage2Props}
    />
  )
}

if (currentStage === 3) {
  return (
    <Stage3Container
      currentStage={currentStage}
      setCurrentStage={setCurrentStage}
      {...stage3Props}
    />
  )
}

if (currentStage === 4) {
  return (
    <Stage4Container
      currentStage={currentStage}
      setCurrentStage={setCurrentStage}
      {...stage4Props}
    />
  )
}

// Stage 1 (default)
return <>{children}</>
```

---

### **ФАЗА 5: Упрощение монолита (~30 мин)**

**Финальная очистка page.tsx:**

1. **Удалить неиспользуемые импорты:**
   - `WaitingApprovalLoader`, `RejectionMessage` (если не в Stage 1)
   - `PaymentForm`, `DealAnimation`, `ManagerReceiptSection`, `ClientReceiptUploadSection`

2. **Удалить неиспользуемые состояния:**
   - Все Stage 2-4 states, если перенесены в контейнеры

3. **Упростить функции перехода:**
   ```typescript
   // Было: proceedToStage2() - 33 строки
   // Стало:
   const proceedToStage2 = () => {
     setCurrentStage(2)
     closeModal('stageTransition')
   }
   ```

4. **Обновить StageRouter в page.tsx:**
   ```typescript
   <StageRouter
     currentStage={currentStage}
     setCurrentStage={setCurrentStage}
     {...stage2Props}
     {...stage3Props}
     {...stage4Props}
   >
     {/* Stage 1 content остаётся здесь */}
   </StageRouter>
   ```

**Результат:** page.tsx сократится ещё на ~50 строк

---

## 📈 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### **ДО (текущее состояние):**
- `page.tsx`: **4918 строк** 🔴
- Stage 1 смешан с Stage 2-4

### **ПОСЛЕ (финальное состояние):**
- `page.tsx`: **~4650 строк** ✅ (сокращение на ~270 строк)
- `Stage2Container.tsx`: **~100 строк** (новый файл)
- `Stage3Container.tsx`: **~150 строк** (новый файл)
- `Stage4Container.tsx`: **~80 строк** (новый файл)
- `StageRouter.tsx`: **~200 строк** (обновлён для композиции)

### **Преимущества:**
1. ✅ **Изоляция Stage 1** - чистый монолит только с Stage 1
2. ✅ **Модульность Stage 2-4** - каждый этап в своём контейнере
3. ✅ **Безопасность** - Stage 1 не трогаем, работаем только с Stage 2-4
4. ✅ **Подготовка к рефакторингу Stage 1** - чистая база для последующих хуков

---

## ⏱️ ВРЕМЕННАЯ ОЦЕНКА

| Фаза | Время | Описание |
|------|-------|----------|
| **Фаза 1** | 2 часа | Stage2Container + handleSendToManager |
| **Фаза 2** | 1.5 часа | Stage3Container + animation logic |
| **Фаза 3** | 1 час | Stage4Container + receipt upload |
| **Фаза 4** | 30 мин | Обновление StageRouter |
| **Фаза 5** | 30 мин | Очистка и упрощение монолита |
| **ИТОГО** | **5.5 часов** | Один рабочий день |

---

## 🚨 РИСКИ И МИТИГАЦИЯ

### **РИСК 1: Потеря функционала при переносе**
**Митигация:**
- ✅ Делать коммит после каждой фазы
- ✅ Тестировать переход между этапами после каждого коммита
- ✅ Сохранять все props interfaces в контейнерах

### **РИСК 2: Сломанные зависимости между этапами**
**Митигация:**
- ✅ Не трогать `currentStage` и `setCurrentStage` - передавать как props
- ✅ Не менять сигнатуры функций перехода (proceedToStage2, proceedToStage3)
- ✅ Проверять все `useEffect` зависимости после переноса

### **РИСК 3: Polling и WebSocket зависимости**
**Митигация:**
- ✅ `useProjectPolling` остаётся в page.tsx и передаётся как props
- ✅ `sendManagerReceiptRequest` переносится в Stage3Container, но вызывается через props
- ✅ Проверить все Supabase subscriptions после переноса

---

## ✅ КРИТЕРИИ УСПЕХА

1. ✅ **Все переходы между этапами работают**
   - Stage 1 → Stage 2 (через модальное окно)
   - Stage 2 → Stage 3 (после апрува менеджера)
   - Stage 3 → Stage 4 (после анимации и чека)

2. ✅ **Все модальные окна работают**
   - Summary Modal показывается на Stage 1
   - Stage Transition Modal работает
   - Stage 2 Summary Modal работает

3. ✅ **Все состояния синхронизированы**
   - `currentStage` правильно обновляется
   - `managerApprovalStatus` синхронизирован
   - `receiptApprovalStatus` синхронизирован

4. ✅ **Нет TypeScript ошибок**
   - Все props interfaces корректны
   - Все импорты работают
   - Нет missing dependencies в useEffect

5. ✅ **Монолит сократился минимум на 250 строк**
   - page.tsx < 4670 строк
   - Stage 1 изолирован от Stage 2-4

---

## 🎯 СЛЕДУЮЩИЙ ШАГ ПОСЛЕ ИЗВЛЕЧЕНИЯ

После успешного извлечения Stage 2-4:
1. ✅ Монолит будет содержать ТОЛЬКО Stage 1 (~4650 строк)
2. ✅ Можно приступать к рефакторингу Stage 1 хуками (согласно [stage1-visual-comparison.md](./stage1-visual-comparison.md))
3. ✅ Stage 2-4 изолированы и не будут мешать рефакторингу

---

## 📝 КОНТРОЛЬНЫЙ СПИСОК (ЧЕКЛИСТ)

### **Перед началом:**
- [ ] Закоммитить текущее состояние (safety commit)
- [ ] Убедиться, что dev server запущен
- [ ] Открыть два терминала (dev + git)

### **Фаза 1: Stage2Container**
- [ ] Создать `/components/project-constructor/Stage2Container.tsx`
- [ ] Перенести `handleSendToManager()` в Stage2Container
- [ ] Перенести `managerNotification` state (если используется только в Stage 2)
- [ ] Обновить импорты в page.tsx
- [ ] Упростить `proceedToStage2()` в page.tsx
- [ ] Тест: переход Stage 1 → Stage 2 работает
- [ ] Коммит: `feat: Extract Stage2Container from monolith`

### **Фаза 2: Stage3Container**
- [ ] Создать `/components/project-constructor/Stage3Container.tsx`
- [ ] Перенести `startDealAnimation()` в Stage3Container
- [ ] Перенести `sendManagerReceiptRequest()` в Stage3Container
- [ ] Перенести `dealAnimation` states в Stage3Container
- [ ] Обновить импорты в page.tsx
- [ ] Упростить `proceedToStage3()` в page.tsx
- [ ] Тест: переход Stage 2 → Stage 3 работает
- [ ] Тест: анимация сделки работает
- [ ] Коммит: `feat: Extract Stage3Container from monolith`

### **Фаза 3: Stage4Container**
- [ ] Создать `/components/project-constructor/Stage4Container.tsx`
- [ ] Перенести `handleClientReceiptUpload()` в Stage4Container
- [ ] Перенести `clientReceipt` states в Stage4Container
- [ ] Интегрировать `useReceiptRemoval` в Stage4Container
- [ ] Обновить импорты в page.tsx
- [ ] Тест: переход Stage 3 → Stage 4 работает
- [ ] Тест: загрузка чека клиента работает
- [ ] Коммит: `feat: Extract Stage4Container from monolith`

### **Фаза 4: Обновление StageRouter**
- [ ] Обновить StageRouter для использования контейнеров
- [ ] Передать props в Stage2Container, Stage3Container, Stage4Container
- [ ] Проверить все условия рендеринга (currentStage === 2/3/4)
- [ ] Тест: все этапы рендерятся корректно
- [ ] Коммит: `refactor: Update StageRouter to use stage containers`

### **Фаза 5: Очистка монолита**
- [ ] Удалить неиспользуемые импорты из page.tsx
- [ ] Удалить неиспользуемые states из page.tsx
- [ ] Упростить функции перехода (proceedToStage2/3)
- [ ] Проверить отсутствие TypeScript ошибок
- [ ] Проверить отсутствие ESLint warnings
- [ ] Тест: полный flow Stage 1 → 2 → 3 → 4 работает
- [ ] Коммит: `refactor: Clean up monolith after stage extraction`

### **Финальная проверка:**
- [ ] Запустить полный тест flow (все 4 этапа)
- [ ] Проверить все модальные окна
- [ ] Проверить все переходы между этапами
- [ ] Проверить polling и subscriptions
- [ ] Подсчитать строки: `wc -l page.tsx` (должно быть < 4670)
- [ ] Создать финальный коммит: `feat: Complete Stage 2-4 extraction from monolith`

---

## 🎉 ГОТОВО!

После выполнения всех фаз:
- ✅ Stage 2-4 изолированы в отдельных контейнерах
- ✅ Монолит сократился на ~270 строк
- ✅ Stage 1 изолирован и готов к рефакторингу
- ✅ Все функции работают как раньше
- ✅ Код стал более модульным и читабельным

**Следующий шаг:** Рефакторинг Stage 1 с помощью хуков (согласно плану из stage1-visual-comparison.md)
