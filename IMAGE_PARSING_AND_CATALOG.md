# 🖼️ Парсинг картинок и интеграция с каталогом

**Дата:** 27 ноября 2025
**Статус:** ✅ Картинки парсятся, НО не сохраняются в БД автоматически

---

## ✅ ДА, КАРТИНКИ ВЫТАСКИВАЮТСЯ!

### Что парсится сейчас:

**Все парсеры извлекают `imageUrl`:**

1. **UrlParserService** (`lib/services/UrlParserService.ts`)
   ```typescript
   imageUrl: $('meta[property="og:image"]').attr('content') ||
             $('meta[name="twitter:image"]').attr('content')
   ```

2. **PlaywrightParserService** (`lib/services/PlaywrightParserService.ts`)
   ```typescript
   imageUrl: getMeta('meta[property="og:image"]') ||
             getMeta('meta[name="twitter:image"]') ||
             $('.product-image img').attr('src')
   ```

3. **HtmlParserService** (`lib/services/HtmlParserService.ts`)
   ```typescript
   imageUrl: ogImage || twitterImage
   ```

4. **ScraperAPI + Cheerio**
   ```typescript
   imageUrl: $('meta[property="og:image"]').attr('content') ||
             $('.magnifier-image').first().attr('src')
   ```

---

## 📊 Текущий поток данных

### Шаг 1: Парсинг товара

```bash
POST /api/catalog/search-by-url
{
  "url": "https://market.yandex.ru/product/..."
}
```

**Ответ API:**
```json
{
  "success": true,
  "metadata": {
    "title": "Смартфон Apple iPhone 15 128GB Розовый",
    "description": "Смартфон Apple iPhone 15...",
    "marketplace": "yandex",
    "imageUrl": "https://avatars.mds.yandex.net/get-mpic/..." ✅
  },
  "analysis": {
    "brand": "Apple",
    "category": "Электроника",
    "keywords": ["iPhone", "15", "смартфон", "Apple", "128GB"]
  },
  "products": [...],  // Найденные аналоги из БД
  "productsCount": 5
}
```

---

## ⚠️ ВАЖНО: Данные НЕ сохраняются автоматически

### Текущее поведение:

```
Парсинг URL → Извлечение metadata (title, imageUrl, price)
              ↓
         Анализ товара (YandexGPT)
              ↓
         Поиск АНАЛОГОВ в БД ✅
              ↓
         Возврат результатов

❌ НЕТ СОХРАНЕНИЯ в catalog_verified_products!
```

**API `/api/catalog/search-by-url` ТОЛЬКО ИЩЕТ аналоги, не добавляет товары!**

---

## 🗄️ Структура БД каталога

### Таблица `catalog_verified_products`:

```sql
id              uuid PRIMARY KEY
supplier_id     uuid NOT NULL          -- ID поставщика
name            text NOT NULL          -- Название товара
description     text                   -- Описание
category        text NOT NULL          -- Категория
sku             text                   -- Артикул
price           numeric(12,2)          -- Цена
currency        text DEFAULT 'USD'     -- Валюта
min_order       text                   -- Мин. заказ
in_stock        boolean DEFAULT true   -- В наличии
specifications  jsonb                  -- Характеристики
images          jsonb ✅               -- МАССИВ URL картинок!
is_featured     boolean DEFAULT false  -- Избранное
display_order   integer DEFAULT 0      -- Порядок отображения
is_active       boolean DEFAULT true   -- Активен
created_at      timestamp
updated_at      timestamp
category_id     uuid                   -- ID категории
subcategory_id  uuid                   -- ID подкатегории
```

**Важно:** Поле `images` - это **JSONB массив** URL:
```json
["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
```

---

## 📦 Примеры товаров в каталоге

### Текущие товары в БД:

```sql
id                                    | name                                 | images                                                | price
--------------------------------------+--------------------------------------+------------------------------------------------------+---------
fa7a3dea-d04a-4ad3-9f85-4a450e4a909b | Антифриз G12+ красный 5л             | ["https://images.unsplash.com/photo-14862627..."]     | 1200.00
2540f101-6289-4df9-88e3-f16e0c573fb8 | Коврики автомобильные универсальные  | ["https://images.unsplash.com/photo-14499654..."]     | 800.00
eea691cc-1ada-4b3a-a2b1-930371c28fbd | Шины летние 195/65 R15               | ["https://images.unsplash.com/photo-16062209..."]     | 4500.00
```

**Видно:** Все товары имеют картинки в формате JSONB массива.

---

## 🔄 Как данные ДОЛЖНЫ попадать в каталог

### Вариант 1: Ручное добавление (текущий способ)

Администратор вручную добавляет товары через UI или SQL:

```sql
INSERT INTO catalog_verified_products (
  supplier_id,
  name,
  description,
  category,
  price,
  currency,
  images
) VALUES (
  'uuid-поставщика',
  'Смартфон Apple iPhone 15',
  'Смартфон Apple iPhone 15 128GB Розовый',
  'Электроника',
  79990.00,
  'RUB',
  '["https://market.yandex.ru/.../image.jpg"]'::jsonb
);
```

