# 📦 Инструкция по миграции на плоские категории

## ✅ Что сделано в коде:

1. **SQL миграция создана** (`sql/migrate-to-flat-categories.sql`)
   - Перенос товаров из подкатегорий в родительские категории
   - Удаление полей `subcategory_id`
   - Создание новых упрощенных views и функций

2. **Компоненты обновлены:**
   - ✅ Создан `SimpleCategorySelector` вместо `HierarchicalCategorySelector`
   - ✅ Обновлен `ProductGridByCategory` (убрана логика подкатегорий)
   - ✅ Обновлена страница каталога (`app/dashboard/catalog/page.tsx`)

3. **API упрощен:**
   - ✅ `/api/catalog/categories/hierarchical` теперь возвращает только основные категории

4. **Типы обновлены:**
   - ✅ Убраны `subcategories` из типов
   - ✅ Обновлена валидация в Zod схемах

## 🚀 Как выполнить миграцию в Supabase:

### Шаг 1: Сделайте бэкап БД
```sql
-- Проверьте текущее состояние
SELECT COUNT(*) as total_products FROM catalog_verified_products WHERE subcategory_id IS NOT NULL;
SELECT COUNT(*) as total_products FROM catalog_user_products WHERE subcategory_id IS NOT NULL;
```

### Шаг 2: Выполните миграцию
1. Откройте Supabase SQL Editor
2. Скопируйте содержимое файла `sql/migrate-to-flat-categories.sql`
3. Выполните SQL по частям (каждый блок отдельно)
4. Проверяйте результат после каждого шага

### Шаг 3: Проверьте результаты
```sql
-- Убедитесь что все товары имеют категории
SELECT COUNT(*) FROM catalog_verified_products WHERE category_id IS NULL;
SELECT COUNT(*) FROM catalog_user_products WHERE category_id IS NULL;

-- Проверьте новые счетчики
SELECT * FROM catalog_verified_products_counts;
```

### Шаг 4: Деплой кода
После успешной миграции БД задеплойте обновленный код

## ⚠️ Важно:
- Миграция переносит ВСЕ товары из подкатегорий в основные категории
- Подкатегории деактивируются, но не удаляются (для возможности отката)
- После проверки можно полностью удалить подкатегории командой:
  ```sql
  DELETE FROM catalog_categories WHERE level = 2;
  ```

## 🔄 Откат (если что-то пошло не так):
```sql
-- Восстановить поля subcategory_id
ALTER TABLE catalog_verified_products 
ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES catalog_categories(id);

ALTER TABLE catalog_user_products
ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES catalog_categories(id);

-- Активировать подкатегории обратно
UPDATE catalog_categories SET is_active = true WHERE level = 2;
```

## ✨ Результат:
- Упрощенная структура только с основными категориями
- Быстрые и точные счетчики товаров
- Чистый и понятный код без сложной иерархии
- Меньше багов и проще поддержка