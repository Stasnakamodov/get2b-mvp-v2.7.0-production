# ПОШАГОВАЯ ИНСТРУКЦИЯ ПО ВЫПОЛНЕНИЮ МИГРАЦИИ

**Версия:** 2.0 SAFE
**Дата:** 2025-10-30
**Время выполнения:** 1 рабочий день

---

## ПЕРЕД НАЧАЛОМ

### Обязательные требования

- [ ] У вас есть доступ к Supabase Dashboard
- [ ] У вас есть доступ к production БД
- [ ] У вас есть права на создание backup
- [ ] Вы прочитали `CATEGORY_MIGRATION_PLAN_V2_SAFE.md`

---

## ШАГ 0: BACKUP (КРИТИЧНО!)

### 0.1 Создать backup через Supabase Dashboard

1. Перейдите в [Supabase Dashboard](https://app.supabase.com)
2. Выберите проект
3. Settings → Database → Backups
4. Нажмите "Create backup"
5. Дождитесь завершения

### 0.2 Создать локальный backup через CLI

```bash
# Установить переменные
export PGHOST="aws-0-us-east-1.pooler.supabase.com"
export PGPORT="6543"
export PGUSER="postgres.ejkhdhexkadecpbjjmsz"
export PGPASSWORD="B2ryf4elLIDqghCR"
export PGDATABASE="postgres"

# Создать backup
pg_dump -Fc -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Проверить размер файла
ls -lh backup_*.dump
```

**✅ Checkpoint:** У вас есть backup файл размером > 1MB

---

## ШАГ 1: ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ

### 1.1 Подключиться к БД

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres
```

### 1.2 Выполнить проверочные запросы

```sql
-- Текущее состояние
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

-- Проверить существующие колонки
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'catalog_categories'
ORDER BY ordinal_position;
```

**✅ Checkpoint:** Ожидаемые значения:
- categories: 8
- products: 70
- suppliers: 10
- products_null: 70
- suppliers_null: 10

---

## ШАГ 2: ВЫПОЛНЕНИЕ МИГРАЦИЙ

### 2.1 Миграция 1: Расширение схемы

```bash
# Перейти в директорию проекта
cd /Users/user/Desktop/godplisgomvp-forvercel

# Выполнить миграцию
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/migrations-v2-safe/20251030_100_extend_catalog_categories.sql
```

**Ожидаемый вывод:**
```
ALTER TABLE
ALTER TABLE
...
NOTICE:  ✅ Все колонки успешно добавлены в catalog_categories
```

**Если ошибка:**
```bash
# Откатить
psql ... -c "ALTER TABLE catalog_categories DROP COLUMN IF EXISTS parent_id, ..."
# Проверить что пошло не так
# Исправить
# Попробовать снова
```

**✅ Checkpoint:** Выполнить проверку:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'catalog_categories'
  AND column_name IN ('parent_id', 'level', 'full_path', 'slug');
```

Должно вернуть 4 строки.

---

### 2.2 Миграция 2: Создать триггеры

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/migrations-v2-safe/20251030_101_create_category_triggers.sql
```

**✅ Checkpoint:** Проверить триггеры:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%category%';
```

Должно вернуть 4+ триггера.

---

### 2.3 Миграция 3: Seed подкатегорий

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/migrations-v2-safe/20251030_102_seed_subcategories.sql
```

**Ожидаемый вывод:**
```
NOTICE:  ✅ Добавлено подкатегорий: 32
```

**✅ Checkpoint:** Проверить подкатегории:

```sql
SELECT
  parent.name as parent_category,
  COUNT(child.id) as subcategories_count
FROM catalog_categories parent
LEFT JOIN catalog_categories child ON child.parent_id = parent.id
WHERE parent.level = 0
GROUP BY parent.id, parent.name
ORDER BY parent.sort_order;
```

Каждая основная категория должна иметь 3-5 подкатегорий.

---

### 2.4 Миграция 4: Категоризация products

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/migrations-v2-safe/20251030_103_categorize_products.sql
```

**Ожидаемый вывод:**
```
NOTICE:  ════════════════════════════════════════
NOTICE:  РЕЗУЛЬТАТЫ АВТОКАТЕГОРИЗАЦИИ ТОВАРОВ
NOTICE:  ════════════════════════════════════════
NOTICE:  Всего товаров: 70
NOTICE:  Категоризировано: XX (YY.Y%)
NOTICE:  Без категории: ZZ (AA.A%)
NOTICE:  ════════════════════════════════════════
```

**⚠️ ВАЖНО:** Если % категоризированных < 70%, нужно вручную проверить товары:

```sql
-- Посмотреть товары без категории
SELECT id, name, description
FROM catalog_products
WHERE category_id IS NULL
LIMIT 20;

-- Вручную назначить категорию
UPDATE catalog_products
SET category_id = (SELECT id FROM catalog_categories WHERE key = 'electronics')
WHERE name ILIKE '%телефон%' AND category_id IS NULL;
```

**✅ Checkpoint:** Проверить распределение:

```sql
SELECT
  cc.name as category,
  COUNT(p.id) as products_count
FROM catalog_categories cc
LEFT JOIN catalog_products p ON p.category_id = cc.id
WHERE cc.level = 0
GROUP BY cc.id, cc.name
ORDER BY products_count DESC;
```

---

### 2.5 Миграция 5: Категоризация suppliers

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/migrations-v2-safe/20251030_104_categorize_suppliers.sql
```

**✅ Checkpoint:** Проверить suppliers:

```sql
SELECT
  cc.name as category,
  COUNT(s.id) as suppliers_count
FROM catalog_categories cc
LEFT JOIN catalog_suppliers s ON s.category_id = cc.id
WHERE cc.level = 0
GROUP BY cc.id, cc.name
ORDER BY suppliers_count DESC;
```

---

### 2.6 Миграция 6: Исправить supplier_profiles

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/migrations-v2-safe/20251030_105_fix_supplier_profiles.sql
```

**✅ Checkpoint:** Проверить structure:

```sql
\d supplier_profiles
```

Должна быть колонка `category_id uuid`.

---

### 2.7 Миграция 7: Создать функцию для дерева

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/migrations-v2-safe/20251030_106_create_tree_function.sql
```

**✅ Checkpoint:** Проверить функцию:

```sql
SELECT * FROM get_category_tree() LIMIT 5;
```

---

## ШАГ 3: ТЕСТИРОВАНИЕ БД

### 3.1 Запустить SQL тесты

```bash
psql -h aws-0-us-east-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.ejkhdhexkadecpbjjmsz \
     -d postgres \
     -f supabase/tests/test_category_migrations.sql
```

**Ожидаемый вывод:**
```
NOTICE:  ✅ Тест 1: Структура catalog_categories корректна
NOTICE:  ✅ Тест 2: Основных категорий: 8
NOTICE:  ✅ Тест 3: Подкатегорий: 32
NOTICE:  ✅ Тест 4: Все parent_id валидны
NOTICE:  ✅ Тест 5: Все категории имеют full_path
NOTICE:  ✅ Тест 6: Триггеры работают корректно
NOTICE:  ════════════════════════════════════════
NOTICE:  ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!
NOTICE:  ════════════════════════════════════════
```

**Если тесты НЕ прошли:**
1. Изучить ошибку
2. Исправить через SQL
3. Повторить тесты
4. Если не получается - откатить БД из backup

---

## ШАГ 4: ОБНОВЛЕНИЕ КОДА

### 4.1 Обновить API endpoint

```bash
# Код уже в плане, копировать из:
# docs/CATEGORY_MIGRATION_PLAN_V2_SAFE.md
# Секция "ЭТАП 5: Обновление API"

# Или я могу создать готовые файлы
```

**Файлы для обновления:**
- `app/api/catalog/categories/route.ts`
- `app/api/catalog/category-tree/route.ts` (новый)

### 4.2 Перезапустить dev сервер

```bash
# Остановить текущий
# Ctrl+C

# Запустить заново
npm run dev
```

### 4.3 Протестировать API

```bash
# Тест 1: Получить все категории
curl http://localhost:3000/api/catalog/categories | jq .

# Тест 2: Получить дерево
curl http://localhost:3000/api/catalog/category-tree | jq .

# Тест 3: Проверить структуру
curl http://localhost:3000/api/catalog/categories | jq '.categoryTree[0]'
```

**✅ Checkpoint:** API возвращает:
- `categories`: массив всех категорий
- `categoryTree`: массив с children
- `stats.total`: >= 40 (8 основных + подкатегории)

---

## ШАГ 5: ДЕПЛОЙ НА PRODUCTION

### 5.1 Коммит изменений

```bash
git add .
git commit -m "feat: Добавлена иерархическая система категорий

- Расширена схема catalog_categories (parent_id, level, full_path)
- Добавлены триггеры для автообновления счётчиков
- Заполнено 32 подкатегории для 8 основных категорий
- Автокатегоризация 70 products и 10 suppliers
- Обновлены API endpoints для работы с деревом
- Добавлена функция get_category_tree()

Миграции: 20251030_100-106
Риск: НИЗКИЙ (backup создан)
Тесты: ✅ Пройдены"
```

### 5.2 Push и Deploy

```bash
git push origin main

# Если используете Vercel
vercel --prod

# Или через GitHub Actions (автоматически)
```

### 5.3 Применить миграции на production

**ВАЖНО:** Миграции уже применены на той же БД!

Но если у вас отдельная staging/production БД:

```bash
# Повторить ШАГ 2 для production БД
# Заменить HOST/PASSWORD на production
```

---

## ШАГ 6: ПРОВЕРКА PRODUCTION

### 6.1 Проверить API на production

```bash
# Заменить на ваш домен
curl https://your-domain.vercel.app/api/catalog/categories | jq '.stats'
```

**✅ Checkpoint:** Ответ содержит:
```json
{
  "total": 40,
  "byLevel": {
    "0": 8,
    "1": 32,
    "2": 0
  },
  "totalProducts": 70,
  "totalSuppliers": 10
}
```

### 6.2 Проверить UI

1. Открыть https://your-domain.vercel.app/dashboard/catalog
2. Проверить отображение категорий
3. Проверить фильтрацию по категориям
4. Проверить breadcrumbs

---

## ШАГ 7: МОНИТОРИНГ

### 7.1 Проверить логи Supabase

1. Dashboard → Logs → Postgres Logs
2. Искать ошибки связанные с categories
3. Проверить медленные запросы

### 7.2 Проверить логи Vercel

1. Vercel Dashboard → Logs
2. Искать ошибки API /catalog/categories
3. Проверить performance

---

## ROLLBACK (если нужен)

### Вариант 1: Восстановить из backup

```bash
# Восстановить всю БД
pg_restore -h HOST -U USER -d postgres backup_TIMESTAMP.dump

# Или восстановить только схему
psql ... < backup_TIMESTAMP.sql
```

### Вариант 2: Откатить миграции вручную

```sql
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

## CHECKLIST ФИНАЛЬНОЙ ПРОВЕРКИ

### База данных
- [ ] Все 8 основных категорий существуют
- [ ] Добавлено 30+ подкатегорий
- [ ] Все products имеют category_id
- [ ] Все suppliers имеют category_id
- [ ] Триггеры работают
- [ ] Функция get_category_tree() работает

### API
- [ ] GET /api/catalog/categories возвращает данные
- [ ] Возвращается categoryTree
- [ ] Возвращается stats
- [ ] Нет ошибок 500

### UI
- [ ] Категории отображаются
- [ ] Фильтрация работает
- [ ] Breadcrumbs работают
- [ ] Mobile responsive

### Производительность
- [ ] API отвечает < 500ms
- [ ] Нет N+1 queries
- [ ] Индексы используются

---

## SUPPORT

Если что-то пошло не так:

1. **НЕ ПАНИКОВАТЬ**
2. Проверить логи
3. Проверить backup
4. Связаться со мной для помощи
5. Откатить если критично

---

**Время выполнения:** 4-6 часов
**Сложность:** Средняя
**Риск:** Низкий (при наличии backup)

**Готовы начать? Удачи! 🚀**
