# 🚀 НОВЫЕ API ENDPOINTS КАТАЛОГА V2.0

**Дата создания:** 29 декабря 2024  
**Статус:** ✅ Готовы к использованию

---

## 📋 **ОБЗОР АРХИТЕКТУРЫ**

### 🏗️ **Принцип разделения:**
- **🧡 Оранжевая комната** - Аккредитованные поставщики Get2B (`catalog_verified_suppliers`)
- **🔵 Синяя комната** - Личные поставщики пользователей (`catalog_user_suppliers`)
- **🔄 Импорт** - Копирование из оранжевой в синюю комнату
- **📊 Синхронизация** - Автоматическое извлечение данных из проектов

---

## 🧡 **1. АККРЕДИТОВАННЫЕ ПОСТАВЩИКИ (Оранжевая комната)**

### **GET** `/api/catalog/verified-suppliers`
Получение списка аккредитованных поставщиков Get2B

**Параметры запроса:**
- `category` - Фильтр по категории (`Электроника`, `Текстиль и одежда`, etc.)
- `country` - Фильтр по стране
- `featured` - Только рекомендуемые (`true`)
- `search` - Поиск по названию, компании, описанию

**Ответ:**
```json
{
  "suppliers": [
    {
      "id": "uuid",
      "name": "TechnoMax Electronics",
      "company_name": "TechnoMax Electronics Ltd.",
      "category": "Электроника",
      "country": "Китай",
      "city": "Шэньчжэнь",
      "description": "Ведущий производитель электроники...",
      "rating": 4.8,
      "reviews_count": 127,
      "projects_count": 89,
      "is_featured": true,
      "catalog_verified_products": [...]
    }
  ],
  "total": 15
}
```

### **POST** `/api/catalog/verified-suppliers`
Добавление нового аккредитованного поставщика (только для менеджеров Get2B)

**Тело запроса:**
```json
{
  "name": "Название поставщика",
  "company_name": "Юридическое название",
  "category": "Электроника",
  "country": "Китай",
  "city": "Шэньчжэнь",
  "description": "Описание компании",
  "contact_email": "sales@company.com",
  "contact_phone": "+86 755 1234 5678",
  "website": "https://company.com",
  "min_order": "$5,000",
  "response_time": "24 часа"
}
```

### **PATCH** `/api/catalog/verified-suppliers`
Обновление аккредитованного поставщика (только для менеджеров)

---

## 🔵 **2. ЛИЧНЫЕ ПОСТАВЩИКИ (Синяя комната)**

### **GET** `/api/catalog/user-suppliers`
Получение личных поставщиков пользователя

**Параметры запроса:**
- `category` - Фильтр по категории
- `source_type` - Источник: `user_added`, `imported_from_catalog`, `extracted_from_7steps`
- `search` - Поиск по названию, компании, описанию
- `sort_by` - Сортировка: `total_projects`, `last_project_date`, `created_at`, `name`

**Ответ:**
```json
{
  "suppliers": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Игрик Иванов",
      "company_name": "Юридическое название101",
      "source_type": "extracted_from_7steps",
      "total_projects": 12,
      "successful_projects": 12,
      "total_spent": 7837924835.54,
      "last_project_date": "2025-06-25T20:03:37.432149+00:00",
      "catalog_user_products": [...]
    }
  ],
  "total": 5,
  "user_id": "uuid"
}
```

### **POST** `/api/catalog/user-suppliers`
Добавление нового личного поставщика

**Тело запроса:**
```json
{
  "name": "Название поставщика",
  "company_name": "Юридическое название",
  "category": "Электроника",
  "country": "Россия",
  "contact_email": "supplier@company.ru",
  "contact_phone": "+7 999 123-45-67"
}
```

### **PATCH** `/api/catalog/user-suppliers`
Обновление личного поставщика (только свои записи)

### **DELETE** `/api/catalog/user-suppliers`
Мягкое удаление личного поставщика (is_active = false)

---

## 🔄 **3. ИМПОРТ ПОСТАВЩИКОВ**

