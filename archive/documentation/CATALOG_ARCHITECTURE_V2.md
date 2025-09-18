# 🏪 АРХИТЕКТУРА КАТАЛОГА ПОСТАВЩИКОВ V2.0

## 🚨 **КРИТИЧЕСКОЕ ОБНОВЛЕНИЕ АРХИТЕКТУРЫ**
**Дата: 29 декабря 2024**  
**Причина: Исправление архитектурной ошибки с одной таблицей**

---

## ❌ **ПРОБЛЕМА ТЕКУЩЕЙ АРХИТЕКТУРЫ V1.0**

### **Что было неправильно:**
- ☠️ **Одна таблица** `catalog_suppliers` для двух разных целей
- ☠️ **Смешивание данных** пользователей и менеджеров
- ☠️ **Проблемы безопасности** - пользователи могут видеть чужие данные
- ☠️ **Сложность масштабирования** - нет четкого разделения ответственности
- ☠️ **Путаница в RLS политиках** - одни правила для разных типов данных

---

## ✅ **НОВАЯ АРХИТЕКТУРА V2.0**

### 🎯 **Основные принципы:**
1. **Разделение ответственности** - каждая таблица для своей цели
2. **Безопасность данных** - четкие границы доступа
3. **Масштабируемость** - легко добавлять новые функции
4. **Простота понимания** - логичная структура

---

## 🗂️ **НОВАЯ СТРУКТУРА БАЗЫ ДАННЫХ**

### 📊 **Таблица 1: Аккредитованные поставщики Get2B**
```sql
-- 🧡 ОРАНЖЕВАЯ СТОРОНА - управляется ТОЛЬКО менеджерами
CREATE TABLE catalog_verified_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основная информация
  name text NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL,
  country text NOT NULL,
  city text,
  description text,
  logo_url text,
  
  -- Контактная информация
  contact_email text,
  contact_phone text,
  website text,
  contact_person text,
  
  -- Бизнес-профиль
  min_order text,
  response_time text,
  employees text,
  established text,
  certifications jsonb,
  specialties jsonb,
  payment_methods jsonb,
  
  -- Менеджерские поля
  verified_by uuid REFERENCES auth.users(id), -- ID менеджера
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  internal_notes text, -- заметки для менеджеров
  
  -- Публичные метрики
  rating decimal(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  projects_count integer DEFAULT 0,
  
  -- Статус
  is_active boolean DEFAULT true,
  
  -- Временные метки
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ограничения
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_category CHECK (category IN ('Электроника', 'Текстиль и одежда', 'Красота и здоровье', 'Автотовары', 'Спорт и отдых'))
);

-- Индексы для производительности
CREATE INDEX idx_verified_suppliers_category ON catalog_verified_suppliers(category);
CREATE INDEX idx_verified_suppliers_country ON catalog_verified_suppliers(country);
CREATE INDEX idx_verified_suppliers_active ON catalog_verified_suppliers(is_active);
CREATE INDEX idx_verified_suppliers_featured ON catalog_verified_suppliers(is_featured);
```

### 📊 **Таблица 2: Личные поставщики пользователей**
```sql
-- 🔵 СИНЯЯ СТОРОНА - управляется пользователями
CREATE TABLE catalog_user_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Основная информация
  name text NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL,
  country text NOT NULL,
  city text,
  description text,
  logo_url text,
  
  -- Контактная информация
  contact_email text,
  contact_phone text,
  website text,
  contact_person text,
  
  -- Бизнес-профиль
  min_order text,
  response_time text,
  employees text,
  established text,
  certifications jsonb,
  specialties jsonb,
  payment_methods jsonb,
  
  -- Источник данных
  source_type text NOT NULL DEFAULT 'user_added', -- 'user_added' | 'imported_from_catalog'
  source_supplier_id uuid REFERENCES catalog_verified_suppliers(id), -- если импортирован
  import_date timestamptz, -- когда импортирован
  
  -- Пользовательские данные
  user_notes text, -- личные заметки пользователя
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  last_project_date timestamptz,
  total_projects integer DEFAULT 0,
  
  -- Статус
  is_active boolean DEFAULT true,
  
  -- Временные метки
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ограничения
  CONSTRAINT valid_source_type CHECK (source_type IN ('user_added', 'imported_from_catalog')),
  CONSTRAINT valid_category CHECK (category IN ('Электроника', 'Текстиль и одежда', 'Красота и здоровье', 'Автотовары', 'Спорт и отдых'))
);

-- Индексы для производительности
CREATE INDEX idx_user_suppliers_user_id ON catalog_user_suppliers(user_id);
CREATE INDEX idx_user_suppliers_category ON catalog_user_suppliers(category);
CREATE INDEX idx_user_suppliers_source ON catalog_user_suppliers(source_type);
CREATE INDEX idx_user_suppliers_active ON catalog_user_suppliers(is_active);
```

