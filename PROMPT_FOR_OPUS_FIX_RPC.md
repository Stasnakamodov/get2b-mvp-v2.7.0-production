# 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА: RPC функция get_products_by_category возвращает 1 товар вместо 33

## КОНТЕКСТ

В Next.js приложении с PostgreSQL (Supabase) есть каталог товаров с категориями и подкатегориями.

## СИМПТОМЫ ПРОБЛЕМЫ

1. **В UI**: Подкатегория "Тестовые товары" показывает счетчик "2 товара"
2. **При клике**: Отображается только 1 товар
3. **В базе данных**: 33 товара с `category = 'ТЕСТОВАЯ'`
4. **RPC функция**: Возвращает только 1 товар

## РЕЗУЛЬТАТЫ ДИАГНОСТИКИ

### 1. Прямой REST API запрос к таблице
```bash
GET /rest/v1/catalog_verified_products?category=eq.ТЕСТОВАЯ
```
**Результат:** ✅ 33 товара (все товары доступны)

**Статистика:**
- Всего товаров: 33
- С подкатегорией (subcategory_id): 2
- Без подкатегории: 31
- Активных (is_active=true): 32
- Неактивных: 1

### 2. RPC функция get_products_by_category
```bash
POST /rest/v1/rpc/get_products_by_category
Body: {
  "category_name": "ТЕСТОВАЯ",
  "user_id_param": null,
  "search_query": null,
  "limit_param": 100,
  "offset_param": 0
}
```
**Результат:** ❌ 1 товар (32 товара пропадают!)

### 3. API endpoint используемый в приложении
```bash
GET /api/catalog/products-by-category/ТЕСТОВАЯ?limit=100
```
**Результат:** ❌ 1 товар (использует RPC функцию внутри)

### 4. Поставщик "Импортированные товары"
- ID: `5c86b227-8125-4f69-b9c3-674ae5929bc2`
- is_active: ✅ TRUE
- Все 32 активных товара принадлежат этому поставщику

## ИСХОДНЫЙ КОД RPC ФУНКЦИИ

Функция находится в файле: `supabase/migrations/20251127_fix_get_products_by_category_images.sql`

```sql
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
      p.images,
      COALESCE((p.images->0)::TEXT, '') AS image_url,
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
      p.images,
      COALESCE((p.images->0)::TEXT, '') AS image_url,
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
```

## СХЕМА ТАБЛИЦ

### catalog_verified_products
- id (uuid, primary key)
- supplier_id (uuid, foreign key -> catalog_verified_suppliers.id)
- name (text)
- category (text) - например "ТЕСТОВАЯ"
- subcategory_id (uuid, nullable, foreign key -> catalog_subcategories.id)
- description (text)
- price (numeric)
- currency (text)
- min_order (integer)
- in_stock (boolean)
- images (jsonb array)
- is_active (boolean)
- created_at (timestamp)

### catalog_verified_suppliers
- id (uuid, primary key)
- name (text)
- company_name (text)
- category (text)
- country (text)
- city (text)
- contact_email (text)
- contact_phone (text)
- website (text)
- rating (numeric)
- reviews_count (integer)
- completed_projects (integer)
- is_active (boolean)

### catalog_subcategories
- id (uuid, primary key)
- category_id (uuid, foreign key -> catalog_categories.id)
- name (text) - например "Тестовые товары"
- key (text)

## ДАННЫЕ ПРИМЕРА

**Поставщик:**
- ID: `5c86b227-8125-4f69-b9c3-674ae5929bc2`
- name: "Импортированные товары"
- is_active: TRUE

**Товар который возвращается (единственный):**
- ID: `4f7dd6a8-1302-42b0-b362-73abeff07511`
- name: "Смартфон Apple iPhone 15 Pro Max 256GB"
- category: "ТЕСТОВАЯ"
- subcategory_id: `731e04c6-875d-492f-a460-e8e248c75e5b`
- supplier_id: `5c86b227-8125-4f69-b9c3-674ae5929bc2`
- is_active: TRUE

**Другие 32 товара (НЕ возвращаются):**
- Все имеют category: "ТЕСТОВАЯ"
- 31 товар с subcategory_id: NULL
- 1 товар с subcategory_id: `731e04c6-875d-492f-a460-e8e248c75e5b`
- Все активны (is_active: TRUE, кроме 1)
- Все принадлежат тому же supplier_id

## API ENDPOINT КОД

Файл: `app/api/catalog/products-by-category/[category]/route.ts`

```typescript
// Вызываем функцию get_products_by_category
const { data: rawData, error } = await supabase.rpc('get_products_by_category', {
  category_name: categoryFilter,
  user_id_param: currentUserId,
  search_query: searchQuery,
  limit_param: limit,
  offset_param: offset
})

// Функция возвращает JSONB array
let products = []

if (Array.isArray(rawData)) {
  products = rawData
} else if (rawData && typeof rawData === 'string') {
  products = JSON.parse(rawData)
} else if (rawData === null || rawData === undefined) {
  products = []
} else {
  console.error('❌ [API] Неожиданный формат данных:', typeof rawData, rawData)
  products = []
}
```

## ЗАДАЧА

**Нужно исправить RPC функцию `get_products_by_category` чтобы она возвращала ВСЕ товары, а не только 1.**

### Возможные причины проблемы:

1. **LIMIT/OFFSET применяется неправильно** - возможно WHERE фильтр работает, но LIMIT в подзапросе ограничивает результат до 1
2. **RLS политики** - Row Level Security может блокировать доступ (но тогда почему REST API работает?)
3. **Проблема с UNION ALL** - возможно дубликаты или конфликт полей
4. **Ошибка в JSONB агрегации** - jsonb_agg может терять данные
5. **Подзапрос `all_products`** - возможно проблема в финальном SELECT

### Что нужно сделать:

1. **Проанализировать** RPC функцию и найти где теряются 32 товара
2. **Исправить** функцию чтобы она возвращала все товары
3. **Протестировать** что исправление работает
4. **Создать миграцию** для применения исправления

### Дополнительные требования:

- Функция должна поддерживать фильтрацию по категориям И подкатегориям
- Функция должна возвращать все поля включая `images` и `image_url`
- LIMIT и OFFSET должны работать корректно
- Производительность должна быть хорошей (индексы в порядке)

## ФАЙЛЫ В ПРОЕКТЕ

- `supabase/migrations/20251127_fix_get_products_by_category_images.sql` - текущая версия функции
- `app/api/catalog/products-by-category/[category]/route.ts` - API endpoint
- `components/catalog/ProductGridByCategory.tsx` - компонент отображения товаров
- `scripts/test-rpc-function.js` - скрипт для тестирования RPC функции
- `scripts/check-db-direct.js` - скрипт для прямой проверки БД

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После исправления:
- RPC функция должна возвращать все 33 товара для категории "ТЕСТОВАЯ"
- API endpoint `/api/catalog/products-by-category/ТЕСТОВАЯ` должен возвращать 33 товара
- UI должен отображать все товары в категории

---

**НАЧНИ С АНАЛИЗА RPC ФУНКЦИИ И НАЙДИ ГДЕ ТЕРЯЮТСЯ 32 ТОВАРА**