### **POST** `/api/catalog/import-supplier`
Импорт поставщика из каталога Get2B в личный список

**Тело запроса:**
```json
{
  "verified_supplier_id": "uuid",
  "import_products": false
}
```

**Ответ:**
```json
{
  "message": "Поставщик успешно импортирован в ваш личный список",
  "supplier_id": "uuid",
  "supplier": { ... }
}
```

### **GET** `/api/catalog/import-supplier?verified_supplier_id=uuid`
Проверка возможности импорта поставщика

**Ответ:**
```json
{
  "can_import": true,
  "verified_supplier": { ... }
}
```

Или:
```json
{
  "can_import": false,
  "reason": "Поставщик уже импортирован в ваш личный список",
  "existing_supplier": { ... }
}
```

---

## 📊 **4. СИНХРОНИЗАЦИЯ КАТАЛОГА**

### **POST** `/api/catalog/sync`
Запуск синхронизации каталога с данными из проектов

**Ответ:**
```json
{
  "message": "Синхронизация каталога успешно завершена",
  "result": {
    "status": "success",
    "suppliers_extracted": 12,
    "sync_completed_at": "2025-06-29T13:47:31.345546+00:00"
  },
  "timestamp": "2025-06-29T13:47:31.345546+00:00"
}
```

### **GET** `/api/catalog/sync`
Получение статистики каталога и статуса синхронизации

**Ответ:**
```json
{
  "user_catalog": {
    "total_suppliers": 5,
    "extracted_from_projects": 5,
    "manually_added": 0,
    "imported_from_catalog": 0,
    "total_projects": 60,
    "total_spent": 39189624177.7,
    "last_sync_date": "2025-06-25T20:03:37.432149+00:00"
  },
  "verified_catalog": {
    "total_verified": 15,
    "featured": 8,
    "by_category": {
      "Электроника": 5,
      "Текстиль и одежда": 3,
      "Красота и здоровье": 4,
      "Автотовары": 2,
      "Спорт и отдых": 1
    },
    "by_country": {
      "Китай": 6,
      "Турция": 3,
      "Германия": 2,
      "США": 2,
      "Италия": 2
    }
  },
  "sync_available": true,
  "last_check": "2025-06-29T13:47:31.345546+00:00"
}
```

---

## 🎯 **ИСПОЛЬЗОВАНИЕ С ХУКАМИ**

### **Импорт хуков:**
```typescript
import { 
  useVerifiedSuppliers, 
  useUserSuppliers, 
  useImportSupplier,
  useCatalogSync 
} from '@/hooks/useCatalogSuppliers';
```

### **Пример использования:**
```typescript
// Аккредитованные поставщики (оранжевая комната)
const { suppliers: verifiedSuppliers, loading: verifiedLoading } = useVerifiedSuppliers({
  category: 'Электроника',
  featured: true
});

// Личные поставщики (синяя комната)
const { suppliers: userSuppliers, loading: userLoading } = useUserSuppliers({
  sort_by: 'total_projects'
});

// Импорт поставщика
const { importSupplier, loading: importLoading } = useImportSupplier();

// Синхронизация
const { syncCatalog, getStats } = useCatalogSync();
```

---

## 🔐 **БЕЗОПАСНОСТЬ**

### **Авторизация:**
- Все endpoints требуют авторизации через Supabase Auth
- Пользователи видят только свои личные данные
- Менеджеры Get2B имеют права на управление аккредитованными поставщиками

### **RLS Политики:**
- `catalog_user_suppliers` - пользователь видит только свои записи
- `catalog_verified_suppliers` - публичное чтение для всех
- Автоматическая фильтрация по `user_id` в синей комнате

---

## ✅ **СТАТУС ГОТОВНОСТИ**

**API Endpoints:** ✅ Готовы  
**TypeScript типы:** ✅ Готовы  
**React хуки:** ✅ Готовы  
**База данных:** ✅ Готова  
**Документация:** ✅ Готова  

**Следующий шаг:** Подключение к Frontend компонентам 🎨 