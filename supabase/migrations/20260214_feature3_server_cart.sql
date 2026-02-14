-- Feature 3: Server-Side Cart

-- One active cart per user
CREATE TABLE IF NOT EXISTS catalog_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS catalog_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES catalog_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_table TEXT NOT NULL DEFAULT 'catalog_verified_products',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant_id UUID,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index: one item per product+variant per cart
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_product
  ON catalog_cart_items (cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Enable RLS
ALTER TABLE catalog_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own cart
CREATE POLICY "catalog_carts_user_select" ON catalog_carts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "catalog_carts_user_insert" ON catalog_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "catalog_carts_user_update" ON catalog_carts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "catalog_carts_user_delete" ON catalog_carts
  FOR DELETE USING (auth.uid() = user_id);

-- Cart items: user can access through their cart
CREATE POLICY "catalog_cart_items_user_select" ON catalog_cart_items
  FOR SELECT USING (
    cart_id IN (SELECT id FROM catalog_carts WHERE user_id = auth.uid())
  );
CREATE POLICY "catalog_cart_items_user_insert" ON catalog_cart_items
  FOR INSERT WITH CHECK (
    cart_id IN (SELECT id FROM catalog_carts WHERE user_id = auth.uid())
  );
CREATE POLICY "catalog_cart_items_user_update" ON catalog_cart_items
  FOR UPDATE USING (
    cart_id IN (SELECT id FROM catalog_carts WHERE user_id = auth.uid())
  );
CREATE POLICY "catalog_cart_items_user_delete" ON catalog_cart_items
  FOR DELETE USING (
    cart_id IN (SELECT id FROM catalog_carts WHERE user_id = auth.uid())
  );

-- RPC: get cart with product data joined (includes supplier info)
CREATE OR REPLACE FUNCTION get_cart_with_products(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  v_cart_id UUID;
BEGIN
  SELECT id INTO v_cart_id FROM catalog_carts WHERE user_id = p_user_id;

  IF v_cart_id IS NULL THEN
    RETURN jsonb_build_object('cart_id', NULL, 'items', '[]'::jsonb);
  END IF;

  SELECT jsonb_build_object(
    'cart_id', v_cart_id,
    'items', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', ci.id,
          'product_id', ci.product_id,
          'quantity', ci.quantity,
          'variant_id', ci.variant_id,
          'added_at', ci.added_at,
          'product', jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'category', p.category,
            'sku', p.sku,
            'price', p.price,
            'currency', p.currency,
            'min_order', p.min_order,
            'in_stock', p.in_stock,
            'images', p.images,
            'specifications', p.specifications,
            'supplier_id', p.supplier_id,
            'supplier_name', s.name,
            'supplier_country', s.country,
            'is_featured', p.is_featured,
            'created_at', p.created_at,
            'updated_at', p.updated_at
          )
        )
        ORDER BY ci.added_at DESC
      )
      FROM catalog_cart_items ci
      LEFT JOIN catalog_verified_products p ON p.id = ci.product_id
      LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
      WHERE ci.cart_id = v_cart_id),
      '[]'::jsonb
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_catalog_carts_user_id ON catalog_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_cart_items_cart_id ON catalog_cart_items(cart_id);
