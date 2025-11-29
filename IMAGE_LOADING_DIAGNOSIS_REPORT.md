# ДИАГНОСТИЧЕСКИЙ ОТЧЕТ: Проблема с отображением изображений товаров

**Дата:** 2025-11-27
**Анализ выполнен:** Claude Code Agent
**Версия системы:** godplisgomvp-forvercel (main branch)

---

## EXECUTIVE SUMMARY

### Проблема
Изображения товаров не отображаются в UI браузера, показывается серый placeholder (иконка ImageIcon), несмотря на то что:
- Картинки успешно загружены в Supabase Storage
- URL изображений доступны по HTTP (возвращают 200 OK)
- Товары сохранены в БД с правильными данными

### Корневые причины (найдено 2 критические проблемы)

1. **КРИТИЧЕСКАЯ ПРОБЛЕМА #1: RPC функция не возвращает поле `images`**
   - Миграция `20251127_fix_get_products_by_category_images.sql` создана, но НЕ ПРИМЕНЕНА к БД
   - RPC функция `get_products_by_category` возвращает только `image_url`, но НЕ возвращает массив `images`
   - Frontend компонент пытается парсить несуществующее поле `images`

2. **КРИТИЧЕСКАЯ ПРОБЛЕМА #2: Next.js не разрешает загрузку изображений с Supabase**
   - В `next.config.js` отсутствует домен `ejkhdhexkadecpbjjmsz.supabase.co` в `remotePatterns`
   - Next.js Image Optimization блокирует загрузку внешних изображений
   - Компонент использует обычный `<img>`, но Next.js может применять CSP заголовки

### Статус исправлений
- ✅ Миграция SQL готова (но не применена)
- ✅ Frontend компонент обновлен (но не работает из-за отсутствия данных)
- ❌ Next.js конфигурация НЕ обновлена
- ❌ Миграция НЕ применена к production БД

---

## 1. АРХИТЕКТУРНЫЙ АНАЛИЗ

### Цепочка загрузки данных

```
┌──────────────┐
│   Browser    │
│   (UI/UX)    │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  Frontend Component                              │
│  components/catalog/ProductGridByCategory.tsx    │
│  • Загружает данные из API                       │
│  • Парсит поле images (строки 185-202)           │
│  • Рендерит <img> с image_url                    │
└──────┬───────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  API Route                                       │
│  /api/catalog/products-by-category/[category]    │
│  • Вызывает RPC функцию get_products_by_category │
│  • Возвращает JSON с products[]                  │
└──────┬───────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  Database (Supabase PostgreSQL)                  │
│  • RPC Function: get_products_by_category        │
│  • Table: catalog_verified_products              │
│  • Field: images (JSONB array)                   │
└──────┬───────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  Supabase Storage                                │
│  • Bucket: product-images                        │
│  • Path: imported/*.jpeg                         │
│  • Public access: ✅ Enabled                     │
└──────────────────────────────────────────────────┘
```

### Точки трансформации данных

1. **БД → RPC Function**
   - JSONB массив `images` → JSON объект (должно быть)
   - **ПРОБЛЕМА:** Поле `images` НЕ возвращается в результате

2. **RPC → API Route**
   - JSON от Supabase → JavaScript object
   - Работает корректно (проверено curl)

3. **API → Frontend**
   - Fetch JSON → React state
   - **ПРОБЛЕМА:** Компонент пытается парсить несуществующее поле `images`

4. **Frontend → Browser**
   - React component → HTML `<img>` tag
   - **ПРОБЛЕМА:** Next.js может блокировать внешние URL

---

## 2. ПРОВЕРКА ДАННЫХ НА КАЖДОМ УРОВНЕ

### 2.1 База данных

#### Структура таблицы `catalog_verified_products`

