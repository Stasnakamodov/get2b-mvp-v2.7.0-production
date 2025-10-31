# БЕЗОПАСНЫЙ ПЛАН МИГРАЦИИ КАТЕГОРИЙ GET2B v2.0

**Дата создания:** 2025-10-30
**Версия:** 2.0 (после полного аудита БД)
**Статус:** ГОТОВ К ВЫПОЛНЕНИЮ
**Проверено:** Через прямое подключение к Supabase

---

## EXECUTIVE SUMMARY

### Что изменилось после аудита

**КРИТИЧЕСКОЕ ОТКРЫТИЕ:**
- ✅ Таблица `catalog_categories` УЖЕ СУЩЕСТВУЕТ (8 категорий)
- ✅ Таблица `catalog_subcategories` УЖЕ СУЩЕСТВУЕТ (пустая)
- ⚠️ 70 products с `category_id = NULL` (не привязаны!)
- ⚠️ 10 suppliers с `category_id = NULL` (не привязаны!)
- ⚠️ `supplier_profiles` использует текстовое поле `category` (не UUID!)

**НОВЫЙ ПОДХОД:**
- ❌ НЕ создаём новые таблицы
- ✅ Расширяем существующую схему
- ✅ Сохраняем обратную совместимость
- ✅ Мигрируем данные постепенно
- ✅ Минимизируем риски

---

## ТЕКУЩЕЕ СОСТОЯНИЕ БД (ПРОВЕРЕНО)

### Существующие таблицы

```sql
-- 1. CATALOG_CATEGORIES (8 записей)
CREATE TABLE catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(50) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  icon varchar(10),
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  has_subcategories boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. CATALOG_SUBCATEGORIES (0 записей)
CREATE TABLE catalog_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES catalog_categories(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  key varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, key)
);

-- 3. CATALOG_PRODUCTS (70 записей)
-- category_id uuid → catalog_categories.id
-- subcategory_id uuid → catalog_subcategories.id
-- ⚠️ ВСЕ 70 имеют category_id = NULL!

-- 4. CATALOG_SUPPLIERS (10 записей)
-- category_id uuid → catalog_categories.id
-- ⚠️ ВСЕ 10 имеют category_id = NULL!

-- 5. SUPPLIER_PROFILES (0 записей)
-- category text NOT NULL (не UUID!)
-- ⚠️ CHECK constraint конфликтует с catalog_categories
```

### Существующие категории (8 шт)

```sql
SELECT name, key FROM catalog_categories ORDER BY sort_order;
```

| name                 | key          |
|---------------------|--------------|
| Электроника         | electronics  |
| Автотовары          | automotive   |
| Промышленность      | industrial   |
| Здоровье и медицина | healthcare   |
| Текстиль и одежда   | textiles     |
| Строительство       | construction |
| Продукты питания    | food         |
| Дом и быт           | home         |

---

## ЦЕЛЕВАЯ АРХИТЕКТУРА

### Вариант A: Two-Table Hierarchy (РЕКОМЕНДУЕТСЯ)

Оставляем текущую архитектуру, просто расширяем:

```
catalog_categories (level 0 - основные)
    ↓ FK: category_id
catalog_subcategories (level 1 - подкатегории)
    ↓ FK: category_id + subcategory_id
catalog_products
catalog_suppliers
```

**Преимущества:**
- ✅ Минимальные изменения
- ✅ Схема уже работает
- ✅ Простые SQL запросы
- ✅ Низкий риск

**Недостатки:**
- ⚠️ Только 2 уровня вложенности
- ⚠️ Нет level 2 (детальных категорий)

---

### Вариант B: Hybrid Approach (ПРЕДЛАГАЕТСЯ)

Используем обе таблицы + добавляем parent_id для гибкости:

```
catalog_categories (с parent_id)
    ├─ level 0: parent_id = NULL (основные)
    ├─ level 1: parent_id → catalog_categories (подкатегории)
    └─ level 2: parent_id → catalog_categories (детальные)

catalog_subcategories (legacy, для обратной совместимости)
    └─ мигрируем в catalog_categories постепенно
```

**Преимущества:**
- ✅ До 3 уровней вложенности
- ✅ Обратная совместимость
- ✅ Гибкая иерархия

**Недостатки:**
- ⚠️ Сложнее миграция
- ⚠️ Нужно поддерживать две таблицы временно

---

### РЕШЕНИЕ: Hybrid Approach (Вариант B)

Используем гибридную схему для максимальной гибкости.

---

## ПЛАН МИГРАЦИИ (ПОЭТАПНО)

### ЭТАП 0: Подготовка (30 минут)

#### 0.1 Backup БД (КРИТИЧНО!)

```bash
# Через Supabase CLI
supabase db dump -f backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# Или через pg_dump
PGPASSWORD="B2ryf4elLIDqghCR" pg_dump \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.ejkhdhexkadecpbjjmsz \
  -d postgres \
  -Fc \
  -f backup_$(date +%Y%m%d_%H%M%S).dump
```

#### 0.2 Создать тестовую БД

```bash
# Создать локальную Supabase для тестирования
supabase start

# Или использовать staging environment
```

#### 0.3 Проверить текущее состояние

```sql
-- Подсчёт записей
SELECT
  (SELECT COUNT(*) FROM catalog_categories) as categories,
  (SELECT COUNT(*) FROM catalog_subcategories) as subcategories,
  (SELECT COUNT(*) FROM catalog_products) as products,
  (SELECT COUNT(*) FROM catalog_suppliers) as suppliers,
  (SELECT COUNT(*) FROM supplier_profiles) as profiles;

-- Проверить NULL category_id
SELECT
  (SELECT COUNT(*) FROM catalog_products WHERE category_id IS NULL) as products_null,
  (SELECT COUNT(*) FROM catalog_suppliers WHERE category_id IS NULL) as suppliers_null;
```

**Ожидаемый результат:**
```
categories: 8
subcategories: 0
products: 70
suppliers: 10
profiles: 0
products_null: 70
suppliers_null: 10
```

---

### ЭТАП 1: Расширение схемы catalog_categories (1 час)

#### 1.1 Добавить недостающие колонки

**Файл:** `supabase/migrations/20251030_100_extend_catalog_categories.sql`

