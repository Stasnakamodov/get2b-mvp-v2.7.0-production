# 🏗️ АРХИТЕКТУРА ПРОФИЛЬ ↔ КАТАЛОГ - ФИНАЛЬНАЯ ВЕРСИЯ

*Дата: Декабрь 2024*  
*Статус: ЗАДЕКЛАРИРОВАНО*

---

## 🎯 **ОСНОВНАЯ КОНЦЕПЦИЯ**

**ПРОФИЛЬ** = Мои собственные компании (когда я клиент + когда я поставщик)  
**КАТАЛОГ** = Рабочие контакты поставщиков + автозаполнение проектов  
**ИНТЕГРАЦИЯ** = Профиль → Каталог → Проекты → Эхо карточки → Каталог

---

## 🏠 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ**

### 📊 **Структура профиля**
```typescript
interface UserProfile {
  client_profiles: ClientProfile[]     // До 3-х компаний (когда я клиент)
  supplier_profiles: SupplierProfile[] // До 3-х компаний (когда я поставщик)
}
```

### 👤 **CLIENT_PROFILES** - Мои компании как клиента
```sql
client_profiles {
  id, user_id, name, legal_name, inn, kpp, ogrn, 
  legal_address, bank_name, bank_account, corr_account, bik,
  email, phone, website, is_default, created_at
}
```

### 🏭 **SUPPLIER_PROFILES** - Мои компании как поставщика
```sql
supplier_profiles {
  id, user_id, name, company_name, category, country, city,
  contact_email, contact_phone, website, contact_person,
  description, min_order, response_time, employees, established,
  
  -- 💰 БАНКОВСКИЕ РЕКВИЗИТЫ
  recipient_name, bank_name, account_number, swift, iban,
  transfer_currency, payment_purpose,
  
  -- 💳 P2P РЕКВИЗИТЫ
  p2p_bank, p2p_card_number, p2p_holder_name, p2p_expiry_date,
  
  -- 🪙 CRYPTO РЕКВИЗИТЫ
  crypto_name, crypto_address, crypto_network,
  
  -- ✅ ПРОФИЛЬНЫЕ ПОЛЯ
  is_default, user_notes, is_active, created_at
}
```

---

## 🔄 **АВТОМАТИЧЕСКИЙ ПЕРЕНОС**

### 🎯 **Логика переноса**
```typescript
// При создании supplier_profiles:
supplier_profiles → catalog_user_suppliers (АВТОМАТИЧЕСКИ)
```

### 📋 **Что переносится**
- Все данные поставщика (название, контакты, реквизиты)
- Товары и услуги
- Методы оплаты
- Статус: `source_type = 'from_profile'`

---

## 📦 **КАТАЛОГ ПОСТАВЩИКОВ**

### 🔵 **СИНЯЯ КОМНАТА** (`catalog_user_suppliers`)
- Мои рабочие контакты поставщиков
- Автоматически пополняется из моих `supplier_profiles`
- Импорт из эхо карточек
- Статистика работы (проекты, суммы, успешность)

### 🟠 **ОРАНЖЕВАЯ КОМНАТА** (`catalog_verified_suppliers`)
- Публичные аккредитованные поставщики Get2B
- Управляется менеджерами проекта
- Доступны всем пользователям для добавления в синюю комнату

---

## 🚀 **СОЗДАНИЕ ПРОЕКТА**

### 👤 **КЛИЕНТ ИНИЦИИРУЕТ ПРОЕКТ**

#### **Step1: Данные компании клиента**
```typescript
// АВТОЗАПОЛНЕНИЕ из профиля
client_profiles → companyData
```

#### **Step2: Товары поставщика**
```typescript
// АВТОЗАПОЛНЕНИЕ из каталога
catalog_user_suppliers → products → specificationItems
```

#### **Step4: Методы оплаты**
```typescript
// АВТОЗАПОЛНЕНИЕ - все заполненные методы поставщика
supplier_profiles → payment_methods (bank, p2p, crypto)
```

#### **Step5: Реквизиты поставщика**
```typescript
// АВТОЗАПОЛНЕНИЕ из каталога
catalog_user_suppliers → requisites
```

### 🏭 **ПОСТАВЩИК ИНИЦИИРУЕТ ПРОЕКТ**

#### **Step1: Данные компании клиента**
```typescript
// НЕ АВТОЗАПОЛНЯЕТСЯ - поставщик не знает данных клиента
// Клиент заполняет:
- Из профиля (client_profiles)
- Из шаблонов
- Вручную
- Загрузить документы
```

#### **Step2: Товары поставщика**
```typescript
// АВТОЗАПОЛНЕНИЕ из профиля поставщика
supplier_profiles → products → specificationItems
```

#### **Step4: Методы оплаты**
```typescript
// АВТОЗАПОЛНЕНИЕ - все заполненные методы из профиля
supplier_profiles → payment_methods (bank, p2p, crypto)
```

#### **Step5: Реквизиты поставщика**
```typescript
// АВТОЗАПОЛНЕНИЕ из профиля поставщика
supplier_profiles → requisites
```

---

## 🎯 **АККРЕДИТАЦИЯ ПОСТАВЩИКОВ**