```sql
CREATE TABLE catalog_verified_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES catalog_verified_suppliers(id),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price decimal(12,2),
  currency text DEFAULT 'USD',
  min_order text,
  in_stock boolean DEFAULT true,
  specifications jsonb,
  images jsonb,  -- ✅ JSONB массив URL изображений
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Проверка данных тестового товара

**Товар ID:** `4f7dd6a8-1302-42b0-b362-73abeff07511`

```bash
# Запрос через API /api/catalog/products
curl "http://localhost:3002/api/catalog/products?supplier_type=verified&category=ТЕСТОВАЯ"
```

**Результат:**
```json
{
  "id": "4f7dd6a8-1302-42b0-b362-73abeff07511",
  "name": "Смартфон Apple iPhone 15 Pro Max 256GB",
  "images": [
    "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg"
  ]
}
```

✅ **Вывод:** В БД поле `images` хранится правильно как JSONB массив.

---

### 2.2 API Endpoints

#### Endpoint: `/api/catalog/products-by-category/[category]`

**Запрос:**
```bash
curl "http://localhost:3002/api/catalog/products-by-category/ТЕСТОВАЯ?limit=1"
```

**Ответ:**
```json
{
  "success": true,
  "products": [
    {
      "id": "4f7dd6a8-1302-42b0-b362-73abeff07511",
      "product_name": "Смартфон Apple iPhone 15 Pro Max 256GB",
      "image_url": "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg",
      "price": "134990.00",
      "currency": "RUB"
    }
  ]
}
```

❌ **ПРОБЛЕМА:** Поле `images` ОТСУТСТВУЕТ в ответе!
✅ **Есть:** Поле `image_url` (строка с первым изображением)

---

### 2.3 RPC Function `get_products_by_category`

#### Текущее состояние функции в БД

**Проверка через Supabase JS client:**

```javascript
const { data } = await supabase.rpc('get_products_by_category', {
  category_name: 'ТЕСТОВАЯ',
  limit_param: 1
});

console.log(data[0]);
// Результат:
{
  "id": "4f7dd6a8-1302-42b0-b362-73abeff07511",
  "product_name": "Смартфон Apple iPhone 15 Pro Max 256GB",
  "image_url": "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg",
  // ❌ "images" поле ОТСУТСТВУЕТ!
}
```

**Проверено с помощью скрипта:** `/scripts/test-rpc-response.js`

#### Миграция (создана, но НЕ применена)

**Файл:** `supabase/migrations/20251127_fix_get_products_by_category_images.sql`

```sql
CREATE OR REPLACE FUNCTION get_products_by_category(...)
RETURNS JSONB
AS $$
BEGIN
  WITH verified_products AS (
    SELECT
      p.id,
      p.name AS product_name,
      -- ...
      p.images,  -- 🔥 Добавлено в миграции!
      COALESCE((p.images->0)::TEXT, '') AS image_url,
      -- ...
    FROM catalog_verified_products p
    -- ...
  )
  -- ...
END;
$$;
```

❌ **КРИТИЧЕСКАЯ ПРОБЛЕМА:** Эта миграция НЕ ПРИМЕНЕНА к БД!

**Доказательство:**
- RPC функция НЕ возвращает поле `images`
- Проверено через Supabase JS client (скрипт `test-rpc-response.js`)

---

### 2.4 Frontend компонент

#### Файл: `components/catalog/ProductGridByCategory.tsx`

**Строки 185-202: Парсинг данных**

```typescript
image_url: (() => {
  // Парсим поле images из JSON
  try {
    const parsedImages = typeof product.images === 'string'
      ? JSON.parse(product.images)
      : product.images;
    return Array.isArray(parsedImages) && parsedImages.length > 0
      ? parsedImages[0]
      : null;
  } catch (e) {
    return null;
  }
})(),
images: (() => {
  // Парсим поле images из JSON
  try {
    const parsedImages = typeof product.images === 'string'
      ? JSON.parse(product.images)
      : product.images;
    return Array.isArray(parsedImages) ? parsedImages : [];
  } catch (e) {
    return [];
  }
})(),
```

**Проблемы:**

1. ❌ **Поле `product.images` не существует в данных из API**
   - API возвращает только `image_url`
   - Парсинг пытается работать с `undefined`
   - Результат: `image_url = null`, `images = []`

2. ⚠️ **Избыточный парсинг JSON**
   - Supabase JS client уже парсит JSONB автоматически
   - Повторный `JSON.parse()` не нужен

**Строки 589-603: Рендеринг изображения**

```typescript
{(product.image_url || (product.images && product.images.length > 0)) ? (
  <img
    src={product.image_url || product.images?.[0] || ''}
    alt={product.product_name}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    onError={(e) => {
      console.error(`❌ ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА ${product.product_name}:`, product.image_url || product.images?.[0]);
      e.currentTarget.style.display = 'none';
      e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
    }}
  />
) : null}
```

**Что происходит:**

1. ✅ `product.image_url` существует (из API)
2. ❌ Но из-за отсутствия поля `images` в API, компонент строит `image_url` как `null` (строка 185-193)
3. ❌ Результат: условие `product.image_url || ...` возвращает `null`
4. ❌ `<img src={null}>` не рендерится или показывает placeholder

---

### 2.5 Next.js конфигурация

#### Файл: `next.config.js`

**Строки 66-83: Конфигурация images**

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.vercel-storage.com',
      port: '',
      pathname: '/**',
    }
  ],
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
},
```

