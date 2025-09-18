# 🏗️ ЦЕНТРАЛЬНАЯ АРХИТЕКТУРА GET2B - ИСТИНА О СИСТЕМЕ

*Обновлено на основе реального анализа БД - Декабрь 2024*

---

## 🎯 **ОСНОВНАЯ ФИЛОСОФИЯ**
**"Единая стройная логика для всех 7 шагов - ничего не ломаем, только растем!"**

---

## 📋 **1. ЦЕНТРАЛЬНЫЕ КОМПОНЕНТЫ**

### 🧠 **1.1 Единый Контекст (CreateProjectContext)**
```typescript
interface CreateProjectContextType {
  // Навигация
  currentStep: number;
  maxStepReached: number;
  
  // Данные проекта
  projectId: string | null;
  projectName: string;
  companyData: CompanyData;
  specificationItems: any[];
  paymentMethod: string | null;
  
  // Методы управления
  setCurrentStep: (step: number) => void;
  setMaxStepReached: (step: number) => void;
  // ... остальные сеттеры
}
```

### 📊 **1.2 Центральная Логика Статусов**
```typescript
// lib/types/project-status.ts
export type ProjectStatus = 
  | "draft"               // Step 1: Черновик
  | "in_progress"         // Step 2: В процессе
  | "waiting_approval"    // Step 2: Ожидание одобрения
  | "waiting_receipt"     // Step 3: Ожидание чека
  | "receipt_approved"    // Step 3: Чек одобрен
  | "receipt_rejected"    // Step 3: Чек отклонён
  | "filling_requisites"  // Step 5: Заполнение реквизитов
  | "waiting_manager_receipt" // Step 6: Ожидание чека от менеджера
  | "in_work"            // Step 6: В работе
  | "waiting_client_confirmation" // Step 7: Ожидание подтверждения
  | "completed";         // Step 7: Завершён

// Строгие переходы между статусами
export const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]>
```

---

## 🔄 **2. СТРОЙНАЯ ЛОГИКА 7 ШАГОВ**

### 📝 **Step 1: Карточка Компании**
```typescript
// Статус: draft → in_progress
// Логика:
1. Заполнение данных компании
2. Сохранение в projects.company_data
3. Создание projectId
4. Смена статуса на "in_progress"
5. Уведомление в Telegram
6. setCurrentStep(2) + setMaxStepReached(2)
```

### 📋 **Step 2: Спецификация**
```typescript
// Статус: in_progress → waiting_approval → waiting_receipt
// Логика:
1. Заполнение спецификации (project_specifications)
2. Автосохранение каждое изменение
3. "Отправить на проверку" → "waiting_approval"
4. Telegram уведомление менеджеру
5. Polling статуса → "waiting_receipt"
6. setCurrentStep(3) + setMaxStepReached(3)
```

### 💰 **Step 3: Загрузка Чека**
```typescript
// Статус: waiting_receipt → receipt_approved
// Логика:
1. Загрузка файла чека в Supabase Storage
2. Сохранение в project_receipts
3. Отправка в Telegram с кнопками одобрения
4. Polling статуса → "receipt_approved"
5. setCurrentStep(4) + setMaxStepReached(4)
```

### 🔧 **Step 4: Метод Оплаты**
```typescript
// Статус: receipt_approved → filling_requisites
// Логика:
1. Выбор метода: bank-transfer / p2p / crypto
2. Сохранение в projects.payment_method
3. Смена статуса на "filling_requisites"
4. setCurrentStep(5) + setMaxStepReached(5)
```

### 🏦 **Step 5: Реквизиты**
```typescript
// Статус: filling_requisites → waiting_manager_receipt
// Логика:
1. Выбор/создание реквизитов по типу payment_method
2. Сохранение в project_requisites
3. Смена статуса на "waiting_manager_receipt"
4. Telegram уведомление менеджеру
5. setCurrentStep(6) + setMaxStepReached(6)
```

### 📨 **Step 6: Получение Чека от Менеджера**
```typescript
// Статус: waiting_manager_receipt → in_work → waiting_client_confirmation
// Логика:
1. Ожидание файла от менеджера через Telegram
2. Автоматическое сохранение в manager_receipts
3. Уведомление клиенту о готовности
4. Смена статуса на "waiting_client_confirmation"
5. setCurrentStep(7) + setMaxStepReached(7)
```