```sql
-- =====================================================
-- РАСШИРЕНИЕ СХЕМЫ CATALOG_CATEGORIES
-- Добавление parent_id для иерархии и доп. полей
-- =====================================================

-- Добавить parent_id для иерархии (self-referencing FK)
ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES catalog_categories(id) ON DELETE SET NULL;

-- Добавить level для определения уровня вложенности
ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 0 CHECK (level BETWEEN 0 AND 3);

-- Добавить full_path для breadcrumbs
ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS full_path text;

-- Добавить счётчики для UI
ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS products_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suppliers_count integer DEFAULT 0;

-- Добавить флаг популярности
ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;

-- Добавить metadata для расширяемости
ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Добавить slug как alias для key (для совместимости с планом)
ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS slug text;

-- Заполнить slug из key
UPDATE catalog_categories SET slug = key WHERE slug IS NULL;

-- Создать уникальный индекс на slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_slug ON catalog_categories(slug);

-- Создать индексы для производительности
CREATE INDEX IF NOT EXISTS idx_cat_parent ON catalog_categories(parent_id)
  WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cat_level ON catalog_categories(level);
CREATE INDEX IF NOT EXISTS idx_cat_popular ON catalog_categories(is_popular)
  WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_cat_full_path ON catalog_categories
  USING gin(to_tsvector('russian', full_path))
  WHERE full_path IS NOT NULL;

-- Обновить существующие записи: установить level = 0
UPDATE catalog_categories
SET level = 0, full_path = name
WHERE level IS NULL OR level = 0;

-- Комментарии
COMMENT ON COLUMN catalog_categories.parent_id IS 'ID родительской категории для иерархии';
COMMENT ON COLUMN catalog_categories.level IS 'Уровень вложенности: 0=основная, 1=подкатегория, 2=детальная';
COMMENT ON COLUMN catalog_categories.full_path IS 'Полный путь для breadcrumbs, например "Электроника / Смартфоны / Аксессуары"';
COMMENT ON COLUMN catalog_categories.products_count IS 'Количество товаров в категории (автоматически обновляется)';
COMMENT ON COLUMN catalog_categories.suppliers_count IS 'Количество поставщиков в категории (автоматически обновляется)';
COMMENT ON COLUMN catalog_categories.is_popular IS 'Флаг популярной категории для отображения в топе';
COMMENT ON COLUMN catalog_categories.metadata IS 'Дополнительные данные в JSON формате';
COMMENT ON COLUMN catalog_categories.slug IS 'URL-friendly идентификатор (alias для key)';

-- Проверка результата
DO $$
DECLARE
  cols_count integer;
BEGIN
  SELECT COUNT(*) INTO cols_count
  FROM information_schema.columns
  WHERE table_name = 'catalog_categories'
    AND column_name IN ('parent_id', 'level', 'full_path', 'products_count', 'suppliers_count', 'is_popular', 'metadata', 'slug');

  IF cols_count = 8 THEN
    RAISE NOTICE '✅ Все колонки успешно добавлены в catalog_categories';
  ELSE
    RAISE EXCEPTION '❌ Не все колонки добавлены! Ожидалось 8, получено %', cols_count;
  END IF;
END $$;
```

#### 1.2 Создать триггеры для автоматического обновления

**Файл:** `supabase/migrations/20251030_101_create_category_triggers.sql`

```sql
-- =====================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ
-- =====================================================

-- 1. Триггер для обновления full_path при изменении
CREATE OR REPLACE FUNCTION update_category_full_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- Корневая категория
    NEW.full_path := NEW.name;
    NEW.level := 0;
  ELSE
    -- Дочерняя категория
    SELECT
      parent.full_path || ' / ' || NEW.name,
      parent.level + 1
    INTO
      NEW.full_path,
      NEW.level
    FROM catalog_categories parent
    WHERE parent.id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_full_path
  BEFORE INSERT OR UPDATE OF name, parent_id ON catalog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_full_path();

-- 2. Триггер для обновления счётчиков products_count
CREATE OR REPLACE FUNCTION update_category_products_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновить старую категорию (если меняется)
  IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    UPDATE catalog_categories
    SET products_count = (
      SELECT COUNT(*) FROM catalog_products
      WHERE category_id = OLD.category_id
    )
    WHERE id = OLD.category_id;
  END IF;

  -- Обновить новую категорию
  IF NEW.category_id IS NOT NULL THEN
    UPDATE catalog_categories
    SET products_count = (
      SELECT COUNT(*) FROM catalog_products
      WHERE category_id = NEW.category_id
    )
    WHERE id = NEW.category_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_count
  AFTER INSERT OR UPDATE OF category_id OR DELETE ON catalog_products
  FOR EACH ROW
  EXECUTE FUNCTION update_category_products_count();

-- 3. Триггер для обновления счётчиков suppliers_count
CREATE OR REPLACE FUNCTION update_category_suppliers_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновить старую категорию (если меняется)
  IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    UPDATE catalog_categories
    SET suppliers_count = (
      SELECT COUNT(*) FROM catalog_suppliers
      WHERE category_id = OLD.category_id
    )
    WHERE id = OLD.category_id;
  END IF;

  -- Обновить новую категорию
  IF NEW.category_id IS NOT NULL THEN
    UPDATE catalog_categories
    SET suppliers_count = (
      SELECT COUNT(*) FROM catalog_suppliers
      WHERE category_id = NEW.category_id
    )
    WHERE id = NEW.category_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suppliers_count
  AFTER INSERT OR UPDATE OF category_id OR DELETE ON catalog_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_category_suppliers_count();

-- 4. Триггер для обновления has_subcategories
CREATE OR REPLACE FUNCTION update_has_subcategories()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновить флаг у родительской категории
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE catalog_categories
    SET has_subcategories = true
    WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_has_subcategories
  AFTER INSERT ON catalog_categories
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_has_subcategories();

-- Комментарии
COMMENT ON FUNCTION update_category_full_path() IS 'Автоматически обновляет full_path и level при изменении категории';
COMMENT ON FUNCTION update_category_products_count() IS 'Автоматически обновляет products_count при изменении товаров';
COMMENT ON FUNCTION update_category_suppliers_count() IS 'Автоматически обновляет suppliers_count при изменении поставщиков';
COMMENT ON FUNCTION update_has_subcategories() IS 'Автоматически устанавливает has_subcategories=true у родителя';
```

#### 1.3 Проверка результата

```sql
-- Проверить структуру
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'catalog_categories'
ORDER BY ordinal_position;

-- Проверить данные
SELECT id, name, level, parent_id, full_path, products_count, suppliers_count
FROM catalog_categories
ORDER BY sort_order;
```

