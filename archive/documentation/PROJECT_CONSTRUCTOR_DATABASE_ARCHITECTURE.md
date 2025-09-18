# 🏗️ АРХИТЕКТУРА БАЗЫ ДАННЫХ КОНСТРУКТОРА ПРОЕКТОВ

> **Обновлено:** 27.07.2025 - Реальная архитектура на основе изученной документации

## 🎯 КОНЦЕПЦИЯ КОНСТРУКТОРА

**КОНСТРУКТОР ПРОЕКТОВ** = 7-шаговый интерфейс для создания атомных сделок с автоматическим заполнением данных из различных источников.

```
Step1 (Клиент) → Step2 (Товары) → Step3 (Чек) → Step4 (Оплата) → Step5 (Реквизиты) → Step6 (Получение) → Step7 (Завершение)
```

## 📊 РЕАЛЬНАЯ СТРУКТУРА БД (ИЗ ДОКУМЕНТАЦИИ)

### ✅ СУЩЕСТВУЮЩИЕ ТАБЛИЦЫ:

#### 1. **projects** - Основная таблица проектов
```sql
-- Реальная структура (из CENTRAL_ARCHITECTURE.md)
id: UUID (PK)
user_id: UUID (FK → auth.users)
name: TEXT
status: TEXT (draft, in_progress, waiting_approval, waiting_receipt, receipt_approved, filling_requisites, waiting_manager_receipt, in_work, waiting_client_confirmation, completed)
current_step: INTEGER
max_step_reached: INTEGER
company_data: JSONB (Step1 данные)
amount: NUMERIC
currency: TEXT
payment_method: TEXT (bank-transfer, p2p, crypto)
specification_id: UUID (FK → project_specifications)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### 2. **project_templates** - Шаблоны проектов ✅
```sql
-- Реальная структура (из Supabase Table Editor)
id: UUID (PK)
user_id: UUID (FK → auth.users)
name: TEXT
description: TEXT
company_name: TEXT
company_legal: TEXT
company_inn: TEXT
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### 3. **project_specifications** - Спецификации товаров ✅
```sql
-- Реальная структура (из ваших данных)
id: UUID (PK)
project_id: UUID (FK → projects)
user_id: UUID (FK → auth.users)
role: TEXT
item_name: TEXT
item_code: TEXT
quantity: NUMERIC
unit: TEXT
price: NUMERIC
total: NUMERIC
image_url: TEXT
currency: TEXT
supplier_name: TEXT  -- 🎯 КЛЮЧЕВОЕ ПОЛЕ ДЛЯ ФАНТОМНЫХ ДАННЫХ!
created_at: TIMESTAMP
updated_at: TIMESTAMP
invoice_file_url: TEXT
```

#### 4. **project_requisites** - Реквизиты проектов ✅
```sql
-- Реальная структура (из create-project-requisites-table.sql)
id: UUID (PK)
user_id: UUID (FK → auth.users)
project_id: UUID (FK → projects)
type: TEXT ('bank' | 'p2p' | 'crypto')
data: JSONB (банковские/крипто данные поставщика)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### 5. **project_receipts** - Чеки клиентов
```sql
-- Из CENTRAL_ARCHITECTURE.md
id: UUID (PK)
project_id: UUID (FK → projects)
file_url: TEXT
status: TEXT
created_at: TIMESTAMP
```

#### 6. **manager_receipts** - Чеки от менеджеров
```sql
-- Из CENTRAL_ARCHITECTURE.md
id: UUID (PK)
project_id: UUID (FK → projects)
file_url: TEXT
created_at: TIMESTAMP
```

#### 7. **project_status_history** - История статусов
```sql
-- Из CENTRAL_ARCHITECTURE.md
id: UUID (PK)
project_id: UUID (FK → projects)
old_status: TEXT
new_status: TEXT
changed_by: TEXT
comment: TEXT
created_at: TIMESTAMP
```

## 🔮 КОНЦЕПЦИЯ ФАНТОМНЫХ ДАННЫХ

### 🎯 ЧТО ТАКОЕ ФАНТОМНЫЕ ДАННЫЕ:

**ФАНТОМНЫЕ ДАННЫЕ** = Реальные реквизиты поставщиков из завершенных проектов, которые предлагаются для автоматического заполнения Step4 и Step5.

```
📋 Step2 (Товары с supplier_name) → 🔍 Поиск в БД → 🎭 Фантомные данные → ✅ Автозаполнение Step4+5
```

### 🔍 РЕАЛЬНАЯ ЛОГИКА ПОИСКА ФАНТОМНЫХ ДАННЫХ:

1. **Идентификация поставщика** из `project_specifications.supplier_name` (Step2)
2. **Поиск проектов** с этим поставщиком в `project_specifications`
3. **Извлечение project_id** из найденных спецификаций
4. **Получение project_requisites** для этих проектов
5. **Предложение реальных реквизитов** для Step4 и Step5

### 📊 СТРУКТУРА ФАНТОМНЫХ ДАННЫХ:

```typescript
interface PhantomData {
  payment_method: {
    method: 'bank-transfer' | 'p2p' | 'crypto'
    supplier_id: string
  }
  requisites: {
    bankName: string
    accountNumber: string
    swift: string
    recipientName: string
    supplier_id: string
  }
  project_info: {
    project_name: string
    project_date: string
    amount: number
    currency: string
    status: string
    supplier_name: string  // из project_specifications.supplier_name
  }
}
```

## 🚀 ПРАВИЛЬНЫЕ SQL ЗАПРОСЫ (ИЗ ДОКУМЕНТАЦИИ)

### Поиск фантомных данных по поставщику:

```sql
-- 1. Найти проекты с поставщиком (ЗАМЕНИТЕ 'YOUR_USER_ID_HERE' на реальный UUID)
SELECT DISTINCT ps.project_id, ps.supplier_name
FROM project_specifications ps
WHERE ps.supplier_name ILIKE '%Игрик Иванов%'
AND ps.user_id = 'YOUR_USER_ID_HERE'
ORDER BY ps.created_at DESC;