### ✅ **Step 7: Подтверждение Завершения**
```typescript
// Статус: waiting_client_confirmation → completed
// Логика:
1. Финальное подтверждение клиента
2. Смена статуса на "completed"
3. Уведомления в Telegram
4. Завершение проекта
```

---

## 🛠️ **3. ЕДИНАЯ СИСТЕМА ХУКОВ**

### 📊 **3.1 Основные Хуки**
```typescript
// Центральная работа с Supabase
useProjectSupabase() {
  saveSpecification()
  loadSpecification()
  updateStep()
}

// Спецификация по роли
useProjectSpecification(projectId, role) {
  items, fetchSpecification, addItem, updateItem, deleteItem
}

// Telegram интеграция
useTelegramNotifications() {
  sendSpecificationToTelegram()
  sendReceiptToTelegram()
  sendRequisitesToTelegram()
}

// Realtime обновления
useRealtimeProjectData(projectId) {
  // Автоматическое обновление статуса
}
```

---

## 🗂️ **4. СТРУКТУРА БАЗЫ ДАННЫХ**

### 📋 **4.1 Основные Таблицы**
```sql
-- Центральная таблица проектов
projects {
  id, user_id, name, status, current_step, max_step_reached,
  company_data, amount, currency, payment_method, 
  specification_id, created_at, updated_at
}

-- Спецификации
project_specifications {
  id, project_id, role, items, created_at
}

-- Чеки клиентов
project_receipts {
  id, project_id, file_url, status, created_at
}

-- Реквизиты проекта
project_requisites {
  id, project_id, user_id, type, data, created_at
}

-- Чеки от менеджеров
manager_receipts {
  id, project_id, file_url, created_at
}

-- История статусов
project_status_history {
  id, project_id, old_status, new_status, changed_by, comment, created_at
}
```

---

## 🔄 **5. ЦЕНТРАЛЬНАЯ ЛОГИКА ПЕРЕХОДОВ**

### 📊 **5.1 Строгая Последовательность**
```
Step 1 (draft) 
  ↓ Заполнение компании
Step 2 (in_progress)
  ↓ Отправка на одобрение → (waiting_approval)
  ↓ Одобрение менеджера → (waiting_receipt)
Step 3 (waiting_receipt)
  ↓ Загрузка чека → (receipt_approved)
Step 4 (receipt_approved)
  ↓ Выбор метода → (filling_requisites)
Step 5 (filling_requisites)
  ↓ Заполнение реквизитов → (waiting_manager_receipt)
Step 6 (waiting_manager_receipt)
  ↓ Получение чека → (waiting_client_confirmation)
Step 7 (waiting_client_confirmation)
  ↓ Подтверждение → (completed)
```

### 🚫 **5.2 Защита от Ошибок**
```typescript
// Проверка валидности перехода
function isValidStatusTransition(current: ProjectStatus, new: ProjectStatus): boolean

// Проверка доступности шага
function canAccessStep(currentStep: number, maxStepReached: number): boolean

// Автоматическое восстановление при ошибке
function recoverProjectState(projectId: string): Promise<void>
```

---

## 📱 **6. TELEGRAM ИНТЕГРАЦИЯ**

### 🤖 **6.1 Уведомления Менеджеру**
```typescript
// Step2: Спецификация на одобрение
sendSpecificationToTelegram(projectId, spec) 
  → Кнопки: [Одобрить] [Отклонить]

// Step3: Чек на одобрение  
sendReceiptToTelegram(projectId, receiptUrl)
  → Кнопки: [Одобрить] [Отклонить]

// Step5: Запрос чека для клиента
sendRequisiteRequestToTelegram(projectId, requisites)
  → Кнопка: [Загрузить чек]

// Step7: Уведомление о завершении
sendCompletionToTelegram(projectId)
```

### 🔄 **6.2 Webhook Обработка**
```typescript
// /api/telegram-webhook/route.ts
export async function POST(request: Request) {
  // Обработка callback_query от кнопок
  // Автоматическое обновление статуса проекта
  // Уведомления клиенту
}
```

---

