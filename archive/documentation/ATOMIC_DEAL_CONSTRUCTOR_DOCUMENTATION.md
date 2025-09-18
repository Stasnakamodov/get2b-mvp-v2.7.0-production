# 🚀 КОНСТРУКТОР АТОМАРНЫХ СДЕЛОК - ПОЛНАЯ ДОКУМЕНТАЦИЯ

**Дата создания:** 12 января 2025  
**Статус:** 🟡 В разработке  
**Файл:** `app/dashboard/project-constructor/page.tsx`

---

## 🎯 **ОБЩАЯ КОНЦЕПЦИЯ**

### **Что такое "Атомарная сделка"?**
Конструктор атомарных сделок - это **упрощенная версия классического 7-шагового процесса**, которая позволяет пользователям быстро создавать проекты с минимальными усилиями, используя готовые данные и файлы.

### **Ключевые отличия от классического процесса:**
- ✅ **Быстрота** - все шаги в одном интерфейсе
- ✅ **Гибкость** - выбор источников данных для каждого шага
- ✅ **Автоматизация** - использование готовых профилей, шаблонов, каталога
- ✅ **Файловая интеграция** - загрузка готовых файлов для каждого шага

---

## 🏗️ **АРХИТЕКТУРА ИНТЕРФЕЙСА**

### **Block 1: 7 кубиков-шагов**
```
[I] [II] [III] [IV] [V] [VI] [VII]
Карт Заяв Попол Метод Рекв Получ Подтв
```

**Логика активации по сценариям:**
- **Сценарий А1:** I, II → IV, V → III, VI, VII
- **Сценарий Б1:** II → IV, V (автозаполнение) → I → III, VI, VII  
- **Сценарий Б2:** IV, V → II → I → III, VI, VII

### **Block 2: Интерактивная зона выбора**
- **Наведение** на кубик → показ доступных источников
- **Выбор источника** → отображение формы или данных
- **Запоминание** последнего выбранного кубика

### **Block 3: Сводка и запуск**
- Прогресс-бар с мини-кубиками
- Сводка настроенных шагов
- Кнопка запуска проекта

---

## 📊 **СТРУКТУРА ДАННЫХ**

### **1. Шаги конструктора**
```typescript
const constructorSteps = [
  { id: 1, name: "Карточка", description: "Данные компании", sources: ["profile", "template", "echo", "manual"] },
  { id: 2, name: "Заявка", description: "Спецификация товаров", sources: ["profile", "template", "catalog", "echo", "manual"] },
  { id: 3, name: "Пополнение", description: "Загрузка чека", sources: ["manual"] },
  { id: 4, name: "Метод", description: "Способ оплаты", sources: ["catalog", "manual"] },
  { id: 5, name: "Реквизиты", description: "Банковские реквизиты", sources: ["catalog", "manual"] },
  { id: 6, name: "Получение", description: "Получение средств", sources: ["automatic"] },
  { id: 7, name: "Подтверждение", description: "Завершение", sources: ["automatic"] }
]
```

### **2. Источники данных**
```typescript
const dataSources = {
  profile: { name: "Профиль", icon: Users, color: "bg-blue-500" },
  template: { name: "Шаблон", icon: FileText, color: "bg-green-500" },
  catalog: { name: "Каталог", icon: Store, color: "bg-purple-500" },
  echo: { name: "Эхо данные", icon: FileText, color: "bg-orange-500" },
  manual: { name: "Вручную", icon: Plus, color: "bg-gray-500" },
  automatic: { name: "Автоматически", icon: CheckCircle, color: "bg-emerald-500" }
}
```

**Примечание:** Источник "Эхо данные" отличается от "Эхо карточек" в каталоге. Эхо данные в конструкторе - это рекомендации для автозаполнения шагов 4 и 5 на основе данных из завершенных проектов.

