-- Feature 4: Dynamic Collections

CREATE TABLE IF NOT EXISTS catalog_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  rule_type TEXT NOT NULL DEFAULT 'auto',
  sort_field TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'desc',
  max_products INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE catalog_collections ENABLE ROW LEVEL SECURITY;

-- Public read for active collections
CREATE POLICY "catalog_collections_public_read" ON catalog_collections
  FOR SELECT USING (is_active = true);

-- Seed collections
INSERT INTO catalog_collections (slug, name, description, rules, sort_field, sort_order, max_products, is_active, is_featured, position) VALUES
  ('new-arrivals', 'Новинки', 'Недавно добавленные товары', '{}', 'created_at', 'desc', 50, true, true, 1),
  ('under-5000', 'До 5 000 ₽', 'Товары по выгодной цене', '{"price_max": 5000}', 'price', 'asc', 50, true, true, 2),
  ('in-stock', 'В наличии', 'Товары готовые к отгрузке', '{"in_stock": true}', 'created_at', 'desc', 50, true, true, 3)
ON CONFLICT (slug) DO NOTHING;