## 🛡️ **7. ЗАЩИТА И НАДЁЖНОСТЬ**

### 🔒 **7.1 Автосохранение**
```typescript
// Каждые 30 секунд
useEffect(() => {
  const interval = setInterval(() => {
    if (projectId && hasChanges) {
      saveProjectData(projectId, currentData);
    }
  }, 30000);
  return () => clearInterval(interval);
}, [projectId, hasChanges]);
```

### 🔄 **7.2 Восстановление Состояния**
```typescript
// При загрузке проекта
useEffect(() => {
  if (projectId) {
    const data = await loadProjectData(projectId);
    // Восстановление currentStep из базы
    setCurrentStep(data.current_step);
    setMaxStepReached(data.max_step_reached);
    // Восстановление всех данных
  }
}, [projectId]);
```

### 📊 **7.3 Realtime Обновления**
```typescript
// Подписка на изменения статуса
useEffect(() => {
  const channel = supabase
    .channel('project-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'projects',
      filter: `id=eq.${projectId}`
    }, (payload) => {
      // Автоматическое обновление UI
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [projectId]);
```

---

## 🎯 **8. ПРИНЦИПЫ РАЗРАБОТКИ**

### ✅ **8.1 Что ВСЕГДА Делаем**
1. **Единый контекст** для всех шагов
2. **Строгие переходы** статусов
3. **Автосохранение** каждые 30 сек
4. **Восстановление** состояния при загрузке
5. **Telegram уведомления** на ключевых этапах
6. **Валидация** перед переходом
7. **Обработка ошибок** с fallback
8. **Realtime обновления** статуса

### ❌ **8.2 Что НИКОГДА Не Делаем**
1. **Не пропускаем** шаги
2. **Не позволяем** невалидные переходы статусов
3. **Не теряем** данные при переходах
4. **Не дублируем** логику между шагами
5. **Не изменяем** центральную архитектуру без причины
6. **Не забываем** про автосохранение
7. **Не игнорируем** ошибки Telegram
8. **Не ломаем** обратную совместимость

---

## 🚀 **9. ГОТОВЫЕ КОМПОНЕНТЫ**

### ✅ **Все 7 шагов реализованы:**
1. ✅ **Step1CompanyForm** - Данные компании
2. ✅ **Step2SpecificationForm** - Спецификация
3. ✅ **Step3PaymentForm** - Загрузка чека
4. ✅ **Step4PaymentMethodForm** - Метод оплаты
5. ✅ **Step5RequisiteSelectForm** - Реквизиты
6. ✅ **Step6ReceiptForClient** - Получение чека
7. ✅ **Step7ClientConfirmationForm** - Подтверждение

### 🔧 **Все хуки работают:**
- ✅ useProjectSupabase
- ✅ useProjectSpecification
- ✅ useTelegramNotifications
- ✅ useRealtimeProjectData
- ✅ useProjectInvoices

### 📱 **Telegram полностью интегрирован:**
- ✅ Webhook обработка
- ✅ Интерактивные кнопки
- ✅ Загрузка файлов
- ✅ Уведомления клиенту

---

## 🎉 **ЗАКЛЮЧЕНИЕ**

**Наша архитектура - это стройная, надёжная система где:**

🔹 **Каждый шаг** следует единой логике  
🔹 **Статусы** переходят строго по правилам  
🔹 **Данные** сохраняются автоматически  
🔹 **Состояние** восстанавливается при ошибках  
🔹 **Telegram** интегрирован на каждом этапе  
🔹 **Пользователь** всегда знает где он находится  

**Система готова к росту и не ломает существующий функционал!** 🚀 

---

## 📊 **РЕАЛЬНАЯ СТРУКТУРА БАЗЫ ДАННЫХ**

### 🏗️ **ОСНОВНЫЕ ТАБЛИЦЫ ПРОЕКТОВ**

#### **projects** - Главная таблица проектов
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- name (text) - название проекта
- status (USER-DEFINED) - статус проекта
- current_step (integer, default: 1) - текущий шаг
- max_step_reached (integer, default: 1) - максимальный достигнутый шаг

-- 💰 ФИНАНСОВЫЕ ДАННЫЕ
- amount (numeric, default: 0) - общая сумма
- currency (text, default: 'USD') - валюта