### 📋 **Процесс аккредитации**
```typescript
1. В профиле поставщика: кнопка "Подать заявку на аккредитацию"
2. Заявка отправляется менеджерам в Telegram
3. Менеджер через мини интерфейс модерации одобряет/отклоняет
4. При одобрении: supplier_profiles → catalog_verified_suppliers
5. Поставщик появляется в оранжевой комнате для всех пользователей
```

### 🔧 **Техническая реализация**
```sql
-- Таблица заявок на аккредитацию
accreditation_requests {
  id, user_id, supplier_profile_id, status, 
  manager_id, decision_date, notes, created_at
}

-- Статусы заявок
status: 'pending' | 'approved' | 'rejected'
```

---

## 🔮 **ЭХО КАРТОЧКИ**

### 📊 **Источники данных**
```typescript
// Завершенные проекты → извлечение данных поставщиков
Step2: project_specifications → товары
Step4: projects.payment_method → способ оплаты
Step5: project_requisites → реквизиты поставщика
```

### 🎯 **Импорт в каталог**
```typescript
// Эхо карточки → catalog_user_suppliers
// Статистика работы с поставщиками:
- Количество проектов
- Успешность сделок
- Общая сумма
- Рейтинг поставщика
```

---

## 🔄 **ПОЛНЫЙ ЦИКЛ ИНТЕГРАЦИИ**

### 1️⃣ **Создание профиля поставщика**
```typescript
supplier_profiles → catalog_user_suppliers (автоматически)
```

### 2️⃣ **Создание проекта**
```typescript
// Клиент:
client_profiles → Step1
catalog_user_suppliers → Step2, Step4, Step5

// Поставщик:  
supplier_profiles → Step2, Step4, Step5
Step1 → заполняется клиентом
```

### 3️⃣ **Завершение проекта**
```typescript
projects → echo_cards → catalog_user_suppliers
```

### 4️⃣ **Аккредитация**
```typescript
supplier_profiles → accreditation_request → catalog_verified_suppliers
```

### 5️⃣ **Новый проект**
```typescript
catalog_verified_suppliers → catalog_user_suppliers → project_autofill
```

---

## 🎯 **КЛЮЧЕВЫЕ ПРИНЦИПЫ**

### ✅ **Что автозаполняется**
- Step1: Данные компании инициатора (из профиля)
- Step2: Товары поставщика (из каталога/профиля)
- Step4: Методы оплаты поставщика (все заполненные)
- Step5: Реквизиты поставщика (из каталога/профиля)

### ❌ **Что НЕ автозаполняется**
- Step1 при инициации поставщиком (данные клиента неизвестны)
- Количества и цены товаров (задает клиент)
- Выбор конкретного метода оплаты (выбирает клиент)

### 🔄 **Источники автозаполнения**
```typescript
1. client_profiles → Step1 (клиент)
2. supplier_profiles → Step1 (поставщик), Step2, Step4, Step5
3. catalog_user_suppliers → Step2, Step4, Step5
4. catalog_verified_suppliers → Step2, Step4, Step5
5. echo_cards → Step2, Step4, Step5
```

---

## 📱 **ИНТЕРФЕЙСЫ**

### 🏠 **Профиль пользователя**
- Секция "Мои компании (клиент)" - управление client_profiles
- Секция "Мои компании (поставщик)" - управление supplier_profiles
- Кнопка "Подать заявку на аккредитацию" в каждом supplier_profile

### 🔵 **Каталог (синяя комната)**
- Мои поставщики из профиля (автоматически)
- Импорт из эхо карточек
- Статистика работы с поставщиками

### 🟠 **Каталог (оранжевая комната)**
- Публичные аккредитованные поставщики
- Умные рекомендации
- Кнопка "Добавить в мой список"

### 🚀 **Создание проекта**
- Модальное окно каталога для автозаполнения
- Выбор шагов для импорта
- Предварительный просмотр данных

---

## 🔧 **ТЕХНИЧЕСКИЕ ДЕТАЛИ**

### 📊 **API Endpoints**
```typescript
// Профиль
GET /api/profile/client-profiles
POST /api/profile/client-profiles
GET /api/profile/supplier-profiles  
POST /api/profile/supplier-profiles

// Аккредитация
POST /api/profile/accreditation-request
GET /api/profile/accreditation-status

// Автозаполнение
GET /api/autofill/supplier-data?supplier_id=...
GET /api/autofill/client-data?client_id=...
```

### 🎯 **Контексты React**
```typescript
// Профиль
ProfileContext - управление client_profiles, supplier_profiles
AccreditationContext - заявки на аккредитацию

// Создание проекта
CreateProjectContext - автозаполнение из каталога
CatalogModalContext - выбор поставщиков для автозаполнения
```

---

## 🎉 **ЗАКЛЮЧЕНИЕ**

Архитектура обеспечивает:
- ✅ Полное автозаполнение проектов из профиля и каталога
- ✅ Автоматический перенос поставщиков из профиля в каталог
- ✅ Накопление статистики работы с поставщиками
- ✅ Систему аккредитации для публичного каталога
- ✅ Единый цикл: Профиль → Каталог → Проекты → Эхо карточки → Каталог

**Все компоненты работают вместе для максимального удобства пользователей.** 