-- 2. Получить реквизиты для этих проектов
SELECT 
  pr.project_id,
  pr.type,
  pr.data,
  p.name as project_name,
  p.amount,
  p.currency,
  p.status,
  p.payment_method
FROM project_requisites pr
JOIN projects p ON pr.project_id = p.id
WHERE pr.project_id IN (
  SELECT DISTINCT ps.project_id
  FROM project_specifications ps
  WHERE ps.supplier_name ILIKE '%Игрик Иванов%'
  AND ps.user_id = 'YOUR_USER_ID_HERE'
)
AND pr.user_id = 'YOUR_USER_ID_HERE'
ORDER BY pr.created_at DESC;
```

### Диагностика проектов (из debug-echo-cards-projects.sql):

```sql
-- Все проекты пользователя
SELECT 
  id,
  name as project_name,
  status,
  amount,
  currency,
  company_data IS NOT NULL as has_company_data,
  company_data->>'name' as company_name,
  created_at::date,
  updated_at::date
FROM projects 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY updated_at DESC;

-- Проекты со спецификациями
SELECT 
  p.id,
  p.name as project_name,
  p.status,
  p.company_data->>'name' as company_name,
  COUNT(ps.id) as specs_count
FROM projects p
LEFT JOIN project_specifications ps ON ps.project_id = p.id
WHERE p.user_id = 'YOUR_USER_ID_HERE'
GROUP BY p.id, p.name, p.status, p.company_data
ORDER BY p.updated_at DESC;
```

## 🎯 ИНТЕГРАЦИЯ С ЭХО КАРТОЧКАМИ

### Связь с существующей системой:

1. **Эхо карточки** уже извлекают данные из `project_requisites` (из ECHO_CARDS_ARCHITECTURE.md)
2. **Фантомные данные** используют ту же логику
3. **Единый источник** данных для реквизитов поставщиков

### Логика работы (из echo-cards-FIXED/route.ts):

```
Step2 (supplier_name) → 🔍 project_specifications → 📋 project_requisites → 🎭 Фантомные данные
```

### Приоритеты данных (из документации):

1. **ПРИОРИТЕТ 1:** `project_requisites` - реальные реквизиты поставщиков
2. **ПРИОРИТЕТ 2:** `bank_accounts` - шаблоны реквизитов как fallback
3. **ПРИОРИТЕТ 3:** Ничего - если нет данных

## 🚀 ПЛАН РЕАЛИЗАЦИИ

### Этап 1: ✅ Анализ существующей структуры
- [x] Изучена документация CENTRAL_ARCHITECTURE.md
- [x] Изучена документация ECHO_CARDS_ARCHITECTURE.md
- [x] Проанализирована реальная структура БД
- [x] Документирована реальная архитектура

### Этап 2: 🔄 Реализация фантомных данных
- [x] Обновлена функция `getPhantomSupplierData` с реальной логикой
- [x] Используем `project_specifications.supplier_name` для поиска
- [ ] Добавить кэширование фантомных данных
- [ ] Реализовать UI для выбора фантомных данных

### Этап 3: 🔄 Интеграция с существующими системами
- [x] Интеграция с эхо карточками (уже есть)
- [ ] Интеграция с каталогом поставщиков
- [ ] Интеграция с шаблонами проектов

## 📋 СЛЕДУЮЩИЕ ШАГИ

1. **Протестировать** обновленную функцию фантомных данных
2. **Проверить** работу с реальными данными в БД
3. **Реализовать UI** для отображения фантомных данных
4. **Интегрировать** с интерфейсом конструктора

## 🔧 ВАЖНЫЕ ЗАМЕЧАНИЯ

### UUID пользователя:
- **НЕ ИСПОЛЬЗУЙТЕ** `'user-uuid'` как placeholder
- **ИСПОЛЬЗУЙТЕ** `'YOUR_USER_ID_HERE'` как в документации
- **ПОЛУЧАЙТЕ** реальный UUID через `supabase.auth.getUser()`

### Структура данных:
- `project_specifications.supplier_name` - ключевое поле для поиска
- `project_requisites.data` - JSONB с реквизитами поставщика
- `projects.payment_method` - способ оплаты (bank-transfer, p2p, crypto)

---

**Статус:** 🔄 Реализация фантомных данных
**Приоритет:** Высокий
**Сложность:** Средняя 