### **3. Состояние приложения**
```typescript
interface AtomicDealState {
  stepConfigs: Record<number, string>; // { 1: "profile", 2: "manual", ... }
  hoveredStep: number | null;
  lastHoveredStep: number | null;
  manualData: Record<number, any>; // Данные ручного заполнения
  uploadedFiles: Record<number, string>; // URL загруженных файлов
}
```

---

## 🎭 **ДЕКЛАРАЦИЯ СИСТЕМЫ СЦЕНАРИЕВ**

### **Общая концепция сценариев:**
Конструктор атомарных сделок поддерживает **множественные сценарии заполнения**, которые определяют логику автоматизации и рекомендаций системы. Каждый сценарий имеет свою точку входа и последовательность заполнения шагов.

### **Классификация сценариев:**

#### **Сценарий А: Клиент-покупатель (Client-Buyer)**
**Роль пользователя:** Клиент, который ищет поставщиков для закупки товаров

**Сценарий А1: Начинаем с данных клиента**
```typescript
interface ScenarioA1 {
  entryPoint: "step1", // Кубик I - данные компании клиента
  sequence: [
    "step1", // Данные компании клиента
    "step2", // Спецификация товаров (выбор из каталога поставщиков)
    "step4", // Способ оплаты клиента
    "step5", // Реквизиты клиента
    "step3", // Загрузка чека пополнения
    "step6", // Получение средств
    "step7"  // Подтверждение сделки
  ],
  logic: "client_buyer_seeking_suppliers"
}
```

**Логика автоматизации А1:**
- **Шаг I → Шаг II:** Предложить выбор товаров из каталога поставщиков
- **Шаг I → Шаг IV/V:** Предложить данные клиента из профиля
- **Рекомендации:** "Выберите поставщиков для закупки товаров"

#### **Сценарий Б: Поставщик-продавец (Supplier-Seller)**
**Роль пользователя:** Поставщик, который предлагает свои товары и услуги

**Сценарий Б1: Начинаем с товаров поставщика**
```typescript
interface ScenarioB1 {
  entryPoint: "step2", // Кубик II - спецификация товаров
  sequence: [
    "step2", // Спецификация товаров (из синей комнаты)
    "step4", // Способ оплаты поставщика (автозаполнение)
    "step5", // Реквизиты поставщика (автозаполнение)
    "step1", // Данные клиента (если нужно)
    "step3", // Загрузка чека
    "step6", // Получение средств
    "step7"  // Подтверждение сделки
  ],
  logic: "supplier_offering_products"
}
```

**Логика автоматизации Б1:**
- **Шаг II → Шаг IV/V:** Автоматически заполнить данными поставщика из синей комнаты
- **Шаг II → Шаг I:** Предложить заполнить данные клиента
- **Рекомендации:** "Используйте данные поставщика для оплаты и реквизитов"

**Сценарий Б2: Начинаем с реквизитов поставщика**
```typescript
interface ScenarioB2 {
  entryPoint: "step4|step5", // Кубики IV или V - реквизиты поставщика
  sequence: [
    "step4", // Способ оплаты поставщика
    "step5", // Реквизиты поставщика
    "step2", // Спецификация товаров (предложить товары этого поставщика)
    "step1", // Данные клиента
    "step3", // Загрузка чека
    "step6", // Получение средств
    "step7"  // Подтверждение сделки
  ],
  logic: "supplier_setting_payment_first"
}
```

**Логика автоматизации Б2:**
- **Шаг IV/V → Шаг II:** Предложить товары этого поставщика из синей комнаты
- **Шаг IV/V → Шаг I:** Предложить заполнить данные клиента
- **Рекомендации:** "Заполните товары поставщика или загрузите спецификацию"

### **Система рекомендаций по сценариям:**

