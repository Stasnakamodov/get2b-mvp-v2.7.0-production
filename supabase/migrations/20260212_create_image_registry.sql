-- Migration: Create catalog_image_registry table for global image deduplication
-- Date: 2026-02-12

-- Each image URL is registered globally. One url_hash = one product.
CREATE TABLE IF NOT EXISTS catalog_image_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES catalog_verified_products(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_image_url_hash UNIQUE (url_hash)
);

CREATE INDEX IF NOT EXISTS idx_image_registry_product ON catalog_image_registry(product_id);
CREATE INDEX IF NOT EXISTS idx_image_registry_hash ON catalog_image_registry(url_hash);

-- RLS: allow service role full access, anon read-only
ALTER TABLE catalog_image_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on catalog_image_registry"
  ON catalog_image_registry FOR SELECT
  USING (true);

CREATE POLICY "Allow service role insert on catalog_image_registry"
  ON catalog_image_registry FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role delete on catalog_image_registry"
  ON catalog_image_registry FOR DELETE
  USING (true);