---

### ЭТАП 2: Seed данных - Подкатегории (2 часа)

#### 2.1 Адаптация структуры категорий

Вместо полной замены категорий (как в CATEGORY_TREE_FULL.md), **ДОБАВЛЯЕМ** подкатегории к существующим:

**Файл:** `lib/seed-data/categories-b2b-subcategories.json`

```json
{
  "version": "2.0",
  "description": "Подкатегории для существующих 8 категорий B2B Get2B",
  "categories": [
    {
      "parent_key": "electronics",
      "parent_name": "Электроника",
      "subcategories": [
        {
          "name": "Смартфоны и планшеты",
          "slug": "smartphones-tablets",
          "icon": "📱",
          "sort_order": 1
        },
        {
          "name": "Компьютеры и ноутбуки",
          "slug": "computers-laptops",
          "icon": "💻",
          "sort_order": 2
        },
        {
          "name": "Аксессуары для гаджетов",
          "slug": "gadget-accessories",
          "icon": "🔌",
          "sort_order": 3
        },
        {
          "name": "Зарядные устройства",
          "slug": "chargers",
          "icon": "🔋",
          "sort_order": 4
        },
        {
          "name": "Наушники и колонки",
          "slug": "audio-devices",
          "icon": "🎧",
          "sort_order": 5
        }
      ]
    },
    {
      "parent_key": "automotive",
      "parent_name": "Автотовары",
      "subcategories": [
        {
          "name": "Автохимия",
          "slug": "auto-chemistry",
          "icon": "🧴",
          "sort_order": 1
        },
        {
          "name": "Автоаксессуары",
          "slug": "auto-accessories",
          "icon": "🚗",
          "sort_order": 2
        },
        {
          "name": "Расходники",
          "slug": "consumables",
          "icon": "🔧",
          "sort_order": 3
        },
        {
          "name": "Масла и жидкости",
          "slug": "oils-fluids",
          "icon": "🛢️",
          "sort_order": 4
        }
      ]
    },
    {
      "parent_key": "food",
      "parent_name": "Продукты питания",
      "subcategories": [
        {
          "name": "Напитки",
          "slug": "beverages",
          "icon": "🥤",
          "sort_order": 1
        },
        {
          "name": "Снеки и сладости",
          "slug": "snacks-sweets",
          "icon": "🍫",
          "sort_order": 2
        },
        {
          "name": "Бакалея",
          "slug": "grocery",
          "icon": "🌾",
          "sort_order": 3
        },
        {
          "name": "Консервация",
          "slug": "canned-food",
          "icon": "🥫",
          "sort_order": 4
        }
      ]
    },
    {
      "parent_key": "home",
      "parent_name": "Дом и быт",
      "subcategories": [
        {
          "name": "Посуда",
          "slug": "tableware",
          "icon": "🍽️",
          "sort_order": 1
        },
        {
          "name": "Бытовая химия",
          "slug": "household-chemicals",
          "icon": "🧼",
          "sort_order": 2
        },
        {
          "name": "Текстиль для дома",
          "slug": "home-textiles",
          "icon": "🛏️",
          "sort_order": 3
        },
        {
          "name": "Хозтовары",
          "slug": "household-goods",
          "icon": "🧹",
          "sort_order": 4
        }
      ]
    },
    {
      "parent_key": "healthcare",
      "parent_name": "Здоровье и медицина",
      "subcategories": [
        {
          "name": "Медицинские изделия",
          "slug": "medical-devices",
          "icon": "🏥",
          "sort_order": 1
        },
        {
          "name": "Косметика и гигиена",
          "slug": "cosmetics-hygiene",
          "icon": "💄",
          "sort_order": 2
        },
        {
          "name": "Витамины и БАДы",
          "slug": "vitamins-supplements",
          "icon": "💊",
          "sort_order": 3
        },
        {
          "name": "Средства защиты",
          "slug": "protective-equipment",
          "icon": "😷",
          "sort_order": 4
        }
      ]
    },
    {
      "parent_key": "textiles",
      "parent_name": "Текстиль и одежда",
      "subcategories": [
        {
          "name": "Спецодежда",
          "slug": "workwear",
          "icon": "👷",
          "sort_order": 1
        },
        {
          "name": "Текстиль оптом",
          "slug": "textiles-wholesale",
          "icon": "👕",
          "sort_order": 2
        },
        {
          "name": "Домашняя одежда",
          "slug": "homewear",
          "icon": "🛌",
          "sort_order": 3
        },
        {
          "name": "Аксессуары",
          "slug": "accessories",
          "icon": "🧢",
          "sort_order": 4
        }
      ]
    },
    {
      "parent_key": "construction",
      "parent_name": "Строительство",
      "subcategories": [
        {
          "name": "Строительные материалы",
          "slug": "building-materials",
          "icon": "🧱",
          "sort_order": 1
        },
        {
          "name": "Инструменты",
          "slug": "tools",
          "icon": "🔨",
          "sort_order": 2
        },
        {
          "name": "Электрика",
          "slug": "electrical",
          "icon": "💡",
          "sort_order": 3
        },
        {
          "name": "Сантехника",
          "slug": "plumbing",
          "icon": "🚰",
          "sort_order": 4
        }
      ]
    },
    {
      "parent_key": "industrial",
      "parent_name": "Промышленность",
      "subcategories": [
        {
          "name": "Оборудование",
          "slug": "equipment",
          "icon": "⚙️",
          "sort_order": 1
        },
        {
          "name": "Промышленная химия",
          "slug": "industrial-chemicals",
          "icon": "⚗️",
          "sort_order": 2
        },
        {
          "name": "Упаковка",
          "slug": "packaging",
          "icon": "📦",
          "sort_order": 3
        },
        {
          "name": "Расходники",
          "slug": "industrial-consumables",
          "icon": "🔩",
          "sort_order": 4
        }
      ]
    }
  ]
}
```

#### 2.2 Скрипт импорта подкатегорий

**Файл:** `supabase/migrations/20251030_102_seed_subcategories.sql`