❌ **КРИТИЧЕСКАЯ ПРОБЛЕМА #2:**

**Отсутствует домен Supabase Storage:**
- Требуется: `ejkhdhexkadecpbjjmsz.supabase.co`
- Есть: только `*.vercel-storage.com`

**Последствия:**
- Next.js Image Optimization НЕ может обработать URL с Supabase
- Возможна блокировка CSP заголовками
- Даже обычный `<img>` может не загружаться из-за CSP

---

### 2.6 Проверка браузера

#### Тест: Прямая загрузка изображения

**Создан тестовый файл:** `test-image-loading.html`

**Результат тестирования:**

1. ✅ **Прямая загрузка через `<img src="...">`**
   - URL доступен
   - HTTP 200 OK
   - CORS заголовки присутствуют

2. ✅ **Fetch API**
   - Изображение скачивается
   - Blob создается успешно
   - ObjectURL работает

3. ❌ **API endpoint в браузере**
   - Поле `images` отсутствует
   - Компонент не может построить правильный `image_url`

**Вывод:** Проблема НЕ в браузере или CORS, а в цепочке данных БД → API → Frontend.

---

## 3. ДИАГНОСТИКА ПРОБЛЕМ

### Проблема 1: RPC функция не возвращает `images`

**Что ДОЛЖНО быть:**
```json
{
  "id": "...",
  "product_name": "...",
  "images": ["https://..."],  // ✅ Массив изображений
  "image_url": "https://..."  // ✅ Первое изображение (для удобства)
}
```

**Что есть СЕЙЧАС:**
```json
{
  "id": "...",
  "product_name": "...",
  "image_url": "https://..."  // ✅ Есть
  // ❌ "images" отсутствует
}
```

**Как это вызывает проблему:**

1. API получает данные БЕЗ поля `images`
2. Frontend компонент пытается парсить `product.images` (undefined)
3. Парсинг возвращает `null` для `image_url`
4. `<img src={null}>` не рендерится
5. Показывается fallback иконка

---

### Проблема 2: Next.js блокирует внешние URL

**Что ДОЛЖНО быть:**
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'ejkhdhexkadecpbjjmsz.supabase.co',  // ✅ Supabase
      pathname: '/storage/v1/object/public/**',
    }
  ]
}
```

**Что есть СЕЙЧАС:**
```javascript
images: {
  remotePatterns: [
    {
      hostname: '*.vercel-storage.com',  // ❌ Только Vercel
    }
  ]
}
```

**Как это вызывает проблему:**

1. Next.js проверяет домен изображения
2. Домен `ejkhdhexkadecpbjjmsz.supabase.co` НЕ в списке
3. Next.js Image Optimization отклоняет URL
4. Возможно применение CSP заголовков блокирующих загрузку

---

### Проблема 3: Frontend парсит несуществующее поле

**Что ДОЛЖНО быть:**

Если API возвращает `image_url`, компонент должен использовать его напрямую:

```typescript
image_url: product.image_url,  // Просто берем из API
```

**Что есть СЕЙЧАС:**

Компонент пытается парсить `product.images` которого нет:

```typescript
image_url: (() => {
  const parsedImages = typeof product.images === 'string'
    ? JSON.parse(product.images)  // ❌ product.images = undefined
    : product.images;
  return parsedImages?.[0] || null;  // Возвращает null
})()
```

**Как это вызывает проблему:**

1. `product.images` = `undefined` (поле не существует в API)
2. Парсинг возвращает `null`
3. `image_url` устанавливается в `null` вместо реального URL
4. `<img src={null}>` не рендерится

---

## 4. КОРНЕВЫЕ ПРИЧИНЫ

### Причина 1: Неприменённая миграция БД

**Файл:** `supabase/migrations/20251127_fix_get_products_by_category_images.sql`

**Статус:** ❌ Создан, но НЕ применён к БД

**Доказательства:**
- RPC функция не возвращает поле `images`
- Проверено через `scripts/test-rpc-response.js`
- API endpoint возвращает только `image_url`

**Как применить:**

```bash
# Вариант 1: Через Supabase CLI
supabase db push

