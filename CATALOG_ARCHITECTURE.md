# 🏪 АРХИТЕКТУРА КАТАЛОГА ПОСТАВЩИКОВ V1.0 (УСТАРЕЛА)

## ⚠️ **КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ**
**Эта архитектура имеет серьезные недостатки и заменена на V2.0**
**Дата устаревания: 29 декабря 2024**
**Новая архитектура: CATALOG_ARCHITECTURE_V2.md**

### ❌ **Проблемы текущей архитектуры:**
- **Одна таблица для двух целей** - смешивание пользовательских и административных данных
- **Проблемы безопасности** - сложные RLS политики, пользователи могут видеть чужие данные
- **Сложность масштабирования** - нет четкого разделения ответственности
- **Путаница в коде** - одни API для разных типов данных

---

## 🎯 **ОСНОВНАЯ ФИЛОСОФИЯ (УСТАРЕЛА)**
**"Каталог - это мост между поиском и созданием проекта в рамках единой логики 7 шагов"**

---

## 📋 **1. КОНЦЕПЦИЯ КАТАЛОГА**

### 🔄 **1.1 Два Режима Работы**
```typescript
interface CatalogModes {
  // 🔵 Личные поставщики пользователя
  clients: {
    source: 'supplier_profiles',
    color: 'blue',
    features: ['personal', 'history', 'analytics']
  }
  
  // 🟠 Глобальный каталог Get2B
  catalog: {
    source: 'catalog_suppliers',
    color: 'orange', 
    features: ['verified', 'moderated', 'global']
  }
}
```

### 🔗 **1.2 Интеграция с 7 Шагами**
```
Каталог → Выбор поставщика → Step1 (Компания) → Step2 (Спецификация из каталога товаров)
```

---

## 🗂️ **2. СТРУКТУРА БАЗЫ ДАННЫХ**

### 📊 **2.1 Основные Таблицы (СУЩЕСТВУЮТ)**
```sql
-- ✅ Таблица поставщиков каталога (УЖЕ ЕСТЬ)
catalog_suppliers {
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  company_name text,
  category text NOT NULL,
  country text NOT NULL,
  city text,
  description text,
  email text,
  phone text,
  website text,
  contact_person text,
  min_order text,
  response_time text,
  employees text,
  established text,
  certifications jsonb,
  specialties jsonb,
  payment_methods jsonb,
  bank_data jsonb,
  
  -- Статус модерации
  status text DEFAULT 'pending', -- pending, approved, rejected
  verified boolean DEFAULT false,
  trending boolean DEFAULT false,
  active boolean DEFAULT true,
  
  -- Рейтинг и метрики
  rating decimal(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  projects_count integer DEFAULT 0,
  
  -- Временные метки
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
}

-- ✅ Таблица товаров каталога (УЖЕ ЕСТЬ)  
catalog_products {
  id uuid PRIMARY KEY,
  supplier_id uuid REFERENCES catalog_suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price decimal(12,2),
  currency text DEFAULT 'USD',
  min_order text,
  images jsonb, -- массив URL изображений из Storage
  specifications jsonb,
  in_stock boolean DEFAULT true,
  sku text,
  
  -- Временные метки
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
}

-- ✅ Supabase Storage Buckets (УЖЕ НАСТРОЕНЫ)
storage.buckets:
- company-logos (Public) - логотипы компаний поставщиков
- product-catalogs (Public) - каталоги товаров в PDF
- product-images (Public) - изображения товаров 
- supplier-images (Public) - дополнительные изображения поставщиков
```

### 🔗 **2.2 Связь с Проектами (НУЖНО ДОБАВИТЬ)**
```sql
-- Добавить в таблицу projects поля для связи с каталогом
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES catalog_suppliers(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supplier_type text; -- 'catalog' | 'personal'
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supplier_data jsonb; -- кэш данных поставщика
```

---

## 🔄 **3. ЛОГИКА ИНТЕГРАЦИИ С 7 ШАГАМИ**