#### **Определение активного сценария:**
```typescript
const determineActiveScenario = (stepConfigs: Record<number, string>, manualData: Record<number, any>) => {
  // Проверяем точку входа
  if (stepConfigs[1] && !stepConfigs[2]) {
    return "A1"; // Начали с данных клиента
  }
  
  if (stepConfigs[2] && !stepConfigs[1]) {
    return "B1"; // Начали с товаров поставщика
  }
  
  if ((stepConfigs[4] || stepConfigs[5]) && !stepConfigs[1] && !stepConfigs[2]) {
    return "B2"; // Начали с реквизитов поставщика
  }
  
  return "mixed"; // Смешанный сценарий
}
```

#### **Генерация рекомендаций:**
```typescript
const generateRecommendations = (scenario: string, currentStep: number) => {
  switch (scenario) {
    case "A1":
      return getClientBuyerRecommendations(currentStep);
    case "B1":
      return getSupplierOfferingRecommendations(currentStep);
    case "B2":
      return getSupplierPaymentFirstRecommendations(currentStep);
    default:
      return getMixedScenarioRecommendations(currentStep);
  }
}
```

#### **Примеры рекомендаций:**

**Для сценария А1 (Клиент-покупатель):**
- **После шага I:** "Выберите товары для закупки из каталога поставщиков"
- **После шага II:** "Укажите способ оплаты и реквизиты для расчетов"
- **После шага IV/V:** "Переходим к подготовке инфраструктуры"

**Для сценария Б1 (Поставщик-товары):**
- **После шага II:** "Данные поставщика автоматически применены к способу оплаты и реквизитам"
- **После шага IV/V:** "Переходим к подготовке инфраструктуры"

**Для сценария Б2 (Поставщик-реквизиты):**
- **После шага IV/V:** "Выберите товары этого поставщика или загрузите спецификацию"
- **После шага II:** "Переходим к подготовке инфраструктуры"

### **Логика активации шагов по сценариям:**

#### **Этапная активация:**
```typescript
const getStepActivationLogic = (scenario: string) => {
  switch (scenario) {
    case "A1":
      return {
        stage1: [1, 2, 4, 5], // Этап 1: Подготовка данных (все основные шаги)
        stage2: [3, 6, 7]     // Этап 2: Подготовка инфраструктуры
      };
    case "B1":
    case "B2":
      return {
        stage1: [1, 2, 4, 5], // Этап 1: Подготовка данных (все основные шаги)
        stage2: [3, 6, 7]     // Этап 2: Подготовка инфраструктуры
      };
  }
}
```

### **Примеры использования системы рекомендаций:**

#### **Пример 1: Сценарий А1 (Клиент-покупатель)**
```typescript
// Пользователь заполнил шаг I (данные клиента)
const scenario = "A1";
const currentStep = 1;

// Система генерирует рекомендации
const recommendations = generateRecommendations(scenario, currentStep);
// Результат: "Выберите товары для закупки из каталога поставщиков"

// Пользователь переходит к шагу II
const nextStep = 2;
const nextRecommendations = generateRecommendations(scenario, nextStep);
// Результат: "Укажите способ оплаты и реквизиты для расчетов"
```

#### **Пример 2: Сценарий Б1 (Поставщик-товары)**
```typescript
// Пользователь выбрал товары из синей комнаты (шаг II)
const scenario = "B1";
const currentStep = 2;

// Система автоматически заполняет шаги IV и V
const autoFillResult = autoFillSupplierData(manualData[2].supplier_id);
// Результат: Шаги IV и V заполнены данными поставщика

// Система генерирует рекомендации
const recommendations = generateRecommendations(scenario, currentStep);
// Результат: "Данные поставщика автоматически применены к способу оплаты и реквизитам"
```

#### **Пример 3: Сценарий Б2 (Поставщик-реквизиты)**
```typescript
// Пользователь заполнил шаги IV и V (реквизиты поставщика)
const scenario = "B2";
const currentStep = 5;

// Система проверяет наличие товаров у этого поставщика
const supplierProducts = checkSupplierProducts(manualData[5].supplier_id);
if (supplierProducts.length > 0) {
  // Предлагает автоматически заполнить товарами
  const recommendations = "Выберите товары этого поставщика из каталога";
} else {
  // Предлагает ручное заполнение
  const recommendations = "Заполните спецификацию товаров вручную или загрузите файл";
}
```

