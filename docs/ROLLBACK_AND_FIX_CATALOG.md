# 🔄 ОТКАТ И ИСПРАВЛЕНИЕ КАТАЛОГА

## ❌ Что пошло не так

1. **Неправильное понимание архитектуры**
   - В проекте было ДВА разных Supabase проекта
   - Проект A (`ejkhdhexkadecpbjjmsz`) - рабочий, с таблицами projects, project_templates
   - Проект B (`jphjexdrtphpanmuhhlw`) - подключен через MCP, новая структура БД

2. **Добавил данные не в тот проект**
   - Через MCP добавил 46 товаров и 10 поставщиков в Проект B
   - Но приложение использовало Проект A

3. **Попытка "исправить" переключением проекта**
   - Изменил `.env.local` чтобы указать на Проект B
   - Это СЛОМАЛО весь функционал проектов (projects, project_templates не существуют в Проекте B)

4. **Попытка синхронизации между проектами**
   - Скопировал товары из Проекта B в Проект A
   - Но UUID категорий не совпали
   - Товары оказались без привязки к категориям (NULL)

5. **Разная структура БД в двух проектах**
   - Проект A (СТАРЫЙ): `catalog_verified_products` + `catalog_user_products` (отдельные таблицы)
   - Проект B (НОВЫЙ): `catalog_products` (единая таблица с полем `supplier_source`)

## ✅ Что сделано для отката

1. ✅ Вернул `.env.local` на ОРИГИНАЛЬНЫЙ проект A (`ejkhdhexkadecpbjjmsz`)
2. ✅ Восстановил API route до исходного состояния (`git restore`)
3. ✅ Очистил битые записи из `catalog_products` и `catalog_suppliers`
4. ✅ Проверил что старые данные целы:
   - 62 товара в `catalog_verified_products`
   - 19 поставщиков в `catalog_verified_suppliers`
   - 8 корневых категорий в `catalog_categories`

## 🎯 ЦЕЛЬ: Сделать каталог правильно

### Текущее состояние базы (Проект A - `ejkhdhexkadecpbjjmsz`)

**Структура:**
```
catalog_categories (8 записей)
  ├─ id, key, name, icon, description
  ├─ has_subcategories (boolean)
  └─ NO parent_id field!

catalog_subcategories (0 записей) ⚠️ ПУСТО
  ├─ id, category_id, name, key
  └─ Должны быть подкатегории!

catalog_verified_suppliers (19 записей)
  ├─ id, name, company_name, category, country
  └─ Старая структура - работает

catalog_verified_products (62 записей)
  ├─ id, supplier_id, name, description
  ├─ category (TEXT поле с именем категории)
  ├─ category_id (UUID - привязка к catalog_categories)
  ├─ price, currency, min_order, in_stock
  └─ Старая структура - работает

catalog_products (0 записей) - новая таблица, не используется
catalog_suppliers (0 записей) - новая таблица, не используется
```

### Проблемы которые нужно решить

1. **API `/api/catalog/products-by-category/[category]` вызывает функцию `get_products_by_category`**
   - Функция существует в БД
   - Но она возвращает ошибку: `column cat_sub.parent_id does not exist`
   - Причина: функция написана для НОВОЙ структуры (с parent_id)

2. **Таблица `catalog_subcategories` ПУСТАЯ**
   - Должно быть ~33 подкатегории
   - Без них 3-уровневая навигация не работает

3. **Товары привязаны к категориям через TEXT поле `category`**
   - В новой структуре это UUID `category_id`
   - Нужно решить как связать товары с подкатегориями

### План исправления

#### Вариант 1: Адаптировать функцию под СТАРУЮ структуру (БЫСТРО)

1. Переписать `get_products_by_category` чтобы работала с:
   - `catalog_verified_products` (вместо `catalog_products`)
   - `catalog_verified_suppliers` (вместо `catalog_suppliers`)
   - Фильтр по текстовому полю `category` (вместо JOIN с categories)
   - Добавить поддержку `catalog_user_products` (UNION)