### 🚀 **3.1 Сценарий: "Каталог → Проект"**
```typescript
// Пользователь выбирает поставщика из каталога
function selectSupplierFromCatalog(supplier: CatalogSupplier) {
  // 1. Создать проект с привязкой к поставщику
  const projectData = {
    supplier_id: supplier.id,
    supplier_type: 'catalog',
    supplier_data: {
      name: supplier.name,
      country: supplier.country,
      min_order: supplier.min_order,
      contact: supplier.email
    },
    status: 'draft',
    current_step: 1
  }
  
  // 2. Перенаправить на Step1 с предзаполненными данными поставщика
  router.push(`/dashboard/create-project?supplierId=${supplier.id}&mode=catalog`)
}
```

### 📝 **3.2 Step1: Интеграция с Поставщиком**
```typescript
// В Step1CompanyForm добавить логику поставщика
useEffect(() => {
  if (supplierId && mode === 'catalog') {
    // Загрузить данные поставщика
    const supplier = await fetchCatalogSupplier(supplierId)
    
    // Предзаполнить некоторые поля
    setCompanyData(prev => ({
      ...prev,
      supplier_name: supplier.name,
      supplier_country: supplier.country,
      supplier_contact: supplier.email
    }))
    
    // Сохранить связь в проекте
    await updateProject(projectId, {
      supplier_id: supplierId,
      supplier_type: 'catalog',
      supplier_data: supplier
    })
  }
}, [supplierId, mode])
```

### 📋 **3.3 Step2: Спецификация из Каталога**
```typescript
// В Step2SpecificationForm добавить источник товаров
const [productSource, setProductSource] = useState<'manual' | 'catalog'>('manual')

const loadCatalogProducts = async () => {
  if (projectData.supplier_id) {
    const products = await supabase
      .from('catalog_products')
      .select('*')
      .eq('supplier_id', projectData.supplier_id)
      .eq('in_stock', true)
    
    setAvailableProducts(products.data || [])
  }
}

const addProductFromCatalog = (product: CatalogProduct) => {
  const specItem = {
    item_name: product.name,
    description: product.description,
    quantity: 1,
    price: product.price,
    currency: product.currency,
    sku: product.sku,
    specifications: product.specifications,
    source: 'catalog',
    catalog_product_id: product.id
  }
  
  addSpecificationItem(specItem)
}
```

---

## 🤖 **4. СИСТЕМА МОДЕРАЦИИ**

### 📨 **4.1 Telegram Модерация**
```typescript
// Отправка на модерацию нового поставщика
async function submitSupplierForModeration(supplierId: string) {
  const supplier = await fetchSupplier(supplierId)
  
  // Отправить в Telegram с кнопками
  await sendTelegramMessage({
    chat_id: MANAGER_CHAT_ID,
    text: `🏪 Новый поставщик на модерацию:
    
📍 ${supplier.name} (${supplier.country})
🏢 ${supplier.company_name}
📧 ${supplier.email}
📱 ${supplier.phone}
🌐 ${supplier.website}

📝 Описание: ${supplier.description}
💰 Минимальный заказ: ${supplier.min_order}
⏱️ Время ответа: ${supplier.response_time}`,
    
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Одобрить', callback_data: `approve_supplier_${supplierId}` },
        { text: '❌ Отклонить', callback_data: `reject_supplier_${supplierId}` }
      ]]
    }
  })
}
```

### 🔄 **4.2 Webhook Обработка**
```typescript
// В /api/telegram-webhook/route.ts
if (callback_data.startsWith('approve_supplier_')) {
  const supplierId = callback_data.replace('approve_supplier_', '')
  
  // Одобрить поставщика
  await supabase
    .from('catalog_suppliers')
    .update({ 
      status: 'approved', 
      verified: true,
      active: true 
    })
    .eq('id', supplierId)
  
  // Уведомить пользователя
  const supplier = await fetchSupplier(supplierId)
  await sendTelegramMessage({
    chat_id: supplier.user_id, // если у нас есть Telegram ID пользователя
    text: `🎉 Ваш поставщик "${supplier.name}" одобрен и добавлен в каталог Get2B!`
  })
}
```

---

## 📡 **5. API ЭНДПОИНТЫ**

