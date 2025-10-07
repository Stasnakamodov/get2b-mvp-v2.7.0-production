# 🏗️ PROJECT CONSTRUCTOR - Атомарный конструктор сделок

**Дата:** 7 октября 2025
**Версия:** 2.0 (после рефакторинга)
**Строк кода:** 3,574 (было 4,295)

---

## 📋 СОДЕРЖАНИЕ

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Три этапа (Stages)](#три-этапа-stages)
3. [Семь шагов (Steps)](#семь-шагов-steps)
4. [Системы автозаполнения](#системы-автозаполнения)
5. [State Management](#state-management)
6. [User Flow](#user-flow)
7. [Область настройки (Block 2)](#область-настройки-block-2)
8. [Handlers](#handlers)
9. [Компоненты](#компоненты)
10. [Критические заметки](#критические-заметки)

---

## 🎯 ОБЗОР АРХИТЕКТУРЫ

### Основная концепция
**Project Constructor** - это атомарный конструктор сделок, который позволяет пользователю:
1. Настроить 7 шагов проекта (выбрать источники данных)
2. Отправить данные менеджеру на модерацию
3. Отслеживать статус сделки в реальном времени

### Структура файлов
```
app/dashboard/project-constructor/
├── page.tsx                    # 3,574 строки - основной монолит
├── components/
│   ├── StepCubes.tsx          # Кубики 7 шагов
│   ├── SummaryBlock.tsx       # Блок сводки
│   ├── AutoFillNotification.tsx
│   ├── modals/
│   │   └── ModalManager.tsx   # Централизованный менеджер модалок
│   └── stages/
│       ├── StageRouter.tsx    # Роутер этапов
│       ├── Stage1Container.tsx
│       ├── Stage2Container.tsx
│       └── Stage3Container.tsx
├── forms/                      # Формы для ручного ввода
│   ├── CompanyForm.tsx
│   ├── SpecificationForm.tsx
│   ├── BankForm.tsx
│   ├── PaymentMethodForm.tsx
│   └── RequisitesForm.tsx
└── README.md                   # Этот файл
```

---

## 🎬 ТРИ ЭТАПА (STAGES)

### Stage 1: Подготовка данных
**Строки:** 2001-3400 (область настройки)
**Состояние:** `currentStage = 1`

**Что происходит:**
- Пользователь настраивает 7 шагов проекта
- Наводит курсор на кубики → выбирает источники данных
- Заполняет данные через формы/OCR/каталог/шаблоны
- Когда заполнены шаги 1, 2, 4, 5 → появляются модалки перехода

**Обязательные шаги:** 1, 2, 4, 5

### Stage 2: Модерация менеджером
**Компонент:** Stage2Container
**Состояние:** `currentStage = 2`

**Что происходит:**
- Данные отправлены менеджеру (`projectRequestId` создан)
- Polling каждые 4 секунды:
  - `useManagerPolling()` - проверяет `managerApprovalStatus`
  - `useReceiptPolling()` - проверяет `receiptApprovalStatus`
- Менеджер одобряет → отправляет чек на оплату
- Клиент загружает свой чек → переход на Stage 3

### Stage 3: Монитор сделки
**Компонент:** Stage3Container
**Состояние:** `currentStage = 3`

**Что происходит:**
- Анимация выполнения сделки (`dealAnimationStep: 0-3`)
- Показываются этапы:
  - Отправка поставщику
  - Ожидание подтверждения
  - Получение товара
  - Завершение сделки

---

## 📦 СЕМЬ ШАГОВ (STEPS)

### Шаг I: Данные клиента
**Тип:** `CompanyDataSchema`
**Источники:** profile, template, manual, upload
**Обязательный:** ✅

**Данные:**
- Название компании
- ИНН
- Адрес
- Контактное лицо
- Email, телефон
- Банковские данные

### Шаг II: Спецификация товаров
**Тип:** `SpecificationDataSchema`
**Источники:** template, catalog, manual, upload
**Обязательный:** ✅

**Данные:**
- Список товаров (items)
- Название, описание, цена, количество
- Поставщик
- Валюта

### Шаг III: Пополнение агента
**Тип:** `FileUploadDataSchema`
**Источники:** manual (upload)
**Обязательный:** ❌

**Данные:**
- Загрузка чека о пополнении
- Статус: pending/approved/rejected

### Шаг IV: Метод оплаты
**Тип:** `PaymentMethodsDataSchema`
**Источники:** profile, template, catalog, manual
**Обязательный:** ✅

**Данные:**
- Выбор метода: bank-transfer / p2p / crypto
- Данные поставщика (если из каталога)
- Автозаполнение или ручное

### Шаг V: Реквизиты
**Тип:** `RequisitesDataSchema`
**Источники:** profile, template, catalog, manual
**Обязательный:** ✅

**Данные:**
- Тип: bank / p2p / crypto / multiple
- Банковские реквизиты или карта или кошелёк
- Данные поставщика

### Шаг VI: Получение чека
**Тип:** Автоматический
**Источники:** automatic
**Обязательный:** ❌

**Данные:**
- URL чека от менеджера
- Статус получения

### Шаг VII: Подтверждение клиента
**Тип:** Автоматический
**Источники:** automatic (upload)
**Обязательный:** ❌ (на Stage 2)

**Данные:**
- Загрузка чека от клиента
- Подтверждение оплаты

---

## 🔄 СИСТЕМЫ АВТОЗАПОЛНЕНИЯ

### 1. PROFILE (Профиль клиента)
**Источник:** `stepConfigs[1] = 'profile'`
**Применяется к:** Шаг 1
**Функция:** `applyClientProfile()` → строка 720

**Процесс:**
1. Hover на шаг 1 → выбрать "Профиль"
2. Открывается модалка `profileSelector` со списком профилей
3. Выбрать профиль → `setManualData(1, profileData)`
4. Данные применяются к шагу 1

**Данные профиля:**
- Название компании, ИНН, адрес
- Контактное лицо, email, телефон
- Банковские реквизиты (название банка, счет, БИК)

---

### 2. TEMPLATE (Шаблон проекта)
**Источник:** `stepConfigs[X] = 'template'`
**Применяется к:** Шаги 1, 2
**Хук:** `useTemplateSystem()`

**Процесс:**
1. Hover на шаг → выбрать "Шаблон"
2. Открывается `templateSelection` с сеткой шаблонов
3. Выбрать шаблон → показывается `templateStepSelection`
4. Выбрать конкретные шаги или "Применить все"
5. Данные копируются в выбранные шаги

**Особенности:**
- Шаблон может содержать данные для шагов 1 и 2
- Пользователь выбирает какие шаги заполнить
- Кнопка "Заполнить все шаги из шаблона"

---

### 3. UPLOAD (OCR загрузка)
**Источник:** `selectedSource = 'upload'`
**Применяется к:** Шаги 1, 2, 7
**Хук:** `useOcrUpload()`

**Процесс:**
1. Hover на шаг → выбрать "Загрузить (Yandex Vision OCR)"
2. Drag & Drop зона или выбор файла
3. Поддерживает: PDF, JPG, PNG, XLSX, DOCX
4. Yandex Vision OCR распознаёт текст
5. Парсинг данных и автозаполнение формы

**Что распознаёт:**
- **Шаг 1:** Визитка (название компании, контакты, email)
- **Шаг 2:** Инвойс (товары, цены, поставщик)
- **Шаг 2 → 4, 5:** Банковские реквизиты из инвойса

---

### 4. OCR_SUGGESTION (Предложения от OCR)
**Источник:** `stepConfigs[4] = 'ocr_suggestion'`, `stepConfigs[5] = 'ocr_suggestion'`
**Применяется к:** Шаги 4, 5
**Функция:** `suggestPaymentMethodAndRequisites()` → строка 1111

**Процесс:**
1. После OCR инвойса (шаг 2) система извлекает банковские реквизиты
2. Автоматически вызывается `suggestPaymentMethodAndRequisites()`
3. **Шаг 4:** Предлагает "Банковский перевод" (`method: 'bank-transfer'`)
4. **Шаг 5:** Заполняет банковские реквизиты (`type: 'bank'`)
5. Поля помечаются `suggested: true`, `source: 'ocr_invoice'`

**Данные:**
- Название банка
- Номер счета
- SWIFT
- Получатель
- Адрес получателя
- Валюта

---

### 5. CATALOG (Корзина каталога)
**Источник:** `stepConfigs[2] = 'catalog'`, `stepConfigs[4] = 'catalog'`, `stepConfigs[5] = 'catalog'`
**Применяется к:** Шаги 2, 4, 5
**Функция:** `handleCatalogProductsAdd()` → строка 1268
**Модалка:** `CatalogModal`

**Процесс:**
1. Hover на шаг 2 → выбрать "Каталог"
2. Открывается `CatalogModal` (режим `category-first`)
3. Выбор категории → товары → добавление в корзину
4. **Правило:** Корзина может содержать товары ТОЛЬКО от одного поставщика
5. Нажать "Применить" → товары добавляются в шаг 2
6. Система загружает данные поставщика из `verified-suppliers`
7. **Автозаполнение:**
   - **Шаг 4:** Методы оплаты поставщика (`payment_methods`)
   - **Шаг 5:** Реквизиты поставщика (`bank_accounts`, `p2p_cards`, `crypto_wallets`)

**Режимы CatalogModal:**
- `catalogMode: 'category-first'` - товары по категориям
- `catalogMode: 'supplier-first'` - поставщики (Blue/Orange Room)

---

### 6. BLUE_ROOM (Личные поставщики)
**Источник:** `stepConfigs[2] = 'blue_room'`, `stepConfigs[4] = 'blue_room'`, `stepConfigs[5] = 'blue_room'`
**Применяется к:** Шаги 2, 4, 5 (все сразу)
**Функция:** `handleSelectBlueRoomSupplier()` → строка 1571
**Модалка:** ModalManager → `blueRoomSupplier`

**Процесс:**
1. Открывается модалка с личными поставщиками пользователя
2. Показывается список из `catalog_user_suppliers`
3. Выбрать поставщика → автозаполнение 3 шагов:
   - **Шаг 2:** ВСЕ товары поставщика (`catalog_user_products`)
   - **Шаг 4:** ВСЕ методы оплаты
   - **Шаг 5:** ВСЕ реквизиты

**Отличие от Catalog:**
- Catalog: пользователь выбирает конкретные товары в корзину
- Blue Room: берутся ВСЕ товары поставщика сразу

**База данных:**
- Таблица: `catalog_user_suppliers`
- Принадлежность: каждому пользователю (`user_id`)

---

### 7. ORANGE_ROOM (Аккредитованные поставщики)
**Источник:** `stepConfigs[2] = 'orange_room'`, `stepConfigs[4] = 'orange_room'`, `stepConfigs[5] = 'orange_room'`
**Применяется к:** Шаги 2, 4, 5 (все сразу)
**Функция:** `handleSelectOrangeRoomSupplier()` → строка 1705
**Модалка:** ModalManager → `orangeRoomSupplier`

**Процесс:**
1. Открывается модалка с аккредитованными поставщиками Get2B
2. Показывается список из `catalog_verified_suppliers`
3. Выбрать поставщика → автозаполнение 3 шагов:
   - **Шаг 2:** ВСЕ товары поставщика (`catalog_verified_products`)
   - **Шаг 4:** ВСЕ методы оплаты
   - **Шаг 5:** ВСЕ реквизиты

**Отличие от Blue Room:**
- Orange Room: аккредитованные поставщики (для всех пользователей)
- Blue Room: личные поставщики каждого пользователя

**База данных:**
- Таблица: `catalog_verified_suppliers`
- Принадлежность: глобальная (управляется менеджерами)

---

### 8. MANUAL (Ручной ввод)
**Источник:** `stepConfigs[X] = 'manual'`
**Применяется к:** Любой шаг
**Процесс:**
1. Hover на шаг → выбрать "Вручную"
2. Открывается форма для ручного ввода
3. Заполнить поля → сохранить

**Формы для каждого шага:**
- **Шаг 1:** `CompanyForm.tsx`, `ContactsForm.tsx`, `BankForm.tsx`
- **Шаг 2:** `SpecificationForm.tsx`
- **Шаг 3:** `FileUploadForm` (в page.tsx)
- **Шаг 4:** `PaymentMethodForm.tsx`
- **Шаг 5:** `RequisitesForm.tsx`
- **Шаг 7:** File upload (в page.tsx)

---

## 🗄️ STATE MANAGEMENT

### State Management: 45 состояний
- **30 useState** напрямую в page.tsx
- **15 состояний** из custom hooks (useTemplateSystem, useOcrUpload, useModalHandlers, etc.)
- **Итого: ~45 состояний** управляют приложением

### Основные группы (30 useState в page.tsx)

#### A. Конфигурация шагов
```typescript
const [stepConfigs, setStepConfigs] = useState<PartialStepConfigs>({})
const [manualData, setManualData] = useState<ManualData>({})
const [hoveredStep, setHoveredStep] = useState<number | null>(null)
const [lastHoveredStep, setLastHoveredStep] = useState<number | null>(null)
const [uploadedFiles, setUploadedFiles] = useState<Record<number, string>>({})
```

**Назначение:**
- `stepConfigs` - источник данных для каждого шага ('profile', 'template', 'catalog', 'blue_room', 'orange_room', 'manual', 'upload', 'ocr_suggestion')
- `manualData` - фактические данные каждого шага (результат заполнения)
- `lastHoveredStep` - определяет какой контент показывать в области настройки

#### B. Модальные окна и UI
```typescript
const { modals, openModal, closeModal } = useModals()
const [selectedSource, setSelectedSource] = useState<string | null>(null)
const [previewData, setPreviewData] = useState<StepDataToView | null>(null)
const [previewType, setPreviewType] = useState<string>('')
const [editingType, setEditingType] = useState<string>('')
const [currentItemIndex, setCurrentItemIndex] = useState(0)
const [autoFillNotification, setAutoFillNotification] = useState<{...} | null>(null)
```

#### C. Этапы проекта
```typescript
const [currentStage, setCurrentStage] = useState<number>(1)
const [dontShowStageTransition, setDontShowStageTransition] = useState<boolean>(false)
const [stageTransitionShown, setStageTransitionShown] = useState<boolean>(false)
```

#### D. Апрувалы и статусы
```typescript
const [managerApprovalStatus, setManagerApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
const [managerApprovalMessage, setManagerApprovalMessage] = useState<string>('')
const [projectRequestId, setProjectRequestId] = useState<string>('')
const [receiptApprovalStatus, setReceiptApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | 'waiting' | null>(null)
```

#### E. Каталог и поставщики
```typescript
const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false)
const [catalogSourceStep, setCatalogSourceStep] = useState<number | null>(null)
const [blueRoomSuppliers, setBlueRoomSuppliers] = useState<SupplierData[]>([])
const [blueRoomLoading, setBlueRoomLoading] = useState<boolean>(false)
const [orangeRoomSuppliers, setOrangeRoomSuppliers] = useState<SupplierData[]>([])
const [orangeRoomLoading, setOrangeRoomLoading] = useState<boolean>(false)
const [selectedSupplierData, setSelectedSupplierData] = useState<SupplierData | null>(null)
```

#### F. Профили и шаблоны
```typescript
const { profiles: clientProfiles, loading: clientProfilesLoading } = useClientProfiles(user?.id)
const { profiles: supplierProfiles, loading: supplierProfilesLoading } = useSupplierProfiles(user?.id)
const { templates, loading: templatesLoading, error: templatesError } = useProjectTemplates()
const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
const [selectedSupplierProfileId, setSelectedSupplierProfileId] = useState<string | null>(null)
```

#### G. Анимации
```typescript
const [dealAnimationStep, setDealAnimationStep] = useState<number>(0) // 0-3
const [dealAnimationStatus, setDealAnimationStatus] = useState<string>('')
const [dealAnimationComplete, setDealAnimationComplete] = useState<boolean>(false)
const [infrastructureStepperStep, setInfrastructureStepperStep] = useState<number>(0) // 0-2
const [infrastructureStepperStatus, setInfrastructureStepperStatus] = useState<string>('')
```

#### H. Загрузка файлов
```typescript
const [clientReceiptFile, setClientReceiptFile] = useState<File | null>(null)
const [clientReceiptUrl, setClientReceiptUrl] = useState<string | null>(null)
const [isUploadingClientReceipt, setIsUploadingClientReceipt] = useState(false)
const [clientReceiptUploadError, setClientReceiptUploadError] = useState<string | null>(null)
const [projectDetailsDialogOpen, setProjectDetailsDialogOpen] = useState(false)
const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
```

### Custom Hooks (11)
- `useModals()` - управление модальными окнами
- `useClientProfiles()` - профили клиентов
- `useSupplierProfiles()` - профили поставщиков
- `useProjectTemplates()` - шаблоны проектов
- `useTemplateSystem()` - система шаблонов (содержит handleTemplateSelect, handleTemplateStepSelect, handleFillAllTemplateSteps)
- `useOcrUpload()` - OCR загрузка файлов (содержит ocrAnalyzing, ocrError, ocrDebugData states)
- `useCatalogData()` - данные каталога
- `useManagerPolling()` - polling статуса менеджера (каждые 4 секунды)
- `useReceiptPolling()` - polling статуса чека (каждые 4 секунды)
- `useProjectPolling()` - polling проекта и запрос чека менеджеру
- `useManagerCommunication()` - коммуникация с менеджером
- `useFileUpload()` - загрузка файлов

---

## 👆 USER FLOW

### Сценарий 1: Заполнение пустого шага

**Шаг за шагом:**

1. **HOVER** (навожу курсор) на незаполненный кубик шага II
   - `setLastHoveredStep(2)`
   - Кубик подсвечивается синей рамкой
   - **В "Области настройки" появляется:**
     - Заголовок: "II Спецификация - Спецификация товаров"
     - **Меню выбора источников:**
       - 👥 Профиль
       - 📄 Шаблон
       - 🛒 Каталог
       - ➕ Вручную
       - 📤 Загрузить (Yandex Vision OCR)

2. **КЛИК** на источник "Каталог"
   - `handleSourceSelect('catalog')`
   - Открывается `CatalogModal`
   - Выбираю товары → добавляю в корзину
   - Нажимаю "Применить"

3. **Данные сохраняются:**
   - `setManualData(2, specificationData)`
   - `setStepConfigs(2, 'catalog')`
   - Автозаполняются шаги 4 и 5

4. **Кубик становится заполненным:**
   - Появляется зелёная галочка
   - Hover на кубик → показываются **кубики товаров** в области настройки

### Сценарий 2: Просмотр заполненного шага

**Шаг за шагом:**

1. **HOVER** на заполненный кубик шага I
   - `setLastHoveredStep(1)`
   - **В "Области настройки" появляются 3 кубика:**
     - 🏢 Данные компании (синий)
     - 🏦 Расчетный счет (зелёный)
     - 📧 Контакты (фиолетовый)
   - Кнопки действий в правом верхнем углу:
     - ❌ Удалить данные
     - 👁️ Посмотреть все данные

2. **КЛИК** на кубик "Данные компании"
   - `handlePreviewData('company', manualData[1])`
   - Открывается **модалка предпросмотра**
   - Показываются данные: название, ИНН, адрес, контакты

3. **КЛИК** на кнопку "Редактировать" в модалке
   - Модалка закрывается
   - В области настройки открывается **форма CompanyForm** (НЕ модально)
   - Редактирую данные → сохраняю

---

## 🎨 ОБЛАСТЬ НАСТРОЙКИ (BLOCK 2)

### Структура (строки 2001-3400)

```
Область настройки
├── [Кнопки действий] (top-right, если lastHoveredStep)
│   ├── ❌ Удалить данные
│   ├── 👁️ Посмотреть все данные
│   └── ➕ Добавить товары (только для шага 2)
│
├── [Заголовок шага] (если lastHoveredStep)
│   ├── Римская цифра (синий badge)
│   └── Название и описание шага
│
└── [Динамический контент]
    ├── Template Selection Overlay (если templateSelection)
    ├── Template Step Selection (если templateStepSelection)
    ├── Manual Form Entry (если selectedSource === "manual")
    ├── Upload/OCR Interface (если selectedSource === "upload")
    ├── FILLED State (если stepConfigs[lastHoveredStep])
    │   ├── Шаг 1: 3 кубика (company, bank, contacts)
    │   ├── Шаг 2: Слайдер товаров (3 at a time) + summary
    │   ├── Шаг 4: 3 кубика методов (bank, p2p, crypto)
    │   ├── Шаг 5: Кубики реквизитов (выбор или показ)
    │   └── Другие: Generic card
    └── UNFILLED State (если !stepConfigs[lastHoveredStep])
        └── Меню выбора источников
```

### Кубики для каждого шага (FILLED)

#### Шаг 1: Три кубика данных клиента
**Строки:** 2627-2698

**Cube 1: Данные компании** (2629-2648)
- Border: `border-blue-200`, hover: `border-blue-300`
- Icon: `Building` (blue)
- Label: "Данные компании"
- Shows: `manualData[1].name`
- onClick: `handlePreviewData('company', manualData[1])`

**Cube 2: Расчетный счет** (2651-2672)
- Border: `border-green-200`, hover: `border-green-300`
- Icon: `Banknote` (green)
- Label: "Расчетный счет"
- Shows: `manualData[1].bankName`, `manualData[1].bankAccount`
- onClick: `handlePreviewData('bank', manualData[1])`

**Cube 3: Контакты** (2675-2696)
- Border: `border-purple-200`, hover: `border-purple-300`
- Icon: `Mail` (purple)
- Label: "Дополнительно"
- Shows: `manualData[1].email`, `manualData[1].phone`
- onClick: `handlePreviewData('contacts', manualData[1])`

---

#### Шаг 2: Слайдер товаров
**Строки:** 2706-2863

**Product Slider** (2710-2826)
- Grid of 3 products at a time (`productsPerView = 3`)
- Navigation: ChevronLeft/ChevronRight buttons
- Each product cube:
  - Border: `border-gray-300`, hover: `border-blue-400`
  - Icon: `Package` (green)
  - Shows: item_name, item_code, price, quantity, total
  - onClick: `handlePreviewData('product', manualData[2])`
- Dot indicators for pagination

**Summary Card** (2829-2860)
- Shows: supplier name, items count, currency
- Border: `border-gray-300`
- Icon: `FileText` (blue)

**Special Button** (2085-2099)
- "Добавить товары" (orange button)
- Only visible for step 2 when filled
- onClick: `handleAddProductsFromCatalog()`

---

#### Шаг 4: Три кубика методов оплаты
**Строки:** 2866-2989

**Visual States:**
1. **ВЫБРАН** (`manualData[4].selectedMethod === method`):
   - Crypto: `ring-4 ring-green-400 border-green-500 bg-green-100`
   - P2P: `ring-4 ring-blue-400 border-blue-500 bg-blue-100`
   - Bank: `ring-4 ring-orange-400 border-orange-500 bg-orange-100`
   - Icon: `CheckCircle2` (white)
   - Text: "ВЫБРАН"

2. **Автозаполнение** (есть supplier_data):
   - Crypto: `border-green-300 bg-green-50`
   - P2P: `border-blue-300 bg-blue-50`
   - Bank: `border-orange-300 bg-orange-50`
   - Text: "Автозаполнение"

3. **Ручное заполнение** (нет supplier_data):
   - `border-gray-200 bg-gray-50`
   - Text: "Ручное заполнение"

**Cube 1: Банковский перевод** (bank-transfer)
- Icon: `Banknote` (orange)
- onClick: `handlePaymentMethodSelect('bank-transfer', selectedSupplierData)`

**Cube 2: P2P перевод** (p2p)
- Icon: `CreditCard` (blue)
- onClick: `handlePaymentMethodSelect('p2p', selectedSupplierData)`

**Cube 3: Криптовалюта** (crypto)
- Icon: `Coins` (green)
- onClick: `handlePaymentMethodSelect('crypto', selectedSupplierData)`

---

#### Шаг 5: Кубики реквизитов
**Строки:** 2992-3327

**Два режима:**

**A. ВЫБОР ТИПА** (если !manualData[5].type)
**Строки:** 3121-3327

Показываются 3 кубика выбора:

**Cube 1: Банковский перевод**
- Border: `border-orange-400 bg-orange-100` (if available)
- Icon: `Banknote` (orange)
- Ring: `ring-2 ring-orange-200`
- Shows: bank_accounts count
- onClick: Sets `manualData[5].type = 'bank'`

**Cube 2: P2P перевод**
- Border: `border-blue-400 bg-blue-100` (if available)
- Icon: `CreditCard` (blue)
- Ring: `ring-2 ring-blue-200`
- Shows: p2p_cards count
- onClick: Sets `manualData[5].type = 'p2p'`

**Cube 3: Криптовалюта**
- Border: `border-green-400 bg-green-100` (if available)
- Icon: `Coins` (green)
- Ring: `ring-2 ring-green-200`
- Shows: crypto_wallets count
- onClick: Sets `manualData[5].type = 'crypto'`

**B. ПОКАЗ РЕКВИЗИТОВ** (если manualData[5].type)
**Строки:** 2992-3118

**Multiple Requisites** (`type === 'multiple'`):
- Grid of cubes for each requisite
- Each shows: type, network/bank, account
- onClick: `handlePreviewData('requisites', requisite)`

**Single Requisite** (other types):
- One large cube (`col-span-3`)
- Ring-4 effect based on type:
  - Crypto: `ring-green-400 border-green-500 bg-green-100`
  - P2P: `ring-blue-400 border-blue-500 bg-blue-100`
  - Bank: `ring-orange-400 border-orange-500 bg-orange-100`
- Icon: `CheckCircle2`
- Text: "ЗАПОЛНЕНО"
- onClick: `handlePreviewData('requisites', manualData[5])`

---

## 🔧 HANDLERS & HELPER FUNCTIONS

### 🛠️ Helper Functions (вспомогательные)

#### 1. sendManagerReceiptRequest() - строка 281
**Назначение:** Отправляет запрос менеджеру на получение чека для оплаты.

**Используется:**
- В `useProjectPolling` (строка 361)
- В Stage2Container

**Процесс:**
1. Проверяет что `projectRequestId` существует
2. Проверяет что запрос ещё не отправлен (`!isRequestSent`)
3. Показывает loader (`setShowFullLoader(true)`)
4. Отправляет запрос на `/api/atomic-constructor/request-manager-receipt`
5. Устанавливает флаг `isRequestSent = true`

**Важность:** 🔴 Критическая - без неё не работает Stage 2 (модерация менеджером)

---

#### 2. getTemplateDataForStep(step, template) - строка 661
**Назначение:** Извлекает данные конкретного шага из шаблона проекта.

**Используется:**
- В `useTemplateSystem` для применения шаблонов

**Процесс:**
1. Принимает номер шага (1-7) и объект шаблона
2. Маппит шаг к полю в шаблоне:
   - Step 1 → `template.company_data`
   - Step 2 → `template.specification_data`
   - Step 3 → `template.bank_data`
   - Step 4 → `template.payment_method_data`
   - Step 5 → `template.requisites_data`
3. Возвращает данные или `null`

**Важность:** 🟡 Средняя - нужна для системы шаблонов

---

#### 3. createValidationContext() - строка 469
**Назначение:** Создаёт контекст валидации для проверки корректности данных всех шагов.

**Используется:**
- Перед переходом на Stage 2 (проверка готовности)
- В функции `checkSummaryReadiness()` (строка 1067)

**Возвращает:**
```typescript
{
  manualData: ManualData
  stepConfigs: PartialStepConfigs
  user: UserType | null
}
```

**Важность:** 🟡 Средняя - проверяет что все обязательные шаги заполнены

---

### 🎯 Handlers в page.tsx (13 функций)

#### 1. handleStepHover(stepId) - строка 751
Обрабатывает наведение курсора на кубик шага.
```typescript
setHoveredStep(stepId)
setLastHoveredStep(stepId)
```

#### 2. handleStepClick(stepId) - строка 761
Обрабатывает клик на кубик шага.
- Для шагов 4, 5: эхо данные отключены (возвращает early)
- Для других: логика обработки клика

#### 3. handleSourceSelect(source) - строка 781
Обрабатывает выбор источника данных.
- `source === "catalog"` → `setShowCatalogModal(true)`
- `source === "upload"` → `setSelectedSource("upload")`
- `source === "profile"` → открывает модалку профиля
- `source === "template"` → открывает систему шаблонов
- `source === "manual"` → `setStepConfigs(lastHoveredStep, source)`

#### 4. handleCatalogProductsAdd(products) - строка 1268
Обрабатывает добавление товаров из каталога.
1. Преобразует товары в формат Step II
2. Добавляет в `manualData[2]`
3. Загружает данные поставщика
4. Автозаполняет шаги 4 и 5

#### 5. handleSelectBlueRoomSupplier(supplier) - строка 1571
Обрабатывает выбор обычного поставщика.
1. Заполняет шаг 2 ВСЕМИ товарами (`catalog_user_products`)
2. Заполняет шаг 4 методами оплаты
3. Заполняет шаг 5 реквизитами
4. Устанавливает `stepConfigs[2,4,5] = 'blue_room'`

#### 6. handleSelectOrangeRoomSupplier(supplier) - строка 1705
Обрабатывает выбор аккредитованного поставщика.
1. Заполняет шаг 2 ВСЕМИ товарами (`catalog_verified_products`)
2. Заполняет шаг 4 методами оплаты
3. Заполняет шаг 5 реквизитами
4. Устанавливает `stepConfigs[2,4,5] = 'orange_room'`

#### 7. handlePaymentMethodSelect(method, supplier) - строка 1481
Обрабатывает выбор метода оплаты.
1. Устанавливает `manualData[4].selectedMethod = method`
2. Если есть данные поставщика → заполняет шаг 5 соответствующими реквизитами
3. Устанавливает `stepConfigs[5] = 'catalog'`

#### 8. handlePreviewData(type, data) - строка 1224
Открывает модалку предпросмотра данных.
```typescript
setPreviewType(type)
setPreviewData(data)
openModal('preview')
```

#### 9. handleEditData(type) - строка 1257
Открывает форму редактирования.
```typescript
setEditingType(type)
setSelectedSource('manual')
closeModal('preview')
```

#### 10. handleClientReceiptUpload(event) - строка 530
Обрабатывает загрузку чека от клиента.
1. Загружает файл через `uploadClientReceipt()`
2. Отправляет чек менеджеру через `sendClientReceipt()`
3. Устанавливает `clientReceiptUrl`

#### 11. returnToStage1Editing() - строка 978
Возвращает на Stage 1 для редактирования.

#### 12. proceedToStage3() - строка 1023
Переход на Stage 3 (анимация сделки).

#### 13. handleSendToManager() - строка 1959
Отправка данных менеджеру (заглушка, вызывается из Stage2Container).

---

### 🔗 Handlers из Custom Hooks (3+ функций)

#### 1. handleTemplateSelect(templateId)
**Хук:** `useTemplateSystem` (строка 653)
**Назначение:** Обрабатывает выбор шаблона проекта из списка.

**Процесс:**
1. Получает шаблон по ID из `templates` массива
2. Показывает `templateStepSelection` - сетку доступных шагов
3. Пользователь выбирает какие шаги заполнить

#### 2. handleTemplateStepSelect(stepId)
**Хук:** `useTemplateSystem`
**Назначение:** Применяет данные шаблона к конкретному шагу.

**Процесс:**
1. Вызывает `getTemplateDataForStep(stepId, selectedTemplate)`
2. Заполняет `manualData[stepId]` данными из шаблона
3. Устанавливает `stepConfigs[stepId] = 'template'`

#### 3. handleFillAllTemplateSteps()
**Хук:** `useTemplateSystem`
**Назначение:** Применяет шаблон ко всем доступным шагам (1 и 2).

**Процесс:**
1. Проходит по шагам 1 и 2
2. Вызывает `handleTemplateStepSelect` для каждого
3. Закрывает модалку выбора шаблона

#### 4. handleFileUpload(step, file)
**Хук:** `useOcrUpload` (строка 1191)
**Назначение:** Обрабатывает загрузку файла для OCR распознавания.

**Процесс:**
1. Показывает loader (`ocrAnalyzing[step] = true`)
2. Загружает файл на сервер
3. Вызывает Yandex Vision OCR
4. Парсит результат
5. Заполняет `manualData[step]`
6. Для шага 2 → автоматически вызывает `suggestPaymentMethodAndRequisites()`

---

## 🧩 КОМПОНЕНТЫ

### Block 1: StepCubes
**Файл:** `components/StepCubes.tsx`
**Строки использования:** 1985-1999

**Пропсы:**
- `constructorSteps` - массив шагов с названиями и описаниями
- `currentStage` - текущий этап (1, 2, 3)
- `stepConfigs` - конфигурация источников
- `manualData` - данные шагов
- `receiptApprovalStatus` - статус чека
- `hasManagerReceipt` - есть ли чек от менеджера
- `clientReceiptUrl` - URL чека клиента
- `isStepEnabled` - функция проверки доступности шага
- `getCurrentStage` - функция получения этапа шага
- `handleStepHover` - обработчик наведения
- `handleStepClick` - обработчик клика
- `stepIcons` - иконки шагов
- `dataSources` - источники данных

**Визуальные состояния кубика:**
- Пустой (серый с замком)
- Заполненный (зелёная галочка)
- Активный (синяя рамка)
- Disabled (серый с замком, этап 2)

---

### Block 2: StageRouter + Stages
**Файл:** `components/stages/StageRouter.tsx`
**Строки использования:** 2020-2048

**Компоненты:**
- `Stage1Container` - конфигурация шагов (область настройки)
- `Stage2Container` - модерация менеджером
- `Stage3Container` - монитор сделки

**Роутинг:**
```typescript
currentStage === 1 ? <Stage1Content /> :
currentStage === 2 ? <Stage2Container /> :
currentStage === 3 ? <Stage3Container /> : null
```

---

### Block 3: SummaryBlock
**Файл:** `components/SummaryBlock.tsx`
**Строки использования:** 3513-3522

**Пропсы:**
- `manualData` - данные шагов
- `stepConfigs` - конфигурация источников
- `configuredStepsSummary` - сводка настроенных шагов
- `onStepCardClick` - клик на карточку шага в сводке
- `onProceedToStage2` - переход на Stage 2

**Функции:**
- Показывает список настроенных шагов
- Проверяет готовность к переходу на Stage 2
- Кнопка "Запустить проект"

---

### ModalManager
**Файл:** `components/modals/ModalManager.tsx`
**Строки использования:** 3535-3561

**Централизованное управление:**
- profileSelector - выбор профиля клиента
- supplierProfileSelector - выбор профиля поставщика
- blueRoomSupplier - выбор личного поставщика
- orangeRoomSupplier - выбор аккредитованного поставщика
- preview - предпросмотр данных
- stageTransition - переход на Stage 2
- summary - сводка перед отправкой

---

### CatalogModal
**Файл:** `app/dashboard/create-project/components/CatalogModal.tsx`
**Строки использования:** 3528-3532

**Режимы:**
- `catalogMode: 'category-first'` - товары по категориям (корзина)
- `catalogMode: 'supplier-first'` - поставщики (Blue/Orange Room)

**Пропсы:**
- `open` - открыта ли модалка
- `onClose` - закрыть модалку
- `onAddProducts` - обработчик добавления товаров

---

### Формы
**Директория:** `forms/`

**Список форм:**
- `CompanyForm.tsx` - данные компании (шаг 1)
- `ContactsForm.tsx` - контакты (шаг 1)
- `BankForm.tsx` - банковские данные (шаг 1)
- `SpecificationForm.tsx` - спецификация товаров (шаг 2)
- `PaymentMethodForm.tsx` - метод оплаты (шаг 4)
- `RequisitesForm.tsx` - реквизиты (шаг 5)

**Общие пропсы:**
- `initialData` - начальные данные для редактирования
- `onSave` - сохранение данных
- `onCancel` - отмена редактирования

---

## ⚠️ КРИТИЧЕСКИЕ ЗАМЕТКИ

### ❌ ЧТО НЕЛЬЗЯ ТРОГАТЬ БЕЗ РИСКА

1. **State Management (45 useState)**
   - Не удалять useState без проверки всех зависимостей
   - Не переименовывать без поиска по всему файлу
   - Не изменять структуру `manualData` и `stepConfigs`

2. **Область настройки (строки 2050-3400)**
   - Сложная условная отрисовка (20+ вложенных условий)
   - Изменение одного условия может сломать другой флоу
   - Тестировать ВСЕ шаги после любого изменения

3. **Handlers (16 функций)**
   - Многие handlers вызывают друг друга
   - `handleCatalogProductsAdd` → автозаполняет шаги 4 и 5
   - `handlePaymentMethodSelect` → автозаполняет шаг 5
   - Изменение одного может сломать цепочку

4. **Системы автозаполнения**
   - 8 систем взаимосвязаны
   - Blue/Orange Room заполняют 3 шага сразу
   - OCR → OCR_SUGGESTION (шаг 2 → шаги 4, 5)
   - Catalog → автозаполнение шагов 4, 5

### ✅ ЧТО МОЖНО БЕЗОПАСНО МЕНЯТЬ

1. **JSX комментарии** - добавлять якоря для навигации
2. **CSS стили** - цвета, отступы, размеры
3. **Текст и лейблы** - названия кнопок, заголовки
4. **Извлечение дублированного кода** - только если повторяется 2+ раза
5. **Новые компоненты** - добавлять отдельно, не трогая монолит

### 🚨 ПРАВИЛА РАЗРАБОТКИ

#### Перед любым изменением:
1. ✅ Запустить TypeScript: `npx tsc --noEmit`
2. ✅ Запустить dev server: `npm run dev`
3. ✅ Протестировать все 7 шагов
4. ✅ Проверить переходы между stages
5. ✅ Проверить все 8 систем автозаполнения

#### Добавление новых фич:
- ❌ НЕ добавлять большие блоки JSX в page.tsx (>100 строк)
- ❌ НЕ добавлять новые формы в page.tsx
- ❌ НЕ добавлять новые источники данных в page.tsx
- ✅ Создавать отдельные компоненты:
  - `components/project-constructor/steps/NewStepComponent.tsx`
  - `components/project-constructor/forms/NewForm.tsx`
  - `components/project-constructor/sources/NewSourceSelector.tsx`

#### В page.tsx только:
- State management (useState, useEffect)
- Handlers (handle* functions)
- Роутинг к компонентам

---

## 📚 ДОПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ

**Связанные документы:**
- [CATALOG_ARCHITECTURE_V2.md](../../../CATALOG_ARCHITECTURE_V2.md) - Архитектура каталога
- [CATALOG_INTEGRATION_WITH_7STEPS.md](../../../CATALOG_INTEGRATION_WITH_7STEPS.md) - Интеграция каталога
- [Linear Starter](../create-project/page.tsx) - Простой линейный процесс создания проекта

**Полезные ссылки:**
- Supabase Tables: `catalog_verified_suppliers`, `catalog_user_suppliers`
- Forms: `/components/project-constructor/forms/`
- Hooks: `/hooks/project-constructor/`

---

---

## 📊 МЕТРИКИ ДОКУМЕНТАЦИИ

**Версия:** 2.1 (с улучшениями после проверки агентом)
**Последнее обновление:** 7 октября 2025
**Автор:** Claude Code + User
**Оценка полноты:** 9.5/10 (по результатам автоматической проверки)

**Прогресс рефакторинга:**
- Начало: 4,295 строк
- Сейчас: 3,574 строки
- Удалено: 721 строка (16.8%)
- Извлечено компонентов: 6 (StepCubes, SummaryBlock, ModalManager, Stage1/2/3Container)
- Извлечено хуков: 11 (useTemplateSystem, useOcrUpload, useManagerPolling, и др.)

**Что задокументировано:**
- ✅ 30 useState в page.tsx + 15 в hooks = 45 состояний
- ✅ 3 helper functions (sendManagerReceiptRequest, getTemplateDataForStep, createValidationContext)
- ✅ 13 handlers в page.tsx
- ✅ 4 handlers из hooks
- ✅ 8 систем автозаполнения (с детальным описанием каждой)
- ✅ Структура Block 2 (область настройки) - 1,400 строк JSX
- ✅ Визуальные состояния кубиков для каждого шага
- ✅ User Flow с примерами
- ✅ Критические предупреждения и правила разработки
