-- Migration: Add name_normalized column with trigger and unique index
-- Date: 2026-02-12

-- 1. Add column
ALTER TABLE catalog_verified_products
  ADD COLUMN IF NOT EXISTS name_normalized TEXT;

-- 2. Trigger function: auto-normalize name on INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_normalize_product_name() RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        LEFT(NEW.name, 60),
        '[^\w\s]', '', 'g'
      ),
      '\s+', ' ', 'g'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_product_name ON catalog_verified_products;
CREATE TRIGGER trg_normalize_product_name
  BEFORE INSERT OR UPDATE OF name ON catalog_verified_products
  FOR EACH ROW EXECUTE FUNCTION fn_normalize_product_name();

-- 3. Backfill existing products
UPDATE catalog_verified_products
SET name_normalized = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      LEFT(name, 60),
      '[^\w\s]', '', 'g'
    ),
    '\s+', ' ', 'g'
  )
);

-- 4. Unique index on name_normalized for active products with meaningful names
-- This prevents cross-supplier duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_name_normalized_global
  ON catalog_verified_products(name_normalized)
  WHERE name_normalized IS NOT NULL
    AND LENGTH(name_normalized) > 5
    AND is_active = true;
