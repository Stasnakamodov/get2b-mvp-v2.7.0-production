-- Feature 1: totalCount in API
-- Partial indexes for faster filtered count queries

CREATE INDEX IF NOT EXISTS idx_verified_products_active_category
  ON catalog_verified_products (category, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_verified_products_active_in_stock
  ON catalog_verified_products (in_stock, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_verified_products_active_price
  ON catalog_verified_products (price, is_active) WHERE is_active = true;