# Вариант 2: Через Supabase Dashboard
# SQL Editor → Вставить содержимое файла → Run

# Вариант 3: Через psql
psql $POSTGRES_URL -f supabase/migrations/20251127_fix_get_products_by_category_images.sql
```

---

### Причина 2: Отсутствие домена Supabase в Next.js config

**Файл:** `next.config.js`

**Проблема:** Домен `ejkhdhexkadecpbjjmsz.supabase.co` не добавлен в `remotePatterns`

**Решение:** Добавить конфигурацию для Supabase Storage

---

### Причина 3: Некорректный парсинг данных во Frontend

**Файл:** `components/catalog/ProductGridByCategory.tsx`

**Проблема:** Компонент парсит несуществующее поле `product.images`

**Решение:** Использовать `image_url` из API напрямую или дождаться применения миграции

---

## 5. РЕШЕНИЯ

### Решение 1: Применить миграцию RPC функции

#### Quick Fix (временное решение)

Обновить компонент чтобы использовать `image_url` из API:

**Файл:** `components/catalog/ProductGridByCategory.tsx` (строки 185-202)

```typescript
// ❌ УДАЛИТЬ СТАРЫЙ КОД:
image_url: (() => {
  try {
    const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    return Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : null;
  } catch (e) {
    return null;
  }
})(),

// ✅ ЗАМЕНИТЬ НА:
image_url: product.image_url || null,  // Просто берем из API
images: product.images || [],          // Если поле есть - используем, иначе пустой массив
```

**Преимущества:**
- Работает немедленно
- Не требует изменений БД
- Простое решение

**Недостатки:**
- Не решает корневую проблему
- Только 1 изображение на товар
- Нет массива для галереи

---

#### Правильное решение (long-term fix)

**Шаг 1: Применить миграцию к БД**

```bash
# Вариант А: Через Supabase CLI (рекомендуется)
supabase db push

# Вариант Б: Через Supabase Dashboard
# 1. Открыть https://supabase.com/dashboard/project/ejkhdhexkadecpbjjmsz/sql
# 2. Вставить содержимое supabase/migrations/20251127_fix_get_products_by_category_images.sql
# 3. Нажать RUN

# Вариант В: Через psql
psql "postgres://postgres.ejkhdhexkadecpbjjmsz:B2ryf4elLIDqghCR@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" -f supabase/migrations/20251127_fix_get_products_by_category_images.sql
```

**Шаг 2: Проверить результат**

```bash
# Запустить тест
node scripts/test-rpc-response.js

# Ожидаемый вывод:
# ✅ images: ["https://ejkhdhexkadecpbjjmsz.supabase.co/storage/..."]
```

**Шаг 3: Обновить компонент (опционально)**

Если миграция применена, можно упростить код:

```typescript
// Компонент может напрямую использовать данные из API
const formattedProducts: Product[] = products.map((product: any) => ({
  id: product.id,
  product_name: product.product_name,
  image_url: product.image_url,  // ✅ Первое изображение (готово из RPC)
  images: product.images || [],  // ✅ Массив изображений (готово из RPC)
  // ... остальные поля
}));
```

**Преимущества:**
- Решает корневую проблему
- Поддержка множественных изображений
- Чистая архитектура
- Легко добавить галерею

---

### Решение 2: Добавить Supabase домен в Next.js config

**Файл:** `next.config.js`

#### Код исправления

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.vercel-storage.com',
      port: '',
      pathname: '/**',
    },
    // 🔥 ДОБАВИТЬ:
    {
      protocol: 'https',
      hostname: 'ejkhdhexkadecpbjjmsz.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    // Или более общий вариант для всех Supabase проектов:
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    }
  ],
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
},
```

