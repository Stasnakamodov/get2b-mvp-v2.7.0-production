-- Migration 012: Fill icons for level=1 catalog_categories
--
-- Context: all 54 rows in catalog_categories are already wired through parent_id/level
-- correctly (8 parents at level=0, 46 narrow at level=1). Parents already have icons.
-- Narrow categories have empty icon → API + sidebar fall back to 📦, which was the
-- visible "all-boxes" bug. This migration is the single source of truth for per-row icons.
-- No merges, no parent_id edits, no (de)activation. Pure data fill.
--
-- Idempotent: safe to re-run. UPDATE ... WHERE name=... SET icon=... is a no-op on
-- matching rows, and a one-time fill on empty ones.

BEGIN;

-- Level=1 icons, keyed by name (except duplicate "Аксессуары" which is disambiguated by id)
UPDATE catalog_categories SET icon = v.icon
FROM (VALUES
  -- Автотовары
  ('Автомасла',            '🛢️'),
  ('Автоэлектроника',      '🔌'),
  ('Тормозная система',    '🛞'),
  ('Фильтры',              '🧪'),
  -- Дом и сад
  ('Бытовая техника',      '🧺'),
  ('Декор',                '🖼️'),
  ('Посуда',               '🍽️'),
  ('Садовый инвентарь',    '🪴'),
  ('Текстиль',             '🧵'),
  -- Красота и здоровье
  ('Витамины',             '💊'),
  ('Косметика',            '💋'),
  ('Массажеры',            '💆'),
  ('Парфюмерия',           '🌸'),
  ('Уход за кожей',        '🧴'),
  -- Мебель
  ('Мягкая мебель',        '🛋️'),
  ('Офисная мебель',       '🖥️'),
  ('Спальня',              '🛏️'),
  ('Столы',                '🪵'),
  ('Стулья',               '💺'),
  ('Шкафы',                '🗄️'),
  -- Одежда
  ('Верхняя одежда',       '🧥'),
  ('Джинсы',               '👖'),
  ('Костюмы',              '🤵'),
  ('Обувь',                '👟'),
  ('Платья',               '👗'),
  ('Толстовки',            '🧶'),
  ('Футболки',             '👕'),
  -- Спорт и отдых
  ('Велосипеды',           '🚴'),
  ('Спортивная одежда',    '🏃'),
  ('Тренажеры',            '🏋️'),
  ('Туризм',               '🎒'),
  ('Фитнес',               '💪'),
  -- Строительство
  ('Освещение',            '💡'),
  ('Отделочные материалы', '🧱'),
  ('Сантехника',           '🚿'),
  ('Умный дом',            '🏡'),
  ('Электроинструменты',   '🔧'),
  -- Электроника
  ('Камеры',               '📷'),
  ('Наушники',             '🎧'),
  ('Ноутбуки',             '💻'),
  ('Планшеты',             '📲'),
  ('Смартфоны',            '📱'),
  ('Телевизоры',           '📺'),
  ('Умные часы',           '⌚')
) AS v(name, icon)
WHERE catalog_categories.name = v.name
  AND catalog_categories.level = 1;

-- Disambiguate two "Аксессуары" by id (one under Автотовары, one under Одежда)
UPDATE catalog_categories SET icon = '🧰' WHERE id = '4fe9d78c-8a8e-4fd1-a0ad-f49ba3a65cda';
UPDATE catalog_categories SET icon = '👜' WHERE id = '9cd48198-53fb-45b4-ab60-baad06ba3841';

-- Safety net: any remaining level=1 without icon → 📦 (shouldn't fire if table is stable)
UPDATE catalog_categories
SET icon = '📦'
WHERE level = 1 AND is_active = true AND (icon IS NULL OR icon = '');

-- Assertions
DO $$
DECLARE
  missing_icon int;
  broken_parent int;
BEGIN
  SELECT COUNT(*) INTO missing_icon
  FROM catalog_categories
  WHERE is_active = true AND (icon IS NULL OR icon = '');
  IF missing_icon > 0 THEN
    RAISE EXCEPTION '012: % active categories still without icon', missing_icon;
  END IF;

  SELECT COUNT(*) INTO broken_parent
  FROM catalog_categories c
  WHERE c.level = 1
    AND c.parent_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM catalog_categories p WHERE p.id = c.parent_id AND p.level = 0);
  IF broken_parent > 0 THEN
    RAISE EXCEPTION '012: % level=1 rows point at non-parent parent_id', broken_parent;
  END IF;

  RAISE NOTICE '012: icons filled, hierarchy OK';
END $$;

COMMIT;