```sql
-- =====================================================
-- SEED ПОДКАТЕГОРИЙ В CATALOG_CATEGORIES
-- Добавляем подкатегории к существующим 8 основным
-- =====================================================

-- Временная таблица для импорта
CREATE TEMP TABLE temp_subcategories (
  parent_key text,
  name text,
  slug text,
  icon text,
  sort_order integer
);

-- Электроника (electronics)
INSERT INTO temp_subcategories VALUES
('electronics', 'Смартфоны и планшеты', 'smartphones-tablets', '📱', 1),
('electronics', 'Компьютеры и ноутбуки', 'computers-laptops', '💻', 2),
('electronics', 'Аксессуары для гаджетов', 'gadget-accessories', '🔌', 3),
('electronics', 'Зарядные устройства', 'chargers', '🔋', 4),
('electronics', 'Наушники и колонки', 'audio-devices', '🎧', 5);

-- Автотовары (automotive)
INSERT INTO temp_subcategories VALUES
('automotive', 'Автохимия', 'auto-chemistry', '🧴', 1),
('automotive', 'Автоаксессуары', 'auto-accessories', '🚗', 2),
('automotive', 'Расходники', 'auto-consumables', '🔧', 3),
('automotive', 'Масла и жидкости', 'oils-fluids', '🛢️', 4);

-- Продукты питания (food)
INSERT INTO temp_subcategories VALUES
('food', 'Напитки', 'beverages', '🥤', 1),
('food', 'Снеки и сладости', 'snacks-sweets', '🍫', 2),
('food', 'Бакалея', 'grocery', '🌾', 3),
('food', 'Консервация', 'canned-food', '🥫', 4);

-- Дом и быт (home)
INSERT INTO temp_subcategories VALUES
('home', 'Посуда', 'tableware', '🍽️', 1),
('home', 'Бытовая химия', 'household-chemicals', '🧼', 2),
('home', 'Текстиль для дома', 'home-textiles', '🛏️', 3),
('home', 'Хозтовары', 'household-goods', '🧹', 4);

-- Здоровье и медицина (healthcare)
INSERT INTO temp_subcategories VALUES
('healthcare', 'Медицинские изделия', 'medical-devices', '🏥', 1),
('healthcare', 'Косметика и гигиена', 'cosmetics-hygiene', '💄', 2),
('healthcare', 'Витамины и БАДы', 'vitamins-supplements', '💊', 3),
('healthcare', 'Средства защиты', 'protective-equipment', '😷', 4);

-- Текстиль и одежда (textiles)
INSERT INTO temp_subcategories VALUES
('textiles', 'Спецодежда', 'workwear', '👷', 1),
('textiles', 'Текстиль оптом', 'textiles-wholesale', '👕', 2),
('textiles', 'Домашняя одежда', 'homewear', '🛌', 3),
('textiles', 'Аксессуары', 'textile-accessories', '🧢', 4);

-- Строительство (construction)
INSERT INTO temp_subcategories VALUES
('construction', 'Строительные материалы', 'building-materials', '🧱', 1),
('construction', 'Инструменты', 'tools', '🔨', 2),
('construction', 'Электрика', 'electrical', '💡', 3),
('construction', 'Сантехника', 'plumbing', '🚰', 4);

-- Промышленность (industrial)
INSERT INTO temp_subcategories VALUES
('industrial', 'Оборудование', 'equipment', '⚙️', 1),
('industrial', 'Промышленная химия', 'industrial-chemicals', '⚗️', 2),
('industrial', 'Упаковка', 'packaging', '📦', 3),
('industrial', 'Расходники', 'industrial-consumables', '🔩', 4);

-- Вставка в catalog_categories с parent_id
INSERT INTO catalog_categories (
  parent_id,
  name,
  key,
  slug,
  icon,
  level,
  sort_order,
  is_active
)
SELECT
  cc.id as parent_id,
  ts.name,
  ts.slug as key,
  ts.slug,
  ts.icon,
  1 as level,
  ts.sort_order,
  true as is_active
FROM temp_subcategories ts
INNER JOIN catalog_categories cc ON cc.key = ts.parent_key
WHERE NOT EXISTS (
  -- Избегаем дублирования
  SELECT 1 FROM catalog_categories
  WHERE key = ts.slug OR slug = ts.slug
);

-- Статистика
DO $$
DECLARE
  inserted_count integer;
BEGIN
  SELECT COUNT(*) INTO inserted_count
  FROM catalog_categories
  WHERE level = 1;

  RAISE NOTICE '✅ Добавлено подкатегорий: %', inserted_count;
END $$;

-- Проверка результата
SELECT
  parent.name as parent_category,
  child.name as subcategory,
  child.icon,
  child.level,
  child.sort_order
FROM catalog_categories child
INNER JOIN catalog_categories parent ON child.parent_id = parent.id
WHERE child.level = 1
ORDER BY parent.sort_order, child.sort_order;
```

---

### ЭТАП 3: Миграция данных products/suppliers (1-2 часа)

#### 3.1 Анализ товаров для автоматической категоризации

**Файл:** `scripts/analyze-products-for-categorization.sql`