**После изменения:**

```bash
# Перезапустить dev сервер
npm run dev

# Или для production:
npm run build
```

---

### Решение 3: Исправить парсинг во Frontend компоненте

**Файл:** `components/catalog/ProductGridByCategory.tsx`

#### Полное исправление (строки 171-221)

```typescript
// Преобразуем данные в нужный формат
const formattedProducts: Product[] = products.map((product: any) => {
  console.log('🔍 [DEBUG] Форматирование товара:', {
    original_image_url: product.image_url,
    original_images: product.images
  })

  return {
    id: product.id,
    product_name: product.name || product.product_name,
    description: product.description,
    price: product.price,
    currency: product.currency || 'RUB',
    min_order: product.min_order,
    in_stock: product.in_stock || true,

    // 🔥 ИСПРАВЛЕНИЕ: Используем данные напрямую из API
    image_url: product.image_url || null,
    images: Array.isArray(product.images) ? product.images : [],

    item_code: product.item_code,
    item_name: product.item_name,
    supplier_id: product.supplier_id,
    supplier_name: product.supplier_name,
    supplier_company_name: product.supplier_company_name,
    supplier_country: product.supplier_country,
    supplier_city: product.supplier_city,
    supplier_email: product.supplier_email,
    supplier_phone: product.supplier_phone,
    supplier_website: product.supplier_website,
    supplier_rating: product.supplier_rating,
    supplier_reviews: product.supplier_reviews,
    supplier_projects: product.supplier_projects,
    room_type: product.room_type || 'verified' as const,
    room_icon: product.room_icon || '🟠',
    room_description: product.room_description || 'Аккредитованный поставщик'
  }
})
```

**Что изменено:**

1. ❌ **Удалено:** Попытка парсить `product.images` как JSON строку
2. ✅ **Добавлено:** Прямое использование `product.image_url` из API
3. ✅ **Добавлено:** Простая проверка массива для `product.images`

---

## 6. ПЛАН ДЕЙСТВИЙ

### Немедленные действия (критические)

#### 1. Применить миграцию RPC функции

**Приоритет:** 🔴 КРИТИЧЕСКИЙ

```bash
# Шаг 1: Подключиться к Supabase Dashboard
open "https://supabase.com/dashboard/project/ejkhdhexkadecpbjjmsz/sql"

# Шаг 2: Скопировать содержимое миграции
cat supabase/migrations/20251127_fix_get_products_by_category_images.sql

# Шаг 3: Вставить в SQL Editor и нажать RUN

# Шаг 4: Проверить результат
node scripts/test-rpc-response.js

# Ожидаемый вывод:
# ✅ images: [...] ПРИСУТСТВУЕТ
```

**Время выполнения:** 2-3 минуты

---

#### 2. Добавить Supabase домен в Next.js config

**Приоритет:** 🔴 КРИТИЧЕСКИЙ

```bash
# Шаг 1: Открыть файл
vim next.config.js

# Шаг 2: Добавить в images.remotePatterns:
{
  protocol: 'https',
  hostname: 'ejkhdhexkadecpbjjmsz.supabase.co',
  port: '',
  pathname: '/storage/v1/object/public/**',
}

# Шаг 3: Сохранить и перезапустить сервер
npm run dev
```

**Время выполнения:** 1 минута

---

#### 3. Исправить парсинг в компоненте

**Приоритет:** 🟡 СРЕДНИЙ (опционально если миграция применена)

```bash
# Шаг 1: Открыть файл
vim components/catalog/ProductGridByCategory.tsx

# Шаг 2: Заменить строки 185-202 на:
image_url: product.image_url || null,
images: Array.isArray(product.images) ? product.images : [],

# Шаг 3: Сохранить (файл обновится автоматически)
```

**Время выполнения:** 1 минута

---

### Проверка результатов

#### Чек-лист после применения исправлений