### 📊 **Таблица 3: Товары аккредитованных поставщиков**
```sql
-- Товары для оранжевой стороны
CREATE TABLE catalog_verified_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES catalog_verified_suppliers(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price decimal(12,2),
  currency text DEFAULT 'USD',
  min_order text,
  images jsonb, -- массив URL изображений
  specifications jsonb,
  in_stock boolean DEFAULT true,
  sku text,
  
  -- Временные метки
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_verified_products_supplier ON catalog_verified_products(supplier_id);
CREATE INDEX idx_verified_products_category ON catalog_verified_products(category);
CREATE INDEX idx_verified_products_stock ON catalog_verified_products(in_stock);
```

### 📊 **Таблица 4: Товары личных поставщиков**
```sql
-- Товары для синей стороны
CREATE TABLE catalog_user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES catalog_user_suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price decimal(12,2),
  currency text DEFAULT 'USD',
  min_order text,
  images jsonb, -- массив URL изображений
  specifications jsonb,
  in_stock boolean DEFAULT true,
  sku text,
  
  -- Временные метки
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_products_supplier ON catalog_user_products(supplier_id);
CREATE INDEX idx_user_products_user ON catalog_user_products(user_id);
CREATE INDEX idx_user_products_category ON catalog_user_products(category);
```

---

## 🔐 **RLS ПОЛИТИКИ БЕЗОПАСНОСТИ**

### 🧡 **Для catalog_verified_suppliers (оранжевая сторона):**
```sql
-- Все могут читать активных поставщиков
CREATE POLICY "Публичное чтение аккредитованных поставщиков" 
ON catalog_verified_suppliers FOR SELECT 
USING (is_active = true);

-- Только менеджеры могут создавать/редактировать
-- (добавим роль 'manager' в auth.users)
CREATE POLICY "Менеджеры могут управлять поставщиками" 
ON catalog_verified_suppliers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'manager'
  )
);
```

### 🔵 **Для catalog_user_suppliers (синяя сторона):**
```sql
-- Пользователи видят только свои записи
CREATE POLICY "Пользователи видят свои поставщики" 
ON catalog_user_suppliers FOR SELECT 
USING (user_id = auth.uid());

-- Пользователи могут создавать свои записи
CREATE POLICY "Пользователи могут добавлять поставщиков" 
ON catalog_user_suppliers FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Пользователи могут редактировать свои записи
CREATE POLICY "Пользователи могут редактировать свои записи" 
ON catalog_user_suppliers FOR UPDATE 
USING (user_id = auth.uid());

-- Пользователи могут удалять свои записи
CREATE POLICY "Пользователи могут удалять свои записи" 
ON catalog_user_suppliers FOR DELETE 
USING (user_id = auth.uid());
```

### 📦 **Для товаров:**
```sql
-- Аналогичные политики для catalog_verified_products и catalog_user_products
-- с привязкой к соответствующим поставщикам
```

---

## 🔄 **ЛОГИКА ИМПОРТА ПОСТАВЩИКОВ**