### **Интеграция с UI:**

#### **Отображение рекомендаций в Block 2:**
```typescript
const RecommendationBanner = ({ scenario, currentStep }) => {
  const recommendation = generateRecommendations(scenario, currentStep);
  
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-center">
        <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
        <p className="text-blue-700 font-medium">{recommendation}</p>
      </div>
    </div>
  );
};
```

#### **Автоматическое заполнение с уведомлением:**
```typescript
const AutoFillNotification = ({ filledSteps, supplierName }) => {
  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        <p className="text-green-700">
          Данные поставщика "{supplierName}" автоматически применены к шагам: {filledSteps.join(', ')}
        </p>
      </div>
    </div>
  );
};
```

---

## 🔄 **ИНТЕГРАЦИЯ С 7-ШАГОВЫМ ПРОЦЕССОМ**

### **Маппинг на классические таблицы:**

#### **Шаг I (Карточка) → projects.company_data**
```typescript
// Данные компании
{
  name: string,
  legalName: string,
  inn: string,
  kpp: string,
  ogrn: string,
  address: string,
  bankName: string,
  bankAccount: string,
  email: string,
  phone: string
}
```

#### **Шаг II (Заявка) → project_specifications**
```typescript
// Спецификация товаров
{
  project_id: string,
  role: 'client' | 'supplier',
  items: Array<{
    name: string,
    description: string,
    quantity: number,
    price: number,
    currency: string,
    image_url?: string
  }>
}
```

#### **Шаг III (Пополнение) → project_receipts**
```typescript
// Чеки клиентов
{
  project_id: string,
  file_url: string,
  status: 'pending' | 'approved' | 'rejected',
  uploaded_at: string
}
```

#### **Шаг IV (Метод) → projects.payment_method**
```typescript
// Способ оплаты
'bank-transfer' | 'p2p' | 'crypto'
```

#### **Шаг V (Реквизиты) → project_requisites**
```typescript
// Банковские реквизиты
{
  project_id: string,
  user_id: string,
  type: 'bank' | 'p2p' | 'crypto',
  data: {
    bankName: string,
    accountNumber: string,
    swift?: string,
    // ... другие поля
  }
}
```

---

## 📁 **СИСТЕМА ЗАГРУЗКИ ФАЙЛОВ**

### **Структура Storage бакетов:**
```
Supabase Storage:
├── step-a1-ready-company/     # Карточки компаний
├── step2-ready-invoices/      # Инвойсы
├── step3-supplier-receipts/   # Чеки поставщиков
├── step6-client-receipts/     # Чеки от менеджеров
├── step7-client-confirmations/ # Подтверждения клиентов
├── project-files/             # Общие файлы проектов
└── project-images/            # Изображения товаров
```

### **Логика загрузки файлов:**

#### **Шаг I: Карточка компании**
```typescript
// Загрузка готовой карточки компании
const handleCompanyCardUpload = async (file: File) => {
  const fileName = `company_cards/${userId}/${Date.now()}_${file.name}`;
  const { data } = await supabase.storage
    .from('step-a1-ready-company')
    .upload(fileName, file);
  
  // Автоматическое извлечение данных из файла
  const extractedData = await extractCompanyData(file);
  setManualData(1, extractedData);
}
```

#### **Шаг II: Спецификация товаров**
```typescript
// Загрузка готовой спецификации
const handleSpecificationUpload = async (file: File) => {
  const fileName = `specifications/${projectId}/${Date.now()}_${file.name}`;
  const { data } = await supabase.storage
    .from('project-files')
    .upload(fileName, file);
  
  // Парсинг Excel/CSV файла
  const items = await parseSpecificationFile(file);
  setManualData(2, { items });
}
```