### 🔍 **5.1 Получение Поставщиков**
```typescript
// GET /api/catalog/suppliers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const country = searchParams.get('country')
  const verified = searchParams.get('verified')
  
  let query = supabase
    .from('catalog_suppliers')
    .select(`
      *,
      catalog_products (
        id, name, price, currency, in_stock
      )
    `)
    .eq('active', true)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  
  if (country) {
    query = query.eq('country', country)
  }
  
  if (verified === 'true') {
    query = query.eq('verified', true)
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ suppliers: data })
}
```

### ➕ **5.2 Добавление Поставщика**
```typescript
// POST /api/catalog/suppliers  
export async function POST(request: Request) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const supplierData = await request.json()
  
  const { data, error } = await supabase
    .from('catalog_suppliers')
    .insert([{
      ...supplierData,
      user_id: user.id,
      status: 'pending', // отправить на модерацию
      verified: false,
      active: false
    }])
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // Отправить на модерацию в Telegram
  await submitSupplierForModeration(data.id)
  
  return NextResponse.json({ supplier: data })
}
```

---

## 🎨 **6. КОМПОНЕНТЫ ИНТЕРФЕЙСА**

### 🏪 **6.1 CatalogPage (УЖЕ ЕСТЬ)**
```typescript
// Два режима: личные поставщики + глобальный каталог
const [activeMode, setActiveMode] = useState<'clients' | 'catalog'>('clients')

// Кнопка "Начать проект" интегрирована с 7 шагами
const handleStartProject = (supplier: CatalogSupplier) => {
  router.push(`/dashboard/create-project?supplierId=${supplier.id}&mode=catalog`)
}
```

### ➕ **6.2 AddSupplierModal (УЖЕ ЕСТЬ)**
```typescript
// 6-шаговая форма добавления поставщика
// Отправка на модерацию после заполнения
// Интеграция с API /catalog/suppliers
```

### 🔍 **6.3 SupplierSelector (НУЖНО СОЗДАТЬ)**
```typescript
// Компонент для выбора поставщика в Step2
interface SupplierSelectorProps {
  projectId: string
  onSupplierSelect: (supplier: CatalogSupplier) => void
  selectedSupplierId?: string
}
```

---

## 🔧 **7. ХУКИ И УТИЛИТЫ**

### 📊 **7.1 useCatalogSuppliers**
```typescript
export function useCatalogSuppliers(filters?: {
  category?: string
  country?: string
  verified?: boolean
}) {
  const [suppliers, setSuppliers] = useState<CatalogSupplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchSuppliers = async () => {
    setLoading(true)
    const queryParams = new URLSearchParams()
    if (filters?.category) queryParams.set('category', filters.category)
    if (filters?.country) queryParams.set('country', filters.country)
    if (filters?.verified) queryParams.set('verified', 'true')
    
    const response = await fetch(`/api/catalog/suppliers?${queryParams}`)
    const data = await response.json()
    
    if (data.error) {
      setError(data.error)
    } else {
      setSuppliers(data.suppliers)
      setError(null)
    }
    setLoading(false)
  }
  
  useEffect(() => {
    fetchSuppliers()
  }, [filters])
  
  return { suppliers, loading, error, refetch: fetchSuppliers }
}
```

### 🛒 **7.2 useCatalogProducts**
```typescript
export function useCatalogProducts(supplierId: string | null) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchProducts = async () => {
    if (!supplierId) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      setError(error.message)
    } else {
      setProducts(data || [])
      setError(null)
    }
    setLoading(false)
  }
  
  useEffect(() => {
    fetchProducts()
  }, [supplierId])
  
  return { products, loading, error, refetch: fetchProducts }
}
```

---

## 🛡️ **8. RLS ПОЛИТИКИ БЕЗОПАСНОСТИ**

### 🔒 **8.1 catalog_suppliers**
```sql
-- Чтение: все могут видеть одобренных поставщиков
CREATE POLICY "Публичное чтение одобренных поставщиков" ON catalog_suppliers
  FOR SELECT USING (status = 'approved' AND active = true);

-- Создание: авторизованные пользователи могут добавлять
CREATE POLICY "Пользователи могут добавлять поставщиков" ON catalog_suppliers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Обновление: только свои записи
CREATE POLICY "Пользователи могут редактировать свои записи" ON catalog_suppliers
  FOR UPDATE USING (auth.uid() = user_id);
```