2. Заполнить `catalog_subcategories`:
   - Создать 33 подкатегории вручную
   - Привязать к 8 корневым категориям

3. Обновить UI чтобы использовал старую структуру

**Плюсы:** Быстро, не ломает существующие данные
**Минусы:** Работаем со старой архитектурой

#### Вариант 2: Мигрировать на НОВУЮ структуру (ПРАВИЛЬНО)

1. Создать миграцию для добавления `parent_id` в `catalog_categories`
2. Перенести данные из `catalog_verified_products` → `catalog_products`
3. Перенести данные из `catalog_verified_suppliers` → `catalog_suppliers`
4. Создать 33 подкатегории как записи в `catalog_categories` с `parent_id`
5. Обновить `category_id` у всех товаров чтобы указывали на подкатегории
6. Создать правильную функцию `get_products_by_category`

**Плюсы:** Правильная архитектура, единая структура
**Минусы:** Требует времени, нужно аккуратно мигрировать данные

#### Вариант 3: ГИБРИДНЫЙ подход (РЕКОМЕНДУЮ)

1. **Оставить старые таблицы как есть** (не трогаем данные)
2. **Создать VIEW** который объединяет старые таблицы в новый формат:
   ```sql
   CREATE VIEW catalog_products_view AS
   SELECT
     vp.*,
     'verified' as supplier_source,
     vs.name as supplier_name
   FROM catalog_verified_products vp
   JOIN catalog_verified_suppliers vs ON vp.supplier_id = vs.id
   UNION ALL
   SELECT
     up.*,
     'user' as supplier_source,
     us.name as supplier_name
   FROM catalog_user_products up
   JOIN catalog_user_suppliers us ON up.supplier_id = us.id;
   ```
3. **Заполнить `catalog_subcategories`** (33 записи)
4. **Обновить функцию** чтобы работала с VIEW и текстовым полем `category`

**Плюсы:** Не ломает данные, быстро, можно постепенно мигрировать
**Минусы:** Немного сложнее SQL

## 🚀 Рекомендуемый план действий

### Шаг 1: Заполнить подкатегории (ОБЯЗАТЕЛЬНО)

```sql
-- Вставить 33 подкатегории в catalog_subcategories
-- Привязать к соответствующим category_id из catalog_categories

-- Пример для Электроники
INSERT INTO catalog_subcategories (category_id, name, key) VALUES
  ((SELECT id FROM catalog_categories WHERE key = 'electronics'), 'Смартфоны и планшеты', 'smartphones_tablets'),
  ((SELECT id FROM catalog_categories WHERE key = 'electronics'), 'Компьютеры и ноутбуки', 'computers_laptops'),
  ((SELECT id FROM catalog_categories WHERE key = 'electronics'), 'Бытовая техника', 'home_appliances'),
  ((SELECT id FROM catalog_categories WHERE key = 'electronics'), 'Электроника общего назначения', 'electronics_general');

-- И так для всех 8 категорий...
```

### Шаг 2: Создать адаптированную функцию