#### **Шаг III: Чек пополнения**
```typescript
// Загрузка чека
const handleReceiptUpload = async (file: File) => {
  const fileName = `receipts/${projectId}/${Date.now()}_${file.name}`;
  const { data } = await supabase.storage
    .from('step3-supplier-receipts')
    .upload(fileName, file);
  
  setUploadedFiles(3, data.publicUrl);
}
```

---

## 🎨 **ФОРМЫ РУЧНОГО ЗАПОЛНЕНИЯ**

### **Шаг I: Форма данных компании**
```tsx
const CompanyForm = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Название компании *</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>ИНН *</Label>
        <Input name="inn" required />
      </div>
    </div>
    <div>
      <Label>Юридический адрес</Label>
      <Textarea name="address" rows={3} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" />
      </div>
      <div>
        <Label>Телефон</Label>
        <Input name="phone" />
      </div>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleFileUpload}>
        <Upload className="h-4 w-4 mr-2" />
        Загрузить карточку
      </Button>
      <Button onClick={handleSave}>Сохранить</Button>
    </div>
  </div>
)
```

### **Шаг II: Форма спецификации**
```tsx
const SpecificationForm = () => (
  <div className="space-y-4">
    <div>
      <Label>Поставщик *</Label>
      <Input name="supplier" required />
    </div>
    <div>
      <Label>Валюта</Label>
      <Select name="currency">
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="RUB">RUB</option>
      </Select>
    </div>
    <ProductList />
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleFileUpload}>
        <Upload className="h-4 w-4 mr-2" />
        Загрузить спецификацию
      </Button>
      <Button onClick={handleSave}>Сохранить</Button>
    </div>
  </div>
)
```

### **Шаг IV: Форма метода оплаты**
```tsx
const PaymentMethodForm = () => (
  <div className="space-y-4">
    <div>
      <Label>Способ оплаты *</Label>
      <Select name="paymentMethod" required>
        <option value="bank-transfer">Банковский перевод</option>
        <option value="p2p">P2P платеж</option>
        <option value="crypto">Криптовалюта</option>
      </Select>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleCatalogSelect}>
        <Store className="h-4 w-4 mr-2" />
        Выбрать из каталога
      </Button>
      <Button onClick={handleSave}>Сохранить</Button>
    </div>
  </div>
)
```

### **Шаг V: Форма реквизитов**
```tsx
const RequisitesForm = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Название банка *</Label>
        <Input name="bankName" required />
      </div>
      <div>
        <Label>Номер счета *</Label>
        <Input name="accountNumber" required />
      </div>
    </div>
    <div>
      <Label>SWIFT/BIC код</Label>
      <Input name="swift" />
    </div>
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleCatalogSelect}>
        <Store className="h-4 w-4 mr-2" />
        Выбрать из каталога
      </Button>
      <Button onClick={handleSave}>Сохранить</Button>
    </div>
  </div>
)
```

---

## 🎭 **СИСТЕМА ЭХО ДАННЫХ В КОНСТРУКТОРЕ**

### **🎯 Концепция:**
Эхо данные в конструкторе проектов = **рекомендации для автозаполнения шагов 4 и 5** на основе данных из завершенных проектов пользователя.

### **📍 Применение:**
- **Шаг IV (Метод оплаты):** Автозаполнение способа оплаты поставщика
- **Шаг V (Реквизиты):** Автозаполнение банковских реквизитов поставщика

### **🔄 Логика работы:**
1. **Пользователь** заполняет шаг 2 (спецификация) с названием поставщика
2. **Система** автоматически ищет эхо данные для этого поставщика
3. **При клике** на шаги 4 или 5 показывается модальное окно с рекомендациями
4. **Пользователь** может применить или отклонить эхо данные
5. **Данные** автоматически заполняют соответствующие шаги