-- 👨‍💼 ДАННЫЕ КЛИЕНТА
- company_data (jsonb) - данные компании клиента
- email (text) - email клиента

-- 🏭 ДАННЫЕ ПОСТАВЩИКА  
- supplier_id (uuid) - ID поставщика из каталога
- supplier_type (text, default: 'manual') - тип поставщика
- supplier_data (jsonb, default: '{}') - данные поставщика

-- 💳 РЕКВИЗИТЫ И ПЛАТЕЖИ
- selected_requisite_id (uuid) - выбранные реквизиты
- selected_requisite_type (text) - тип реквизитов
- one_time_requisite (jsonb) - разовые реквизиты
- payment_method (USER-DEFINED) - способ платежа

-- 📄 ДОКУМЕНТЫ
- client_receipt (text) - чек клиента
- client_confirmation_url (text) - подтверждение клиента
- client_confirmation_status (varchar, default: 'pending')

-- ⏱️ ВРЕМЕННЫЕ МЕТКИ
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

#### **project_specifications** - Товары проектов (ПОСТРОЧНО!)
```sql
- id (uuid, PK)
- project_id (uuid, FK → projects.id) 
- user_id (uuid, FK → auth.users)
- role (text, NOT NULL) - 'client' или 'supplier'

-- 📦 ДАННЫЕ ТОВАРА
- item_name (text, NOT NULL) - название товара
- item_code (text) - код/артикул товара
- quantity (numeric) - количество
- unit (text) - единица измерения
- price (numeric) - цена за единицу
- total (numeric) - общая стоимость
- image_url (text) - изображение товара

-- 📄 ДОКУМЕНТЫ
- invoice_file_url (text) - ссылка на инвойс

-- ⏱️ ВРЕМЕННЫЕ МЕТКИ
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

---

## 🏪 **СТРУКТУРА КАТАЛОГА ПОСТАВЩИКОВ**

### 🔵 **СИНЯЯ КОМНАТА** (Личные поставщики пользователя)

#### **catalog_user_suppliers** - Поставщики пользователя
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- name (text) - имя поставщика
- company_name (text) - название компании
- category (text) - категория товаров
- country (text) - страна
- city (text) - город
- contact_email (text) - email
- contact_phone (text) - телефон  
- website (text) - сайт
- contact_person (text) - контактное лицо
- source_type (text) - источник ('manual', 'extracted_from_7steps', 'echo_card')
- is_active (boolean, default: true) - активность записи
- total_projects (integer, default: 0) - количество проектов
- successful_projects (integer, default: 0) - успешных проектов
- cancelled_projects (integer, default: 0) - отмененных проектов
- total_spent (numeric, default: 0) - потрачено всего
- last_project_date (timestamptz) - дата последнего проекта
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

#### **catalog_user_products** - Товары личных поставщиков
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- supplier_id (uuid, FK → catalog_user_suppliers.id)
- name (text) - название товара
- code (text) - артикул
- price (numeric) - цена
- currency (text, default: 'USD') - валюта
- category (text) - категория
- description (text) - описание
- min_order (text) - минимальный заказ
- in_stock (boolean, default: true) - в наличии
- image_url (text) - изображение
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

### 🧡 **ОРАНЖЕВАЯ КОМНАТА** (Аккредитованные поставщики Get2B)

#### **catalog_verified_suppliers** - Аккредитованные поставщики
```sql
- id (uuid, PK)
- name (text) - имя поставщика
- company_name (text) - название компании  
- category (text) - основная категория
- country (text) - страна
- city (text) - город
- contact_email (text) - email
- contact_phone (text) - телефон
- website (text) - сайт
- contact_person (text) - контактное лицо
- verification_status (text) - статус верификации
- verification_date (timestamptz) - дата верификации
- is_active (boolean, default: true) - активность
- rating (numeric) - рейтинг (1-5)
- total_orders (integer, default: 0) - общее количество заказов
- success_rate (numeric, default: 0) - процент успешности
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

