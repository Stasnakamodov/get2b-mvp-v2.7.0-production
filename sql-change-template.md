# 📝 ШАБЛОН SQL СКРИПТА ИЗМЕНЕНИЙ

## 🔍 ОБЯЗАТЕЛЬНЫЙ АНАЛИЗ ПЕРЕД ИЗМЕНЕНИЯМИ

```sql
-- ========================================
-- 🔍 АНАЛИЗ ПЕРЕД ИЗМЕНЕНИЯМИ
-- ========================================
-- ВАЖНО: Выполните этот анализ ПЕРЕД внесением изменений!

-- 1. Проверка текущего состояния
SELECT 'ТЕКУЩЕЕ СОСТОЯНИЕ' as step;
-- [Вставьте сюда анализ из analyze-catalog-structure-current.sql]

-- 2. Проверка существующих данных
SELECT 'СУЩЕСТВУЮЩИЕ ДАННЫЕ' as step;
-- [Проверьте, какие данные могут пострадать]

-- 3. Создание резервной копии (если нужно)
SELECT 'СОЗДАНИЕ РЕЗЕРВНОЙ КОПИИ' as step;
-- CREATE TABLE backup_table AS SELECT * FROM target_table;
```

## 🚨 ПРИНЦИПЫ БЕЗОПАСНЫХ ИЗМЕНЕНИЙ

### 1. Всегда делайте анализ ПЕРЕД изменениями
```sql
-- ❌ ПЛОХО: сразу изменять
ALTER TABLE table_name ADD COLUMN new_field text;

-- ✅ ХОРОШО: сначала проанализировать
-- 1. Проверить текущую структуру
-- 2. Понять что именно нужно изменить
-- 3. Создать план изменений
-- 4. Протестировать на копии
-- 5. Внести изменения
```

### 2. Используйте транзакции для безопасности
```sql
-- ✅ БЕЗОПАСНО: с транзакцией
BEGIN;
  -- Ваши изменения здесь
  ALTER TABLE table_name ADD COLUMN new_field text;
  UPDATE table_name SET new_field = 'default_value';
COMMIT;

-- ❌ ОПАСНО: без транзакции
ALTER TABLE table_name ADD COLUMN new_field text;
UPDATE table_name SET new_field = 'default_value';
```

### 3. Создавайте функции отката
```sql
-- ✅ ХОРОШО: функция отката
CREATE OR REPLACE FUNCTION rollback_changes()
RETURNS void AS $$
BEGIN
  -- Код для отката изменений
  ALTER TABLE table_name DROP COLUMN IF EXISTS new_field;
END;
$$ LANGUAGE plpgsql;
```

## 📋 СТРУКТУРА SQL СКРИПТА

```sql
-- ========================================
-- 📝 НАЗВАНИЕ ИЗМЕНЕНИЯ
-- ========================================
-- Дата: YYYY-MM-DD
-- Автор: Имя
-- Описание: Что именно изменяется и зачем

-- 🔍 АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ
-- [Обязательно вставьте анализ]

-- 📋 ПЛАН ИЗМЕНЕНИЙ
-- 1. Добавить поле X в таблицу Y
-- 2. Обновить существующие записи
-- 3. Создать индекс для производительности
-- 4. Протестировать изменения

-- 🚀 ВЫПОЛНЕНИЕ ИЗМЕНЕНИЙ
BEGIN;

  -- Шаг 1: Добавление полей
  ALTER TABLE table_name ADD COLUMN new_field text;
  
  -- Шаг 2: Обновление данных
  UPDATE table_name 
  SET new_field = 'default_value' 
  WHERE new_field IS NULL;
  
  -- Шаг 3: Создание индексов
  CREATE INDEX idx_table_name_new_field ON table_name(new_field);

COMMIT;

-- ✅ ПРОВЕРКА РЕЗУЛЬТАТОВ
-- [Вставьте проверочные запросы]

-- 🔄 ФУНКЦИЯ ОТКАТА (если нужно)
CREATE OR REPLACE FUNCTION rollback_changes()
RETURNS void AS $$
BEGIN
  DROP INDEX IF EXISTS idx_table_name_new_field;
  ALTER TABLE table_name DROP COLUMN IF EXISTS new_field;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 ПРИМЕРЫ ПРАВИЛЬНЫХ СКРИПТОВ

### Пример 1: Добавление поля логотипа
```sql
-- ========================================
-- 🖼️ ДОБАВЛЕНИЕ ПОЛЯ LOGO_URL В CATALOG_USER_SUPPLIERS
-- ========================================
-- Дата: 2024-01-15
-- Описание: Добавляем поле logo_url для копирования логотипов из аккредитованных поставщиков

-- 🔍 АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ
SELECT 'Проверка существования поля logo_url' as step;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'catalog_user_suppliers' 
  AND column_name = 'logo_url';

-- 📋 ПЛАН ИЗМЕНЕНИЙ
-- 1. Добавить поле logo_url в catalog_user_suppliers
-- 2. Скопировать логотипы из аккредитованных поставщиков
-- 3. Создать индекс для быстрого поиска

-- 🚀 ВЫПОЛНЕНИЕ ИЗМЕНЕНИЙ
BEGIN;

  -- Шаг 1: Добавление поля
  ALTER TABLE catalog_user_suppliers 
  ADD COLUMN IF NOT EXISTS logo_url text;
  
  -- Шаг 2: Копирование логотипов
  UPDATE catalog_user_suppliers 
  SET logo_url = vs.logo_url
  FROM catalog_verified_suppliers vs
  WHERE catalog_user_suppliers.source_supplier_id = vs.id
    AND catalog_user_suppliers.logo_url IS NULL
    AND vs.logo_url IS NOT NULL;
  
  -- Шаг 3: Создание индекса
  CREATE INDEX IF NOT EXISTS idx_user_suppliers_logo 
  ON catalog_user_suppliers(logo_url) 
  WHERE logo_url IS NOT NULL;

COMMIT;

-- ✅ ПРОВЕРКА РЕЗУЛЬТАТОВ
SELECT 
  'Результаты добавления logo_url' as check_type,
  COUNT(*) as total_suppliers,
  COUNT(CASE WHEN logo_url IS NOT NULL THEN 1 END) as with_logo,
  COUNT(CASE WHEN logo_url IS NULL THEN 1 END) as without_logo
FROM catalog_user_suppliers;
```

## 📝 ЧЕКЛИСТ ПЕРЕД ЗАПУСКОМ

- [ ] Выполнен анализ текущего состояния
- [ ] Создан план изменений
- [ ] Протестированы изменения на копии данных
- [ ] Создана функция отката
- [ ] Документированы все изменения
- [ ] Проверены зависимости от других таблиц
- [ ] Созданы необходимые индексы
- [ ] Добавлены проверочные запросы

## 🚨 ВАЖНЫЕ НАПОМИНАНИЯ

1. **Всегда анализируй ПЕРЕД изменением**
2. **Используй транзакции для безопасности**
3. **Создавай функции отката**
4. **Тестируй на копии данных**
5. **Документируй все изменения**
6. **Проверяй результаты после изменений**

Только следуя этому шаблону, можно безопасно вносить изменения в базу данных! 