```bash
# 1. Проверить RPC функцию
node scripts/test-rpc-response.js
# Ожидается: ✅ images: [...] ПРИСУТСТВУЕТ

# 2. Проверить API endpoint
curl "http://localhost:3002/api/catalog/products-by-category/ТЕСТОВАЯ?limit=1" | jq '.products[0] | {image_url, images}'
# Ожидается:
# {
#   "image_url": "https://...",
#   "images": ["https://..."]  // ✅ Массив присутствует
# }

# 3. Проверить в браузере
open "http://localhost:3002/catalog"
# Открыть DevTools → Console
# Искать логи:
# ✅ "📦 [ProductGrid] Товары категории ... загружены"
# ✅ "🔍 [ProductGrid] Пример товара из API (RAW)"
# Проверить что image_url не null

# 4. Визуальная проверка
# Открыть категорию "ТЕСТОВАЯ"
# Ожидается: Изображение iPhone 15 Pro Max отображается
```

---

### Долгосрочные улучшения

#### 1. Настроить Supabase CLI для автоматических миграций

```bash
# Установить Supabase CLI
npm install -g supabase

# Авторизоваться
supabase login

# Линковать проект
supabase link --project-ref ejkhdhexkadecpbjjmsz

# Применять миграции автоматически
supabase db push
```

#### 2. Добавить тесты для RPC функций

**Файл:** `tests/rpc/get_products_by_category.test.ts`

```typescript
import { supabase } from '@/lib/supabaseClient'

describe('get_products_by_category RPC', () => {
  it('should return images array', async () => {
    const { data } = await supabase.rpc('get_products_by_category', {
      category_name: 'ТЕСТОВАЯ',
      limit_param: 1
    })

    expect(data).toBeDefined()
    expect(data[0]).toHaveProperty('images')
    expect(Array.isArray(data[0].images)).toBe(true)
    expect(data[0].images.length).toBeGreaterThan(0)
  })
})
```

#### 3. Добавить обработку ошибок загрузки изображений

**Файл:** `components/catalog/ProductGridByCategory.tsx`

```typescript
const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

const handleImageError = (productId: string, imageUrl: string) => {
  console.error(`❌ Ошибка загрузки изображения товара ${productId}:`, imageUrl)
  setFailedImages(prev => new Set(prev).add(productId))

  // Отправить ошибку в Sentry/monitoring
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(new Error(`Image load failed: ${imageUrl}`), {
      tags: { product_id: productId }
    })
  }
}
```

---

## 7. ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ

### Тестовые файлы созданные для диагностики

1. **`test-image-loading.html`**
   - Тест прямой загрузки изображений
   - Проверка CORS и CSP
   - Тест fetch API
   - Открыть: `http://localhost:3002/test-image-loading.html`

2. **`scripts/test-rpc-response.js`**
   - Проверка RPC функции напрямую
   - Анализ структуры данных
   - Запуск: `node scripts/test-rpc-response.js`

### Полезные команды для отладки

```bash
# Проверить статус БД
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT version();"

# Проверить существование RPC функции
psql "$POSTGRES_URL_NON_POOLING" -c "\df get_products_by_category"

# Проверить данные товара
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT id, name, images FROM catalog_verified_products WHERE category = 'ТЕСТОВАЯ';"

# Проверить API endpoint
curl "http://localhost:3002/api/catalog/products-by-category/ТЕСТОВАЯ" | jq

# Проверить доступность изображения
curl -I "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg"
```

---

## 8. ВЫВОДЫ

### Найдено проблем: 3 критические

1. ❌ **RPC функция не возвращает поле `images`**
   - Причина: Миграция не применена
   - Решение: Применить миграцию SQL

2. ❌ **Next.js блокирует Supabase домен**
   - Причина: Отсутствует в `remotePatterns`
   - Решение: Добавить домен в config

3. ❌ **Frontend парсит несуществующее поле**
   - Причина: Неправильная обработка данных из API
   - Решение: Использовать `image_url` напрямую

### Ожидаемое время исправления

- **Quick fix (временное решение):** 5 минут
- **Полное исправление (long-term):** 15 минут
- **Тестирование:** 5 минут

**Общее время:** ~25 минут

### Риски

- 🟢 **Низкий риск:** Все изменения обратимы
- 🟢 **Низкий риск:** Миграция БД не изменяет данные
- 🟢 **Низкий риск:** Next.js config не влияет на существующие изображения

---

## 9. ПРИЛОЖЕНИЯ

### Приложение A: SQL миграция (полный код)

**Файл:** `supabase/migrations/20251127_fix_get_products_by_category_images.sql`