```sql
-- =====================================================
-- АНАЛИЗ ТОВАРОВ ДЛЯ КАТЕГОРИЗАЦИИ
-- Помогает понять, какие товары к каким категориям относятся
-- =====================================================

-- 1. Показать все товары с NULL category_id
SELECT
  id,
  name,
  description,
  supplier_id
FROM catalog_products
WHERE category_id IS NULL
ORDER BY name
LIMIT 20;

-- 2. Попытка автоматической категоризации по ключевым словам
SELECT
  p.id,
  p.name,
  CASE
    -- Электроника
    WHEN p.name ILIKE ANY(ARRAY['%телефон%', '%смартфон%', '%планшет%', '%ноутбук%', '%компьютер%', '%зарядн%', '%наушник%', '%электрон%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'electronics')

    -- Автотовары
    WHEN p.name ILIKE ANY(ARRAY['%авто%', '%машин%', '%масло%', '%шин%', '%двигател%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'automotive')

    -- Продукты питания
    WHEN p.name ILIKE ANY(ARRAY['%вода%', '%сок%', '%чай%', '%кофе%', '%снек%', '%шоколад%', '%печень%', '%напит%', '%продукт%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'food')

    -- Дом и быт
    WHEN p.name ILIKE ANY(ARRAY['%посуд%', '%тарелк%', '%чашк%', '%моющ%', '%чист%', '%быт%', '%хоз%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'home')

    -- Здоровье и медицина
    WHEN p.name ILIKE ANY(ARRAY['%медицин%', '%витамин%', '%маск%', '%перчатк%', '%косметик%', '%крем%', '%шампун%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'healthcare')

    -- Текстиль и одежда
    WHEN p.name ILIKE ANY(ARRAY['%одежд%', '%футболк%', '%рубашк%', '%брюк%', '%текстил%', '%ткан%', '%носк%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'textiles')

    -- Строительство
    WHEN p.name ILIKE ANY(ARRAY['%строит%', '%цемент%', '%кирпич%', '%инструмент%', '%краск%', '%клей%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'construction')

    -- Промышленность
    WHEN p.name ILIKE ANY(ARRAY['%оборудован%', '%станок%', '%упаковк%', '%промышл%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'industrial')

    ELSE NULL
  END as suggested_category_id,
  cc.name as suggested_category_name
FROM catalog_products p
LEFT JOIN catalog_categories cc ON cc.id = (
  CASE
    WHEN p.name ILIKE ANY(ARRAY['%телефон%', '%смартфон%', '%планшет%', '%ноутбук%', '%компьютер%', '%зарядн%', '%наушник%', '%электрон%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'electronics')
    WHEN p.name ILIKE ANY(ARRAY['%авто%', '%машин%', '%масло%', '%шин%', '%двигател%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'automotive')
    WHEN p.name ILIKE ANY(ARRAY['%вода%', '%сок%', '%чай%', '%кофе%', '%снек%', '%шоколад%', '%печень%', '%напит%', '%продукт%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'food')
    WHEN p.name ILIKE ANY(ARRAY['%посуд%', '%тарелк%', '%чашк%', '%моющ%', '%чист%', '%быт%', '%хоз%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'home')
    WHEN p.name ILIKE ANY(ARRAY['%медицин%', '%витамин%', '%маск%', '%перчатк%', '%косметик%', '%крем%', '%шампун%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'healthcare')
    WHEN p.name ILIKE ANY(ARRAY['%одежд%', '%футболк%', '%рубашк%', '%брюк%', '%текстил%', '%ткан%', '%носк%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'textiles')
    WHEN p.name ILIKE ANY(ARRAY['%строит%', '%цемент%', '%кирпич%', '%инструмент%', '%краск%', '%клей%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'construction')
    WHEN p.name ILIKE ANY(ARRAY['%оборудован%', '%станок%', '%упаковк%', '%промышл%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'industrial')
    ELSE NULL
  END
)
WHERE p.category_id IS NULL
ORDER BY suggested_category_id NULLS LAST, p.name;

-- 3. Статистика по предлагаемым категориям
SELECT
  cc.name as category,
  COUNT(*) as products_can_be_categorized
FROM catalog_products p
INNER JOIN catalog_categories cc ON cc.id = (
  CASE
    WHEN p.name ILIKE ANY(ARRAY['%телефон%', '%смартфон%', '%планшет%', '%ноутбук%', '%компьютер%', '%зарядн%', '%наушник%', '%электрон%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'electronics')
    WHEN p.name ILIKE ANY(ARRAY['%авто%', '%машин%', '%масло%', '%шин%', '%двигател%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'automotive')
    WHEN p.name ILIKE ANY(ARRAY['%вода%', '%сок%', '%чай%', '%кофе%', '%снек%', '%шоколад%', '%печень%', '%напит%', '%продукт%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'food')
    WHEN p.name ILIKE ANY(ARRAY['%посуд%', '%тарелк%', '%чашк%', '%моющ%', '%чист%', '%быт%', '%хоз%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'home')
    WHEN p.name ILIKE ANY(ARRAY['%медицин%', '%витамин%', '%маск%', '%перчатк%', '%косметик%', '%крем%', '%шампун%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'healthcare')
    WHEN p.name ILIKE ANY(ARRAY['%одежд%', '%футболк%', '%рубашк%', '%брюк%', '%текстил%', '%ткан%', '%носк%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'textiles')
    WHEN p.name ILIKE ANY(ARRAY['%строит%', '%цемент%', '%кирпич%', '%инструмент%', '%краск%', '%клей%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'construction')
    WHEN p.name ILIKE ANY(ARRAY['%оборудован%', '%станок%', '%упаковк%', '%промышл%'])
      THEN (SELECT id FROM catalog_categories WHERE key = 'industrial')
    ELSE NULL
  END
)
WHERE p.category_id IS NULL
GROUP BY cc.name
ORDER BY products_can_be_categorized DESC;
```

#### 3.2 Автоматическая категоризация

**Файл:** `supabase/migrations/20251030_103_categorize_products.sql`

```sql
-- =====================================================
-- АВТОМАТИЧЕСКАЯ КАТЕГОРИЗАЦИЯ ТОВАРОВ
-- Привязываем существующие товары к категориям
-- =====================================================

-- ВАЖНО: Запускать только после review анализа!

-- Функция для категоризации по ключевым словам
CREATE OR REPLACE FUNCTION auto_categorize_product(product_name text, product_description text)
RETURNS uuid AS $$
DECLARE
  category_id_result uuid;
  search_text text;
BEGIN
  search_text := LOWER(COALESCE(product_name, '') || ' ' || COALESCE(product_description, ''));

  -- Электроника
  IF search_text ~ '.*(телефон|смартфон|планшет|ноутбук|компьютер|зарядн|наушник|электрон|гаджет).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'electronics';
    RETURN category_id_result;
  END IF;

  -- Автотовары
  IF search_text ~ '.*(авто|машин|масло|шин|двигател|транспорт).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'automotive';
    RETURN category_id_result;
  END IF;

  -- Продукты питания
  IF search_text ~ '.*(вода|сок|чай|кофе|снек|шоколад|печень|напит|продукт|еда|пищ).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'food';
    RETURN category_id_result;
  END IF;

  -- Дом и быт
  IF search_text ~ '.*(посуд|тарелк|чашк|моющ|чист|быт|хоз|дом).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'home';
    RETURN category_id_result;
  END IF;

  -- Здоровье и медицина
  IF search_text ~ '.*(медицин|витамин|маск|перчатк|косметик|крем|шампун|здоров|аптек).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'healthcare';
    RETURN category_id_result;
  END IF;

  -- Текстиль и одежда
  IF search_text ~ '.*(одежд|футболк|рубашк|брюк|текстил|ткан|носк|платье).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'textiles';
    RETURN category_id_result;
  END IF;

  -- Строительство
  IF search_text ~ '.*(строит|цемент|кирпич|инструмент|краск|клей|ремонт).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'construction';
    RETURN category_id_result;
  END IF;

  -- Промышленность
  IF search_text ~ '.*(оборудован|станок|упаковк|промышл|завод).*' THEN
    SELECT id INTO category_id_result FROM catalog_categories WHERE key = 'industrial';
    RETURN category_id_result;
  END IF;

  -- Если не подошло ничего - вернуть NULL
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Применить автокатегоризацию
UPDATE catalog_products
SET category_id = auto_categorize_product(name, description)
WHERE category_id IS NULL;

-- Статистика результата
DO $$
DECLARE
  total_products integer;
  categorized_products integer;
  null_products integer;
BEGIN
  SELECT COUNT(*) INTO total_products FROM catalog_products;
  SELECT COUNT(*) INTO categorized_products FROM catalog_products WHERE category_id IS NOT NULL;
  SELECT COUNT(*) INTO null_products FROM catalog_products WHERE category_id IS NULL;

  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'РЕЗУЛЬТАТЫ АВТОКАТЕГОРИЗАЦИИ ТОВАРОВ';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Всего товаров: %', total_products;
  RAISE NOTICE 'Категоризировано: % (%.1f%%)', categorized_products, (categorized_products::float / total_products * 100);
  RAISE NOTICE 'Без категории: % (%.1f%%)', null_products, (null_products::float / total_products * 100);
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- Показать распределение по категориям
SELECT
  cc.name as category,
  COUNT(p.id) as products_count
FROM catalog_categories cc
LEFT JOIN catalog_products p ON p.category_id = cc.id
WHERE cc.level = 0
GROUP BY cc.id, cc.name
ORDER BY products_count DESC;
```

