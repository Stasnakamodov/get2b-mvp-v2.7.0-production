-- Feature 5: Product Variants

CREATE TABLE IF NOT EXISTS catalog_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES catalog_verified_products(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  price NUMERIC,
  currency TEXT DEFAULT 'RUB',
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add has_variants flag to products
ALTER TABLE catalog_verified_products
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Index for variant lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON catalog_product_variants(product_id) WHERE is_active = true;

-- Trigger: auto-set has_variants on variant insert/delete
CREATE OR REPLACE FUNCTION update_has_variants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE catalog_verified_products
    SET has_variants = EXISTS (
      SELECT 1 FROM catalog_product_variants
      WHERE product_id = NEW.product_id AND is_active = true
    )
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE catalog_verified_products
    SET has_variants = EXISTS (
      SELECT 1 FROM catalog_product_variants
      WHERE product_id = OLD.product_id AND is_active = true
    )
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_has_variants ON catalog_product_variants;
CREATE TRIGGER trg_update_has_variants
  AFTER INSERT OR UPDATE OR DELETE ON catalog_product_variants
  FOR EACH ROW EXECUTE FUNCTION update_has_variants();

-- Enable RLS
ALTER TABLE catalog_product_variants ENABLE ROW LEVEL SECURITY;

-- Public read for active variants
CREATE POLICY "catalog_product_variants_public_read" ON catalog_product_variants
  FOR SELECT USING (is_active = true);