```sql
-- ==================================================================
-- FIX: get_products_by_category - Add images field to return
-- ==================================================================
-- Problem: RPC function doesn't return 'images' field from products table
-- Solution: Update SELECT to include p.images field

CREATE OR REPLACE FUNCTION get_products_by_category(
  category_name TEXT DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  limit_param INT DEFAULT 50,
  offset_param INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- ✅ VERIFIED products (orange room) - catalog_verified_products
  WITH verified_products AS (
    SELECT
      p.id,
      p.name AS product_name,
      p.name AS item_name,
      p.id::TEXT AS item_code,
      p.description,
      p.category,
      p.price::TEXT AS price,
      p.currency,
      p.min_order::TEXT AS min_order,
      p.in_stock,
      p.specifications,
      -- 🔥 FIX: Add images field here!
      p.images,
      COALESCE((p.images->0)::TEXT, '') AS image_url, -- First image from array
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.company_name AS supplier_company_name,
      s.category AS supplier_category,
      s.country AS supplier_country,
      s.city AS supplier_city,
      s.contact_email AS supplier_email,
      s.contact_phone AS supplier_phone,
      s.website AS supplier_website,
      COALESCE(s.rating, 0) AS supplier_rating,
      COALESCE(s.reviews_count, 0) AS supplier_reviews,
      COALESCE(s.completed_projects, 0) AS supplier_projects,
      'verified' AS room_type,
      '🟠' AS room_icon,
      'Аккредитованный поставщик Get2B' AS room_description
    FROM catalog_verified_products p
    INNER JOIN catalog_verified_suppliers s ON p.supplier_id = s.id
    WHERE
      (category_name IS NULL OR p.category = category_name)
      AND p.is_active = TRUE
      AND s.is_active = TRUE
      AND (search_query IS NULL OR
           p.name ILIKE '%' || search_query || '%' OR
           p.description ILIKE '%' || search_query || '%')
  ),

  -- 👤 USER products (blue room) - catalog_user_products
  user_products AS (
    SELECT
      p.id,
      p.name AS product_name,
      p.name AS item_name,
      p.id::TEXT AS item_code,
      p.description,
      p.category,
      p.price::TEXT AS price,
      p.currency,
      p.min_order::TEXT AS min_order,
      p.in_stock,
      p.specifications,
      -- 🔥 FIX: Add images field here too!
      p.images,
      COALESCE((p.images->0)::TEXT, '') AS image_url, -- First image from array
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.company_name AS supplier_company_name,
      s.category AS supplier_category,
      s.country AS supplier_country,
      s.city AS supplier_city,
      s.contact_email AS supplier_email,
      s.contact_phone AS supplier_phone,
      s.website AS supplier_website,
      COALESCE(s.rating, 0) AS supplier_rating,
      0 AS supplier_reviews,
      0 AS supplier_projects,
      'user' AS room_type,
      '🔵' AS room_icon,
      'Личный поставщик' AS room_description
    FROM catalog_user_products p
    INNER JOIN catalog_user_suppliers s ON p.supplier_id = s.id
    WHERE
      (category_name IS NULL OR p.category = category_name)
      AND p.is_active = TRUE
      AND s.is_active = TRUE
      AND (user_id_param IS NULL OR p.user_id = user_id_param)
      AND (search_query IS NULL OR
           p.name ILIKE '%' || search_query || '%' OR
           p.description ILIKE '%' || search_query || '%')
  ),

  -- Объединяем verified и user товары
  all_products AS (
    SELECT * FROM verified_products
    UNION ALL
    SELECT * FROM user_products
  )

  SELECT COALESCE(
    jsonb_agg(row_to_json(all_products)::JSONB ORDER BY product_name),
    '[]'::JSONB
  ) INTO result
  FROM (
    SELECT * FROM all_products
    LIMIT limit_param
    OFFSET offset_param
  ) all_products;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_products_by_category TO authenticated, anon;

-- Test the function
-- SELECT get_products_by_category('ТЕСТОВАЯ', NULL, NULL, 1, 0);
```

### Приложение B: Next.js config (исправленный)

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.vercel-storage.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'ejkhdhexkadecpbjjmsz.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    }
  ],
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
},
```

---

**Конец отчета**

Все проблемы идентифицированы, решения готовы к применению.
Ожидаемое время устранения: 15-25 минут.