### **Функция добавления из каталога Get2B:**
```typescript
async function importSupplierFromCatalog(
  verifiedSupplierId: string, 
  userId: string
): Promise<string> {
  
  // 1. Получить данные из аккредитованного каталога
  const { data: verifiedSupplier } = await supabase
    .from('catalog_verified_suppliers')
    .select('*')
    .eq('id', verifiedSupplierId)
    .single()
  
  if (!verifiedSupplier) throw new Error('Поставщик не найден')
  
  // 2. Проверить, нет ли уже такого поставщика у пользователя
  const { data: existing } = await supabase
    .from('catalog_user_suppliers')
    .select('id')
    .eq('user_id', userId)
    .eq('source_supplier_id', verifiedSupplierId)
    .single()
  
  if (existing) throw new Error('Поставщик уже добавлен в ваш список')
  
  // 3. Создать копию в личном каталоге пользователя
  const { data: userSupplier } = await supabase
    .from('catalog_user_suppliers')
    .insert({
      user_id: userId,
      name: verifiedSupplier.name,
      company_name: verifiedSupplier.company_name,
      category: verifiedSupplier.category,
      country: verifiedSupplier.country,
      city: verifiedSupplier.city,
      description: verifiedSupplier.description,
      logo_url: verifiedSupplier.logo_url,
      contact_email: verifiedSupplier.contact_email,
      contact_phone: verifiedSupplier.contact_phone,
      website: verifiedSupplier.website,
      contact_person: verifiedSupplier.contact_person,
      min_order: verifiedSupplier.min_order,
      response_time: verifiedSupplier.response_time,
      employees: verifiedSupplier.employees,
      established: verifiedSupplier.established,
      certifications: verifiedSupplier.certifications,
      specialties: verifiedSupplier.specialties,
      payment_methods: verifiedSupplier.payment_methods,
      source_type: 'imported_from_catalog',
      source_supplier_id: verifiedSupplierId,
      import_date: new Date().toISOString(),
      is_active: true
    })
    .select()
    .single()
  
  // 4. Скопировать товары (опционально)
  const { data: verifiedProducts } = await supabase
    .from('catalog_verified_products')
    .select('*')
    .eq('supplier_id', verifiedSupplierId)
    .eq('in_stock', true)
  
  if (verifiedProducts && verifiedProducts.length > 0) {
    const userProducts = verifiedProducts.map(product => ({
      supplier_id: userSupplier.id,
      user_id: userId,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      currency: product.currency,
      min_order: product.min_order,
      images: product.images,
      specifications: product.specifications,
      in_stock: product.in_stock,
      sku: product.sku
    }))
    
    await supabase
      .from('catalog_user_products')
      .insert(userProducts)
  }
  
  return userSupplier.id
}
```

---

## 🔧 **ОБНОВЛЕННЫЕ API ENDPOINTS**

### 🧡 **Аккредитованные поставщики:**
```typescript
// GET /api/catalog/verified-suppliers
// POST /api/catalog/verified-suppliers (только для менеджеров)
// PATCH /api/catalog/verified-suppliers/:id (только для менеджеров)
// DELETE /api/catalog/verified-suppliers/:id (только для менеджеров)
```

### 🔵 **Личные поставщики:**
```typescript
// GET /api/catalog/user-suppliers (только свои)
// POST /api/catalog/user-suppliers
// PATCH /api/catalog/user-suppliers/:id (только свои)
// DELETE /api/catalog/user-suppliers/:id (только свои)
// POST /api/catalog/user-suppliers/import/:verifiedId (импорт из каталога)
```

---

## 🚀 **ПЛАН МИГРАЦИИ**

### **Этап 1: Создание новых таблиц**
1. Создать `catalog_verified_suppliers`
2. Создать `catalog_user_suppliers`
3. Создать `catalog_verified_products`
4. Создать `catalog_user_products`
5. Настроить RLS политики

### **Этап 2: Миграция данных**
1. Перенести статичные данные `CATALOG_SUPPLIERS` → `catalog_verified_suppliers`
2. Перенести пользовательские данные `catalog_suppliers` → `catalog_user_suppliers`
3. Обновить товары соответственно

### **Этап 3: Обновление кода**
1. Обновить API endpoints
2. Обновить интерфейс каталога
3. Обновить функцию импорта
4. Тестирование

### **Этап 4: Удаление старой таблицы**
1. Убедиться что все работает
2. Удалить `catalog_suppliers`
3. Обновить документацию

---

## ✅ **ПРЕИМУЩЕСТВА НОВОЙ АРХИТЕКТУРЫ**

1. **🔐 Безопасность** - четкое разделение доступа
2. **📈 Масштабируемость** - каждая таблица для своей цели
3. **🎯 Простота** - понятная логика для разработчиков
4. **🔄 Гибкость** - легко добавлять новые функции
5. **⚡ Производительность** - оптимизированные запросы
6. **🛡️ Надежность** - меньше ошибок в RLS политиках

**Эта архитектура решает все проблемы V1.0 и готова к масштабированию!** 🚀 