### 🔒 **8.2 catalog_products**
```sql
-- Чтение: все могут видеть товары одобренных поставщиков
CREATE POLICY "Публичное чтение товаров" ON catalog_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM catalog_suppliers 
      WHERE id = catalog_products.supplier_id 
      AND status = 'approved' 
      AND active = true
    )
  );

-- Создание/обновление: только владельцы поставщика
CREATE POLICY "Владельцы могут управлять товарами" ON catalog_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM catalog_suppliers 
      WHERE id = catalog_products.supplier_id 
      AND user_id = auth.uid()
    )
  );
```

---

## 🚀 **9. ПРЕИМУЩЕСТВА АРХИТЕКТУРЫ**

### ✅ **9.1 Соблюдение Принципов**
- **Единая логика** с 7 шагами ✅
- **Автосохранение** связи поставщика с проектом ✅
- **Telegram интеграция** для модерации ✅
- **RLS безопасность** для всех таблиц ✅
- **Типизация TypeScript** для всех данных ✅

### 🔄 **9.2 Интеграция с Существующим**
- **Не ломает** текущую логику создания проектов ✅
- **Дополняет** Step1 и Step2 новыми возможностями ✅
- **Использует** существующие компоненты и хуки ✅
- **Расширяет** CreateProjectContext ✅

### 📈 **9.3 Масштабируемость**
- **Модульная структура** - легко добавлять новые функции ✅
- **API-first подход** - готов для мобильных приложений ✅
- **Кэширование** данных поставщиков в проектах ✅
- **Метрики и аналитика** встроены в структуру ✅

---

## 🎯 **ЗАКЛЮЧЕНИЕ**

**Каталог поставщиков - это органичное расширение архитектуры 7 шагов, которое:**

🔹 **Сохраняет** всю существующую логику  
🔹 **Добавляет** новые возможности выбора поставщиков  
🔹 **Интегрируется** с каждым шагом создания проекта  
🔹 **Обеспечивает** качество через модерацию  
🔹 **Масштабируется** для будущих потребностей  

**Система готова к реализации!** 🚀

---

## 📊 **10. ТЕКУЩИЙ СТАТУС РЕАЛИЗАЦИИ**

### ✅ **10.1 Что УЖЕ РЕАЛИЗОВАНО (Декабрь 2024)**

#### **База данных:**
- ✅ Таблица `catalog_suppliers` - создана и работает
- ✅ Таблица `catalog_products` - создана и работает  
- ✅ API `/api/catalog/suppliers` - GET, POST, PATCH, DELETE
- ✅ API `/api/catalog/products` - GET, POST
- ✅ Supabase Storage buckets настроены:
  - `product-images` (Public) - для изображений товаров
  - `company-logos` (Public) - для логотипов
  - `product-catalogs` (Public) - для PDF каталогов
  - `supplier-images` (Public) - для доп. изображений

#### **Интерфейс:**
- ✅ Страница каталога `/dashboard/catalog` - полностью рабочая
- ✅ Два режима: "Ваши поставщики" (синие) + "Get2B каталог" (оранжевые)
- ✅ Модальное окно добавления поставщика - 7 шагов
- ✅ Форма товаров с загрузкой изображений в Storage
- ✅ Красивый 7-й шаг с превью всех данных и карточек товаров
- ✅ Валидация форм и обработка ошибок
- ✅ Адаптивный дизайн для всех устройств

#### **Функциональность:**
- ✅ Добавление поставщика через форму → сохранение в БД
- ✅ Загрузка изображений товаров в Supabase Storage
- ✅ Fallback на Base64 если Storage недоступен
- ✅ Категории и сертификации из справочника
- ✅ Универсальная форма реквизитов (банк/карта/крипта)
- ✅ Поиск и фильтрация поставщиков
- ✅ Отладочные компоненты для диагностики