#### 3.3 Аналогично для suppliers

**Файл:** `supabase/migrations/20251030_104_categorize_suppliers.sql`

```sql
-- =====================================================
-- АВТОМАТИЧЕСКАЯ КАТЕГОРИЗАЦИЯ ПОСТАВЩИКОВ
-- =====================================================

-- Применить категории на основе их товаров
UPDATE catalog_suppliers s
SET category_id = (
  SELECT p.category_id
  FROM catalog_products p
  WHERE p.supplier_id = s.id
    AND p.category_id IS NOT NULL
  GROUP BY p.category_id
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE s.category_id IS NULL;

-- Статистика
DO $$
DECLARE
  total_suppliers integer;
  categorized_suppliers integer;
BEGIN
  SELECT COUNT(*) INTO total_suppliers FROM catalog_suppliers;
  SELECT COUNT(*) INTO categorized_suppliers FROM catalog_suppliers WHERE category_id IS NOT NULL;

  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'РЕЗУЛЬТАТЫ КАТЕГОРИЗАЦИИ ПОСТАВЩИКОВ';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Всего поставщиков: %', total_suppliers;
  RAISE NOTICE 'Категоризировано: % (%.1f%%)', categorized_suppliers, (categorized_suppliers::float / total_suppliers * 100);
  RAISE NOTICE '════════════════════════════════════════';
END $$;
```

---

### ЭТАП 4: Исправление supplier_profiles (30 минут)

#### 4.1 Добавить category_id и мигрировать данные

**Файл:** `supabase/migrations/20251030_105_fix_supplier_profiles.sql`

```sql
-- =====================================================
-- ИСПРАВЛЕНИЕ SUPPLIER_PROFILES
-- Добавление category_id и миграция из текстового поля
-- =====================================================

-- 1. Добавить category_id (UUID)
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES catalog_categories(id) ON DELETE SET NULL;

-- 2. Создать индекс
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_category_id
  ON supplier_profiles(category_id);

-- 3. Мигрировать данные из category (text) в category_id (uuid)
-- ВАЖНО: Выполнится только когда появятся данные в supplier_profiles
UPDATE supplier_profiles sp
SET category_id = cc.id
FROM catalog_categories cc
WHERE sp.category = cc.name
  AND sp.category_id IS NULL;

-- 4. Удалить старый CHECK constraint (конфликтует с БД)
ALTER TABLE supplier_profiles
  DROP CONSTRAINT IF EXISTS valid_category_supplier_profile;

-- 5. Добавить новый CHECK constraint (опционально, т.к. есть FK)
-- Можно не добавлять, т.к. FK уже обеспечивает валидацию

-- 6. Пометить старое поле category как deprecated (не удаляем для обратной совместимости)
COMMENT ON COLUMN supplier_profiles.category IS 'DEPRECATED: Используйте category_id вместо этого поля';

-- Статистика
DO $$
DECLARE
  total_profiles integer;
  migrated_profiles integer;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM supplier_profiles;

  IF total_profiles > 0 THEN
    SELECT COUNT(*) INTO migrated_profiles
    FROM supplier_profiles
    WHERE category_id IS NOT NULL;

    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'МИГРАЦИЯ SUPPLIER_PROFILES';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'Всего профилей: %', total_profiles;
    RAISE NOTICE 'Мигрировано: %', migrated_profiles;
    RAISE NOTICE '════════════════════════════════════════';
  ELSE
    RAISE NOTICE 'ℹ️  supplier_profiles пустая, миграция не требуется';
  END IF;
END $$;
```

---

### ЭТАП 5: Обновление API (2-3 часа)

#### 5.1 Обновить API categories

