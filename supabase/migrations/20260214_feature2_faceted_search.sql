-- Feature 2: Faceted Search with Counts
-- Cross-filter RPC function for dynamic facet counts
-- Note: supplier_country lives in catalog_verified_suppliers, joined via supplier_id

CREATE OR REPLACE FUNCTION get_product_facets(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_in_stock BOOLEAN DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_supplier_country TEXT DEFAULT NULL,
  p_supplier_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'categories',
    -- Category facets: all filters EXCEPT category (cross-filter)
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', t.category, 'count', t.cnt) ORDER BY t.cnt DESC), '[]'::jsonb)
     FROM (
       SELECT p.category, count(*) as cnt
       FROM catalog_verified_products p
       LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
       WHERE p.is_active = true
         AND (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
         AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
         AND (p_min_price IS NULL OR p.price >= p_min_price)
         AND (p_max_price IS NULL OR p.price <= p_max_price)
         AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
         AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)
       GROUP BY p.category
     ) t),

    'countries',
    -- Country facets: all filters EXCEPT country (cross-filter)
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', t.country, 'count', t.cnt) ORDER BY t.cnt DESC), '[]'::jsonb)
     FROM (
       SELECT s.country, count(*) as cnt
       FROM catalog_verified_products p
       JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
       WHERE p.is_active = true
         AND s.country IS NOT NULL
         AND (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
         AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
         AND (p_min_price IS NULL OR p.price >= p_min_price)
         AND (p_max_price IS NULL OR p.price <= p_max_price)
         AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
         AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)
       GROUP BY s.country
     ) t),

    'stock',
    -- Stock facets: all filters applied
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('in_stock', t.in_stock, 'count', t.cnt)), '[]'::jsonb)
     FROM (
       SELECT p.in_stock, count(*) as cnt
       FROM catalog_verified_products p
       LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
       WHERE p.is_active = true
         AND (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
         AND (p_min_price IS NULL OR p.price >= p_min_price)
         AND (p_max_price IS NULL OR p.price <= p_max_price)
         AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
         AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
         AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)
       GROUP BY p.in_stock
     ) t),

    'priceRange',
    -- Price range: all filters applied
    (SELECT jsonb_build_object('min_price', COALESCE(min(p.price), 0), 'max_price', COALESCE(max(p.price), 0))
     FROM catalog_verified_products p
     LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
     WHERE p.is_active = true
       AND p.price IS NOT NULL
       AND (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
       AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
       AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
       AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
       AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid)),

    'totalCount',
    -- Total count: all filters applied
    (SELECT count(*)
     FROM catalog_verified_products p
     LEFT JOIN catalog_verified_suppliers s ON s.id = p.supplier_id
     WHERE p.is_active = true
       AND (p_search IS NULL OR p_search = '' OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
       AND (p_in_stock IS NULL OR p.in_stock = p_in_stock)
       AND (p_min_price IS NULL OR p.price >= p_min_price)
       AND (p_max_price IS NULL OR p.price <= p_max_price)
       AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
       AND (p_supplier_country IS NULL OR p_supplier_country = '' OR s.country = p_supplier_country)
       AND (p_supplier_id IS NULL OR p_supplier_id = '' OR p.supplier_id = p_supplier_id::uuid))
  ) INTO result;

  RETURN result;
END;
$$;