### 🔄 **10.2 В ПРОЦЕССЕ РАЗРАБОТКИ**

#### **Интеграция с 7 шагами:**
- 🔄 Кнопка "НАЧАТЬ ПРОЕКТ" → создание проекта с привязкой к поставщику
- 🔄 Step1: предзаполнение данных из выбранного поставщика
- 🔄 Step2: выбор товаров из каталога поставщика
- 🔄 Сохранение `supplier_id` и `supplier_snapshot` в проектах

#### **Модерация:**
- 🔄 Telegram уведомления о новых поставщиках
- 🔄 Webhook обработка одобрения/отклонения
- 🔄 Статусы модерации в интерфейсе

### 📋 **10.3 ПЛАН ДОРАБОТОК**

#### **Приоритет 1 (Критично):**
- [ ] Связать кнопку "НАЧАТЬ ПРОЕКТ" с созданием проекта
- [ ] Добавить поля `supplier_id`, `supplier_type`, `supplier_data` в таблицу `projects`
- [ ] Реализовать предзаполнение Step1 из данных поставщика
- [ ] Добавить выбор товаров из каталога в Step2

#### **Приоритет 2 (Важно):**
- [ ] Настроить Telegram модерацию поставщиков
- [ ] Добавить фильтр по статусу модерации в каталоге
- [ ] Реализовать обновление данных поставщика
- [ ] Добавить метрики и аналитику

#### **Приоритет 3 (Желательно):**
- [ ] Система отзывов и рейтингов
- [ ] Расширенный поиск по товарам
- [ ] Экспорт каталога в PDF/Excel
- [ ] Мобильное приложение

### 🔧 **10.4 ТЕХНИЧЕСКИЕ ЗАМЕТКИ**

#### **Исправленные проблемы (Декабрь 2024):**
- ✅ Исправлено несоответствие полей `category` vs `category_id` в API
- ✅ Обновлены API endpoints для работы с `category` как текстовым полем
- ✅ Загрузка изображений товаров работает с существующим `product-images` bucket
- ✅ Fallback на Base64 при недоступности Storage
- ✅ Добавлены недостающие поля в таблицу `catalog_suppliers`:
  - `certifications` (jsonb) - массив сертификаций
  - `specialties` (jsonb) - массив специализаций
  - `payment_methods` (jsonb) - способы оплаты
  - `min_order`, `response_time`, `employees`, `established` (text)
  - `accreditation_status` (text) - статус модерации
  - `is_active` (boolean) - активность поставщика

#### **Текущие ограничения:**
- Категории жестко заданы в `CATEGORY_CERTIFICATIONS`
- Модерация пока только через логи (Telegram в разработке)
- Поле `category` используется как текст, а не ID (упрощенная версия)

#### **Производительность:**
- Все запросы к БД оптимизированы
- Изображения кэшируются браузером
- Lazy loading для больших списков товаров
- Дебаунс для поиска по поставщикам

#### **Безопасность:**
- RLS политики настроены для всех таблиц
- Валидация на клиенте и сервере
- Ограничения размера файлов (5MB)
- Проверка MIME типов изображений

---

## 🎯 **11. ЦЕНТРАЛЬНАЯ ЛОГИКА КАТАЛОГА**

### **Принципы разработки:**
1. **Каталог = Мост к 7 шагам** - любое действие ведет к созданию проекта
2. **Данные поставщика сохраняются в проекте** - для истории и независимости
3. **Модерация через Telegram** - быстро и удобно для менеджеров
4. **Fallback стратегии** - система работает даже при сбоях Storage
5. **Документация актуальна** - любые изменения фиксируются здесь

### **Файлы для отслеживания изменений:**
- `CATALOG_ARCHITECTURE.md` - техническая архитектура (этот файл)
- `CATALOG_STRATEGY.md` - бизнес-логика и философия
- `app/dashboard/catalog/page.tsx` - основной интерфейс
- `app/api/catalog/` - API endpoints
- `check-latest-suppliers.sql` - диагностические запросы

**Любые доработки каталога начинаются с обновления этой документации!** 📝 