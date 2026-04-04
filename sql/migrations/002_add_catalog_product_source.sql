-- Добавить колонку catalog_product_source для определения таблицы-источника товара
ALTER TABLE project_specifications
  ADD COLUMN IF NOT EXISTS catalog_product_source text
  CHECK (catalog_product_source IN ('verified', 'user'));

-- Обновить триггер: теперь ищем товар в правильной таблице по catalog_product_source
CREATE OR REPLACE FUNCTION auto_fill_category_from_catalog()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.catalog_product_id IS NOT NULL AND NEW.catalog_product_source IS NOT NULL THEN
    IF NEW.catalog_product_source = 'verified' THEN
      SELECT cp.category, NULL
      INTO NEW.category_name, NEW.subcategory_name
      FROM catalog_verified_products cp
      WHERE cp.id = NEW.catalog_product_id;
    ELSIF NEW.catalog_product_source = 'user' THEN
      SELECT cp.category, NULL
      INTO NEW.category_name, NEW.subcategory_name
      FROM catalog_user_products cp
      WHERE cp.id = NEW.catalog_product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