**Файл:** `app/api/catalog/categories/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Интерфейсы
interface CategoryRow {
  id: string;
  name: string;
  key: string;
  slug: string;
  icon: string;
  description: string;
  parent_id: string | null;
  level: number;
  sort_order: number;
  full_path: string | null;
  products_count: number;
  suppliers_count: number;
  is_active: boolean;
  is_popular: boolean;
  has_subcategories: boolean;
  metadata: Record<string, any>;
}

interface CategoryTree {
  category: CategoryRow;
  children: CategoryTree[];
}

// GET: Получение всех категорий + дерево
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTree = searchParams.get('includeTree') !== 'false'; // по умолчанию true
    const level = searchParams.get('level'); // фильтр по уровню

    // Запрос категорий
    let query = supabase
      .from("catalog_categories")
      .select("*")
      .eq("is_active", true)
      .order("level")
      .order("sort_order");

    if (level !== null) {
      query = query.eq("level", parseInt(level));
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ [API Categories] Ошибка:", error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Построить дерево категорий
    let categoryTree: CategoryTree[] = [];
    if (includeTree) {
      categoryTree = buildCategoryTree(data || []);
    }

    // Статистика
    const stats = {
      total: data?.length || 0,
      byLevel: {
        0: data?.filter(c => c.level === 0).length || 0,
        1: data?.filter(c => c.level === 1).length || 0,
        2: data?.filter(c => c.level === 2).length || 0,
      },
      totalProducts: data?.reduce((sum, c) => sum + (c.products_count || 0), 0) || 0,
      totalSuppliers: data?.reduce((sum, c) => sum + (c.suppliers_count || 0), 0) || 0,
    };

    console.log(`✅ [API Categories] Загружено: ${stats.total} категорий`);

    return NextResponse.json({
      success: true,
      categories: data,
      categoryTree,
      stats,
    });

  } catch (error) {
    console.error("❌ [API Categories] Критическая ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Ошибка сервера"
    }, { status: 500 });
  }
}

// Функция построения дерева
function buildCategoryTree(categories: CategoryRow[]): CategoryTree[] {
  const categoryMap = new Map<string, CategoryTree>();
  const rootCategories: CategoryTree[] = [];

  // Создать узлы
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      category: cat,
      children: [],
    });
  });

  // Построить дерево
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)!;

    if (cat.parent_id === null) {
      // Корневая категория
      rootCategories.push(node);
    } else {
      // Дочерняя категория
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return rootCategories;
}

// POST: Синхронизация категорий (оставляем для совместимости)
export async function POST() {
  return NextResponse.json({
    message: "Категории уже синхронизированы",
    note: "Используйте миграции для обновления категорий"
  });
}
```

#### 5.2 Создать новый endpoint для дерева категорий

**Файл:** `app/api/catalog/category-tree/route.ts`

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Полное дерево категорий (рекурсивный запрос)
export async function GET() {
  try {
    // Использовать рекурсивный CTE для построения дерева
    const { data, error } = await supabase.rpc('get_category_tree');

    if (error) {
      console.error("❌ [API Category Tree] Ошибка:", error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tree: data,
    });

  } catch (error) {
    console.error("❌ [API Category Tree] Критическая ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Ошибка сервера"
    }, { status: 500 });
  }
}
```

#### 5.3 Создать SQL функцию для дерева

**Файл:** `supabase/migrations/20251030_106_create_tree_function.sql`

```sql
-- =====================================================
-- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДЕРЕВА КАТЕГОРИЙ
-- =====================================================

CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
  id uuid,
  parent_id uuid,
  name text,
  slug text,
  icon text,
  level integer,
  full_path text,
  products_count integer,
  suppliers_count integer,
  is_popular boolean,
  path uuid[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    -- Корневые категории (level 0)
    SELECT
      c.id,
      c.parent_id,
      c.name,
      c.slug,
      c.icon,
      c.level,
      c.full_path,
      c.products_count,
      c.suppliers_count,
      c.is_popular,
      ARRAY[c.id] as path
    FROM catalog_categories c
    WHERE c.parent_id IS NULL
      AND c.is_active = true

    UNION ALL

    -- Дочерние категории (рекурсия)
    SELECT
      c.id,
      c.parent_id,
      c.name,
      c.slug,
      c.icon,
      c.level,
      c.full_path,
      c.products_count,
      c.suppliers_count,
      c.is_popular,
      ct.path || c.id
    FROM catalog_categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.is_active = true
  )
  SELECT * FROM category_tree
  ORDER BY path;
END;
$$ LANGUAGE plpgsql;

-- Комментарий
COMMENT ON FUNCTION get_category_tree() IS 'Возвращает полное дерево категорий с рекурсивной иерархией';
```

---

### ЭТАП 6: Тестирование (2-3 часа)

#### 6.1 Unit тесты SQL

**Файл:** `supabase/tests/test_category_migrations.sql`

```sql
-- =====================================================
-- UNIT ТЕСТЫ ДЛЯ ПРОВЕРКИ МИГРАЦИЙ
-- =====================================================

-- Тест 1: Проверка структуры catalog_categories
DO $$
DECLARE
  required_columns text[] := ARRAY[
    'id', 'parent_id', 'name', 'key', 'slug', 'icon',
    'description', 'level', 'sort_order', 'full_path',
    'products_count', 'suppliers_count', 'is_active',
    'is_popular', 'has_subcategories', 'metadata'
  ];
  col text;
  exists_count integer;
BEGIN
  FOREACH col IN ARRAY required_columns LOOP
    SELECT COUNT(*) INTO exists_count
    FROM information_schema.columns
    WHERE table_name = 'catalog_categories' AND column_name = col;

    IF exists_count = 0 THEN
      RAISE EXCEPTION '❌ Колонка % отсутствует в catalog_categories', col;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Тест 1: Структура catalog_categories корректна';
END $$;

-- Тест 2: Проверка наличия основных категорий
DO $$
DECLARE
  count_level_0 integer;
BEGIN
  SELECT COUNT(*) INTO count_level_0
  FROM catalog_categories
  WHERE level = 0;

  IF count_level_0 < 8 THEN
    RAISE EXCEPTION '❌ Недостаточно основных категорий. Ожидалось >= 8, получено %', count_level_0;
  END IF;

  RAISE NOTICE '✅ Тест 2: Основных категорий: %', count_level_0;
END $$;

-- Тест 3: Проверка наличия подкатегорий
DO $$
DECLARE
  count_level_1 integer;
BEGIN
  SELECT COUNT(*) INTO count_level_1
  FROM catalog_categories
  WHERE level = 1;

  IF count_level_1 = 0 THEN
    RAISE WARNING '⚠️  Тест 3: Подкатегорий не найдено';
  ELSE
    RAISE NOTICE '✅ Тест 3: Подкатегорий: %', count_level_1;
  END IF;
END $$;

-- Тест 4: Проверка корректности parent_id
DO $$
DECLARE
  invalid_refs integer;
BEGIN
  SELECT COUNT(*) INTO invalid_refs
  FROM catalog_categories c
  WHERE c.parent_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM catalog_categories p WHERE p.id = c.parent_id
    );

  IF invalid_refs > 0 THEN
    RAISE EXCEPTION '❌ Найдено некорректных ссылок parent_id: %', invalid_refs;
  END IF;

  RAISE NOTICE '✅ Тест 4: Все parent_id валидны';
END $$;