---

### Вариант 2: API для добавления товара (НЕ РЕАЛИЗОВАН)

**Нужен новый эндпоинт:**

```typescript
POST /api/catalog/products/create

{
  "supplier_id": "uuid",
  "name": "Смартфон Apple iPhone 15",
  "description": "...",
  "category": "Электроника",
  "price": 79990.00,
  "currency": "RUB",
  "images": ["https://..."],
  "brand": "Apple",
  "specifications": {...}
}
```

---

### Вариант 3: Импорт из парсинга (НАДО СОЗДАТЬ)

**Идея:** Добавить кнопку "Добавить в каталог" после парсинга:

```typescript
// 1. Пользователь парсит товар
POST /api/catalog/search-by-url
{
  "url": "https://market.yandex.ru/..."
}

// Получает metadata с imageUrl ✅

// 2. Нажимает "Добавить в каталог"
POST /api/catalog/products/import-from-url
{
  "metadata": {
    "title": "...",
    "imageUrl": "...",  // ✅ Картинка есть!
    "price": "...",
    ...
  },
  "analysis": {
    "brand": "...",
    "category": "...",
    ...
  },
  "supplier_id": "uuid"
}

// Система:
// - Создает товар в catalog_verified_products
// - Сохраняет imageUrl в поле images как JSONB массив
// - Связывает с поставщиком
```

---

## 🚀 Что нужно сделать для автосохранения

### План реализации:

**1. Создать API эндпоинт для импорта товара:**

```typescript
// app/api/catalog/products/import-from-url/route.ts

export async function POST(request: NextRequest) {
  const { metadata, analysis, supplier_id } = await request.json()

  // Валидация
  if (!metadata.title || !supplier_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Сохранение в БД
  const { data, error } = await supabase
    .from('catalog_verified_products')
    .insert({
      supplier_id: supplier_id,
      name: metadata.title,
      description: metadata.description,
      category: analysis.category || 'Разное',
      price: parsePrice(metadata.price),
      currency: metadata.currency || 'RUB',
      images: metadata.imageUrl ? [metadata.imageUrl] : [], // ✅ Картинка!
      specifications: {
        brand: analysis.brand,
        keywords: analysis.keywords,
        marketplace: metadata.marketplace,
        originalUrl: metadata.originalUrl
      }
    })
    .select()

  return NextResponse.json({ success: true, product: data[0] })
}
```

**2. Добавить UI кнопку "Добавить в каталог":**

```typescript
// После успешного парсинга показать:
<Button onClick={() => importProduct(metadata, analysis)}>
  Добавить в каталог
</Button>
```

**3. Автоматическая загрузка картинок (опционально):**

```typescript
// Если нужно загружать картинки к себе:
import { supabase } from '@/lib/supabaseClient'

async function uploadImage(imageUrl: string, productId: string) {
  // Скачиваем картинку
  const response = await fetch(imageUrl)
  const blob = await response.blob()

  // Загружаем в Supabase Storage
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(`${productId}/main.jpg`, blob)

  // Возвращаем публичный URL
  return supabase.storage
    .from('product-images')
    .getPublicUrl(`${productId}/main.jpg`).data.publicUrl
}
```

---

## 📊 Итоговая схема

### Текущее состояние:

```
URL → Парсинг → metadata { imageUrl ✅ } → Поиск аналогов → Возврат

                          ❌ НЕ СОХРАНЯЕТСЯ В БД
```

### Нужная схема:

```
URL → Парсинг → metadata { imageUrl ✅ }
                    ↓
               Показать пользователю
                    ↓
          [Кнопка: Добавить в каталог]
                    ↓
       POST /api/catalog/products/import-from-url
                    ↓
       INSERT INTO catalog_verified_products
       images = [imageUrl] ✅
                    ↓
            Товар в каталоге!
```

---

## ✅ ВЫВОДЫ

### Что работает сейчас:

1. ✅ **Картинки парсятся** во всех сервисах
2. ✅ **imageUrl возвращается** в API ответе
3. ✅ **БД готова** к сохранению картинок (поле `images` JSONB)
4. ⚠️ **НО автосохранения НЕТ** - API только ищет аналоги

### Что нужно добавить:

1. 📋 **API эндпоинт** `/api/catalog/products/import-from-url`
2. 📋 **UI кнопку** "Добавить в каталог"
3. 📋 **Опционально:** Загрузка картинок в Supabase Storage

### Можешь ли ты появиться в каталоге?

**ДА, но нужно:**
- Либо добавить товар вручную через SQL/UI
- Либо создать API для импорта (10-15 минут работы)
- Картинка уже есть в `metadata.imageUrl` после парсинга! ✅

---

## 🚀 Хочешь чтобы я создал API для автодобавления?

**Создам за 10 минут:**
1. POST `/api/catalog/products/import-from-url` - сохранение товара
2. Интеграция с существующим `/api/catalog/search-by-url`
3. Автоматическое сохранение картинок в поле `images`

**Скажи слово и сделаю!** 🎯

---

**Дата создания:** 27 ноября 2025
**Статус:** ✅ Картинки парсятся, API для импорта нужен