#### **catalog_verified_products** - Товары аккредитованных поставщиков
```sql
- id (uuid, PK)
- supplier_id (uuid, FK → catalog_verified_suppliers.id)
- name (text) - название товара
- code (text) - артикул
- price (numeric) - цена
- currency (text, default: 'USD') - валюта
- category (text) - категория
- description (text) - описание
- min_order (text) - минимальный заказ
- in_stock (boolean, default: true) - в наличии
- image_url (text) - изображение
- certification (text) - сертификация
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

---

## 🧠 **УМНЫЙ КАТАЛОГ И AI РЕКОМЕНДАЦИИ (декабрь 2024)**

### 🎯 **9.1 Философия AI-Каталога**
**"Каждый проект учит систему быть умнее - GET2B накапливает знания и предлагает лучшие решения"**

### 📊 **9.2 AI Архитектура**
```sql
-- История товаров для AI анализа
project_product_history {
  id, user_id, project_id, 
  product_name, unit_price, quantity, total_value,
  supplier_name, supplier_id, supplier_type,
  category, created_at
}

-- Паттерны использования поставщиков
supplier_usage_patterns {
  id, user_id, supplier_key,
  supplier_name, supplier_type,
  total_projects, successful_projects, success_rate,
  total_spent, avg_project_value,
  first_project_date, last_project_date,
  categories (jsonb), top_products (jsonb),
  created_at, updated_at
}
```

### 🔄 **9.3 AI Функции Синхронизации**
```sql
-- Извлечение товаров из project_specifications
extract_product_history_from_projects()

-- Обновление статистики поставщиков
update_supplier_usage_patterns()  

-- Полная синхронизация AI данных
sync_smart_catalog_data()
```

### 🎯 **9.4 API Умных Рекомендаций**
```typescript
// GET /api/catalog/recommendations
interface SmartRecommendations {
  top_suppliers: Array<{
    supplier_name: string;
    success_rate: number;
    total_projects: number;
    avg_project_value: number;
    recommendation_reason: string;
  }>;
  
  trending_products: Array<{
    product_name: string;
    supplier_name: string;
    unit_price: number;
    frequency: number;
    category: string;
  }>;
  
  verified_suppliers: Array<{
    name: string;
    company_name: string;
    rating: number;
    ai_recommendation_score: number;
  }>;
}
```

### 🎨 **9.5 AI Интеграция в UI**
```typescript
// Умная оранжевая комната
<div className="🧠 Каталог Get2B">
  // Персональные рекомендации
  <section>🎯 Рекомендуем специально для вас</section>
  
  // Популярные товары  
  <section>🔥 Популярные товары в системе</section>
  
  // AI-улучшенные карточки поставщиков
  <SupplierCard ai-badges="🧠 РЕКОМЕНДУЕМ | ⭐ ТОП РЕЙТИНГ" />
</div>
```

### 🔮 **9.6 Интеграция с 7 Шагами (Планируется)**
```typescript
// Step 2: AI-выбор поставщика
useSmartSupplierSelection() {
  // Рекомендации из supplier_usage_patterns
  // Популярные товары из project_product_history  
  // AI предупреждения о рисках
}

// Автоматическое обучение после завершения проекта
onProjectCompleted(projectId) {
  extract_product_history_from_projects()
  update_supplier_usage_patterns()
  // AI анализ успешности
}
```

### 🎯 **9.7 AI Результаты**
- ✅ **Персональные рекомендации** работают
- ✅ **Популярные товары** показываются в реальном времени  
- ✅ **Умная сортировка** поставщиков
- ✅ **AI бейджи** для быстрой навигации
- 🔄 **Интеграция с процессом создания** (следующий этап)

---

## 🎯 **ЗАКЛЮЧЕНИЕ: GET2B КАК AI-ПЛАТФОРМА**

**GET2B эволюционировал из простой системы платежей в самообучающуюся AI-платформу:**

1. 🧠 **Накапливает опыт** - каждый проект улучшает рекомендации
2. 🎯 **Персонализирует выбор** - AI анализирует профиль пользователя  
3. 📊 **Предоставляет инсайты** - реальная статистика для принятия решений
4. ⚡ **Ускоряет процессы** - умные предложения экономят время
5. 🚀 **Создает уникальную ценность** - никто не предлагает такой интеллект

**Следующий шаг: интеграция AI рекомендаций в Step2SpecificationForm для революционного UX!** 🧠🚀