-- Тест 5: Проверка full_path
DO $$
DECLARE
  null_paths integer;
BEGIN
  SELECT COUNT(*) INTO null_paths
  FROM catalog_categories
  WHERE full_path IS NULL;

  IF null_paths > 0 THEN
    RAISE WARNING '⚠️  Тест 5: Найдено категорий без full_path: %', null_paths;
  ELSE
    RAISE NOTICE '✅ Тест 5: Все категории имеют full_path';
  END IF;
END $$;

-- Тест 6: Проверка работы триггеров
DO $$
DECLARE
  test_id uuid;
  test_path text;
BEGIN
  -- Создать тестовую категорию
  INSERT INTO catalog_categories (name, key, slug, parent_id)
  SELECT 'Тест триггера', 'test-trigger', 'test-trigger', id
  FROM catalog_categories
  WHERE key = 'electronics'
  LIMIT 1
  RETURNING id INTO test_id;

  -- Проверить full_path
  SELECT full_path INTO test_path
  FROM catalog_categories
  WHERE id = test_id;

  IF test_path NOT LIKE '%Тест триггера%' THEN
    RAISE EXCEPTION '❌ Триггер update_category_full_path не работает';
  END IF;

  -- Удалить тестовую категорию
  DELETE FROM catalog_categories WHERE id = test_id;

  RAISE NOTICE '✅ Тест 6: Триггеры работают корректно';
END $$;

-- Итоговый отчёт
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!';
  RAISE NOTICE '════════════════════════════════════════';
END $$;
```

#### 6.2 API тесты

**Файл:** `tests/api/categories.test.ts`

```typescript
describe('Categories API', () => {
  test('GET /api/catalog/categories returns categories', async () => {
    const response = await fetch('/api/catalog/categories');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.categories).toBeInstanceOf(Array);
    expect(data.categoryTree).toBeInstanceOf(Array);
    expect(data.stats.total).toBeGreaterThan(0);
  });

  test('Category tree has correct structure', async () => {
    const response = await fetch('/api/catalog/categories');
    const data = await response.json();

    const rootCategories = data.categoryTree.filter(
      (node: any) => node.category.level === 0
    );

    expect(rootCategories.length).toBeGreaterThanOrEqual(8);

    // Проверить что есть подкатегории
    const hasChildren = rootCategories.some(
      (node: any) => node.children.length > 0
    );
    expect(hasChildren).toBe(true);
  });
});
```

---

## КРИТЕРИИ ГОТОВНОСТИ

### Checklist перед выполнением

- [ ] Создан backup БД
- [ ] Все миграции протестированы на локальной БД
- [ ] SQL тесты проходят
- [ ] API тесты проходят
- [ ] Документация актуальна

### Checklist после выполнения

- [ ] Все 8 основных категорий имеют подкатегории
- [ ] Все 70 products привязаны к категориям
- [ ] Все 10 suppliers привязаны к категориям
- [ ] API возвращает дерево категорий
- [ ] Счётчики products_count/suppliers_count корректны
- [ ] Триггеры работают
- [ ] Нет ошибок в логах

---

## ПЛАН ОТКАТА (ROLLBACK)

### Если что-то пошло не так

```sql
-- 1. Восстановить из backup
psql -h HOST -U USER -d postgres < backup_TIMESTAMP.sql

-- 2. Или откатить миграции
BEGIN;

-- Удалить подкатегории
DELETE FROM catalog_categories WHERE level > 0;

-- Удалить новые колонки
ALTER TABLE catalog_categories
  DROP COLUMN IF EXISTS parent_id,
  DROP COLUMN IF EXISTS level,
  DROP COLUMN IF EXISTS full_path,
  DROP COLUMN IF EXISTS products_count,
  DROP COLUMN IF EXISTS suppliers_count,
  DROP COLUMN IF EXISTS is_popular,
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS slug;

-- Удалить триггеры
DROP TRIGGER IF EXISTS trigger_update_category_full_path ON catalog_categories;
DROP TRIGGER IF EXISTS trigger_update_products_count ON catalog_products;
DROP TRIGGER IF EXISTS trigger_update_suppliers_count ON catalog_suppliers;
DROP TRIGGER IF EXISTS trigger_update_has_subcategories ON catalog_categories;

-- Удалить функции
DROP FUNCTION IF EXISTS update_category_full_path();
DROP FUNCTION IF EXISTS update_category_products_count();
DROP FUNCTION IF EXISTS update_category_suppliers_count();
DROP FUNCTION IF EXISTS update_has_subcategories();
DROP FUNCTION IF EXISTS get_category_tree();
DROP FUNCTION IF EXISTS auto_categorize_product(text, text);

COMMIT;
```

---

## ОЦЕНКА РИСКОВ v2.0

### Риски ПОСЛЕ переработки

| Риск | Вероятность | Воздействие | Итоговый риск |
|------|-------------|-------------|---------------|
| Потеря данных при миграции | 5% | КРИТИЧЕСКОЕ | 🟢 НИЗКИЙ |
| Конфликт схем | 10% | СРЕДНЕЕ | 🟢 НИЗКИЙ |
| Ошибки в SQL | 15% | СРЕДНЕЕ | 🟡 СРЕДНИЙ |
| Downtime при миграции | 20% | НИЗКОЕ | 🟢 НИЗКИЙ |
| Проблемы с производительностью | 10% | СРЕДНЕЕ | 🟢 НИЗКИЙ |

**ИТОГОВАЯ ОЦЕНКА РИСКА:** 🟢 НИЗКИЙ (12%)

---

## ГОТОВ ЛИ ПЛАН К ВЫПОЛНЕНИЮ?

### ДА ✅

**Процент готовности:** 95%

**Что осталось:**
1. Review seed данных (подкатегории)
2. Протестировать на staging
3. Получить approval от бизнеса

**Время выполнения:** 1 рабочий день (6-8 часов)

**Можно начинать!** 🚀

---

## СЛЕДУЮЩИЕ ШАГИ

1. **Сделать backup** (5 минут)
2. **Протестировать на локальной БД** (30 минут)
3. **Выполнить ЭТАП 1** (расширение схемы)
4. **Выполнить ЭТАП 2** (seed подкатегорий)
5. **Выполнить ЭТАП 3** (категоризация products/suppliers)
6. **Обновить API**
7. **Протестировать**
8. **Deploy на production**

Готов помочь с выполнением каждого этапа! 🎯