### **🔧 Техническая реализация:**
```typescript
// Функция получения эхо данных для конструктора
const getEchoSupplierData = async (supplierName: string) => {
  // 1. Ищем проекты с этим поставщиком
  const { data: specifications } = await supabase
    .from("project_specifications")
    .select(`project_id, supplier_name`)
    .ilike("supplier_name", `%${supplierName}%`);
  
  // 2. Получаем реквизиты и способ оплаты
  const { data: requisites } = await supabase
    .from("project_requisites")
    .select(`type, data`)
    .in("project_id", projectIds);
  
  // 3. Формируем рекомендации
  return {
    payment_method: { method: 'bank-transfer', supplier_id: '...' },
    requisites: { bankName: '...', accountNumber: '...', swift: '...' },
    project_info: { project_name: '...', status: '...' }
  };
};
```

### **📋 Структура эхо данных:**
```typescript
interface EchoData {
  // Шаг IV: Способ оплаты
  payment_method: {
    method: 'bank-transfer' | 'p2p' | 'crypto';
    supplier_id: string;
  };
  
  // Шаг V: Реквизиты
  requisites: {
    type: 'bank' | 'p2p' | 'crypto';
    bankName?: string;
    accountNumber?: string;
    swift?: string;
    card_number?: string;
    card_holder?: string;
    crypto_network?: string;
    crypto_address?: string;
  };
  
  // Информация о проекте-источнике
  project_info: {
    project_name: string;
    project_date: string;
    amount: number;
    currency: string;
    status: string;
  };
}
```

### **🎯 Отличия от эхо карточек:**
| Аспект | 🎭 Эхо Данные (Конструктор) | 🔮 Эхо Карточки (Каталог) |
|--------|----------------------------|---------------------------|
| **Назначение** | Автозаполнение шагов 4-5 | Импорт поставщиков в каталог |
| **Место** | Конструктор проектов | Каталог поставщиков |
| **Триггер** | Автоматический поиск | Ручной клик |
| **Результат** | Заполненные шаги | Поставщик в каталоге |
| **Данные** | Только реквизиты | Полная карточка поставщика |

---

## 🔧 **ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ**

### **1. Основные хуки**
```typescript
// Управление состоянием конструктора
const useAtomicDealConstructor = () => {
  const [stepConfigs, setStepConfigs] = useState<Record<number, string>>({});
  const [manualData, setManualData] = useState<Record<number, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string>>({});
  
  const handleSourceSelect = (stepId: number, source: string) => {
    setStepConfigs(prev => ({ ...prev, [stepId]: source }));
  };
  
  const handleManualDataSave = (stepId: number, data: any) => {
    setManualData(prev => ({ ...prev, [stepId]: data }));
  };
  
  const handleFileUpload = async (stepId: number, file: File) => {
    const url = await uploadFileToStorage(stepId, file);
    setUploadedFiles(prev => ({ ...prev, [stepId]: url }));
  };
  
  return {
    stepConfigs,
    manualData,
    uploadedFiles,
    handleSourceSelect,
    handleManualDataSave,
    handleFileUpload
  };
};
```

### **2. Интеграция с Supabase**
```typescript
// Создание проекта из атомарной сделки
const createProjectFromAtomicDeal = async (atomicDealData: any) => {
  // 1. Создаем проект
  const { data: project } = await supabase
    .from('projects')
    .insert([{
      user_id: userId,
      name: atomicDealData.projectName,
      status: 'draft',
      current_step: 1,
      company_data: atomicDealData.step1Data,
      payment_method: atomicDealData.step4Data?.method
    }])
    .select('id')
    .single();
  
  // 2. Создаем спецификацию
  if (atomicDealData.step2Data?.items) {
    await supabase
      .from('project_specifications')
      .insert([{
        project_id: project.id,
        role: 'client',
        items: atomicDealData.step2Data.items
      }]);
  }
  
  // 3. Сохраняем реквизиты
  if (atomicDealData.step5Data) {
    await supabase
      .from('project_requisites')
      .insert([{
        project_id: project.id,
        user_id: userId,
        type: atomicDealData.step4Data?.method,
        data: atomicDealData.step5Data
      }]);
  }
  
  return project.id;
};
```