```sql
CREATE OR REPLACE FUNCTION get_products_by_category(
  category_name TEXT DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO result
  FROM (
    -- Verified products
    SELECT
      vp.id,
      vp.name AS product_name,
      vp.description,
      vp.price::text,
      vp.currency,
      vp.min_order::int,
      vp.in_stock,
      vp.sku AS item_code,
      CASE WHEN vp.images IS NOT NULL THEN vp.images->0 ELSE NULL END AS image_url,
      vp.name AS item_name,

      -- Supplier info
      vs.id AS supplier_id,
      vs.name AS supplier_name,
      vs.company_name AS supplier_company_name,
      vs.category AS supplier_category,
      vs.country AS supplier_country,

      'verified' AS room_type,
      '🟠' AS room_icon,
      'Аккредитованный поставщик Get2B' AS room_description,

      -- Category info
      vp.category AS category_name,
      c.name AS parent_category_name

    FROM catalog_verified_products vp
    INNER JOIN catalog_verified_suppliers vs ON vp.supplier_id = vs.id
    LEFT JOIN catalog_categories c ON vp.category_id = c.id

    WHERE
      vp.is_active = true
      AND (category_name IS NULL OR vp.category = category_name)
      AND (search_query IS NULL OR
           vp.name ILIKE '%' || search_query || '%' OR
           vp.description ILIKE '%' || search_query || '%')

    UNION ALL

    -- User products (если есть)
    SELECT
      up.id,
      up.name AS product_name,
      up.description,
      up.price::text,
      up.currency,
      up.min_order::int,
      up.in_stock,
      up.sku AS item_code,
      CASE WHEN up.images IS NOT NULL THEN up.images->0 ELSE NULL END AS image_url,
      up.name AS item_name,

      us.id AS supplier_id,
      us.name AS supplier_name,
      us.company_name AS supplier_company_name,
      us.category AS supplier_category,
      us.country AS supplier_country,

      'user' AS room_type,
      '🔵' AS room_icon,
      'Личный поставщик' AS room_description,

      up.category AS category_name,
      c.name AS parent_category_name

    FROM catalog_user_products up
    INNER JOIN catalog_user_suppliers us ON up.supplier_id = us.id
    LEFT JOIN catalog_categories c ON up.category_id = c.id

    WHERE
      up.is_active = true
      AND us.user_id = user_id_param
      AND (category_name IS NULL OR up.category = category_name)
      AND (search_query IS NULL OR
           up.name ILIKE '%' || search_query || '%' OR
           up.description ILIKE '%' || search_query || '%')

    ORDER BY room_type, product_name
    LIMIT limit_param
    OFFSET offset_param
  ) t;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_products_by_category TO anon;
GRANT EXECUTE ON FUNCTION get_products_by_category TO authenticated;
```

### Шаг 3: Обновить UI для работы с подкатегориями

- Страница каталога должна загружать `catalog_categories` + `catalog_subcategories`
- При клике на категорию → показывать подкатегории из `catalog_subcategories`
- При клике на подкатегорию → вызывать API с именем подкатегории

## 📋 Чеклист выполнения

- [ ] Заполнить `catalog_subcategories` (33 записи)
- [ ] Удалить старую функцию `get_products_by_category`
- [ ] Создать новую функцию для работы со старой структурой
- [ ] Протестировать API: `/api/catalog/products-by-category/all`
- [ ] Протестировать API: `/api/catalog/products-by-category/Смартфоны%20и%20планшеты`
- [ ] Запустить `npm run dev` и проверить UI на `http://localhost:3000/dashboard/catalog`
- [ ] Убедиться что projects и project_templates работают

## 🔍 Как проверить что все работает

```bash
# 1. Проверить подкатегории
psql ... -c "SELECT COUNT(*) FROM catalog_subcategories;"
# Должно быть: 33

# 2. Проверить функцию
psql ... -c "SELECT * FROM get_products_by_category('Смартфоны и планшеты', NULL, NULL, 5, 0);"
# Должно вернуть товары

# 3. Проверить API
curl http://localhost:3000/api/catalog/products-by-category/all | jq '.summary'
# Должно вернуть: {"total_products": 62, ...}

# 4. Проверить projects
curl http://localhost:3000/dashboard/project-constructor
# Должна загрузиться страница без ошибок
```

## ⚠️ ВАЖНО: Не трогать `.env.local`!

Проект должен использовать:
```
NEXT_PUBLIC_SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
```

Это оригинальный проект где есть ВСЕ таблицы.

---

**Время выполнения:** 30-60 минут
**Приоритет:** КРИТИЧЕСКИЙ
**Блокирует:** Весь функционал каталога