### **3. Обработка файлов**
```typescript
// Универсальная функция загрузки файлов
const uploadFileToStorage = async (stepId: number, file: File) => {
  const bucketMap = {
    1: 'step-a1-ready-company',
    2: 'project-files',
    3: 'step3-supplier-receipts',
    4: 'project-files',
    5: 'project-files',
    6: 'step6-client-receipts',
    7: 'step7-client-confirmations'
  };
  
  const bucket = bucketMap[stepId];
  const fileName = `${stepId}/${projectId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
};
```

---

## 🎯 **ПЛАН РЕАЛИЗАЦИИ**

### **Фаза 1: Базовая структура** ✅
- [x] Создание 7 кубиков-шагов
- [x] Логика hover и выбора источников
- [x] Базовые формы для ручного заполнения

### **Фаза 2: Интеграция с данными** 🔄
- [ ] Подключение к профилям пользователей
- [ ] Интеграция с шаблонами проектов
- [ ] Подключение к каталогу поставщиков
- [x] Работа с эхо данными ✅

### **Фаза 3: Система файлов** 🔄
- [ ] Загрузка карточек компаний
- [ ] Парсинг спецификаций из Excel/CSV
- [ ] Загрузка чеков и документов
- [ ] Автоматическое извлечение данных из файлов

### **Фаза 4: Создание проектов** 🔄
- [ ] Маппинг данных на классические таблицы
- [ ] Создание проекта в Supabase
- [ ] Интеграция с Telegram уведомлениями
- [ ] Переход к классическому 7-шаговому процессу

### **Фаза 5: Оптимизация UX** 🔄
- [ ] Анимации и переходы
- [ ] Валидация данных
- [ ] Обработка ошибок
- [ ] Мобильная адаптация

---

## 📋 **ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ**

### **Зависимости:**
```json
{
  "framer-motion": "^10.16.4",
  "lucide-react": "^0.263.1",
  "@radix-ui/react-dialog": "^1.0.4",
  "@radix-ui/react-select": "^1.2.2",
  "@radix-ui/react-label": "^2.0.2"
}
```

### **Структура файлов:**
```
app/dashboard/project-constructor/
├── page.tsx                    # Основная страница
├── components/
│   ├── AtomicDealCube.tsx      # Компонент кубика
│   ├── SourceSelector.tsx      # Выбор источника
│   ├── ManualForms/
│   │   ├── CompanyForm.tsx     # Форма компании
│   │   ├── SpecificationForm.tsx # Форма спецификации
│   │   ├── PaymentMethodForm.tsx # Форма метода оплаты
│   │   └── RequisitesForm.tsx  # Форма реквизитов
│   └── FileUploader.tsx        # Компонент загрузки файлов
├── hooks/
│   ├── useAtomicDealConstructor.ts # Основной хук
│   ├── useFileUpload.ts        # Хук загрузки файлов
│   └── useProjectCreation.ts   # Хук создания проекта
└── utils/
    ├── fileParsers.ts          # Парсеры файлов
    ├── dataMappers.ts          # Маппинг данных
    └── validators.ts           # Валидация
```

---

## 🚀 **ЗАКЛЮЧЕНИЕ**

Конструктор атомарных сделок представляет собой **мощный инструмент** для быстрого создания проектов, который:

✅ **Упрощает** процесс создания проектов  
✅ **Автоматизирует** заполнение данных  
✅ **Интегрируется** с существующей системой  
✅ **Поддерживает** загрузку готовых файлов  
✅ **Масштабируется** для будущих потребностей  

**Следующий шаг:** Реализация базовых форм для ручного заполнения с поддержкой загрузки файлов. 