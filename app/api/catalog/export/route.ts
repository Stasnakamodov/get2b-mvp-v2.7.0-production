import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * API для экспорта каталога
 *
 * GET /api/catalog/export - полный экспорт каталога
 * GET /api/catalog/export?format=sql - SQL дамп для импорта
 * GET /api/catalog/export?category=Электроника - только одна категория
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const category = searchParams.get('category')
    const includeSuppliers = searchParams.get('suppliers') !== 'false'

    // 1. Загружаем категории
    const { data: categories, error: catError } = await supabase
      .from('catalog_categories')
      .select('*')
      .order('name')

    if (catError) throw new Error(`Ошибка загрузки категорий: ${catError.message}`)

    // 2. Загружаем подкатегории
    const { data: subcategories, error: subError } = await supabase
      .from('catalog_subcategories')
      .select('*')
      .order('name')

    if (subError) throw new Error(`Ошибка загрузки подкатегорий: ${subError.message}`)

    // 3. Загружаем товары
    let productsQuery = supabase
      .from('catalog_verified_products')
      .select('*')
      .order('name')

    if (category) {
      productsQuery = productsQuery.eq('category', category)
    }

    const { data: products, error: prodError } = await productsQuery

    if (prodError) throw new Error(`Ошибка загрузки товаров: ${prodError.message}`)

    // 4. Загружаем поставщиков (опционально)
    let suppliers: any[] = []
    if (includeSuppliers) {
      const { data, error: suppError } = await supabase
        .from('catalog_verified_suppliers')
        .select('*')
        .order('name')

      if (suppError) throw new Error(`Ошибка загрузки поставщиков: ${suppError.message}`)
      suppliers = data || []
    }

    // Формируем ответ в зависимости от формата
    if (format === 'sql') {
      const sql = generateSQL(categories || [], subcategories || [], products || [], suppliers)
      return new NextResponse(sql, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="catalog_export.sql"'
        }
      })
    }

    // JSON формат (по умолчанию)
    const exportData = {
      exported_at: new Date().toISOString(),
      source: 'get2b-catalog',
      version: '1.0',
      stats: {
        categories: categories?.length || 0,
        subcategories: subcategories?.length || 0,
        products: products?.length || 0,
        suppliers: suppliers.length
      },
      data: {
        categories: categories || [],
        subcategories: subcategories || [],
        products: (products || []).map(p => ({
          ...p,
          // Убираем ID чтобы при импорте создались новые
          id: undefined,
          created_at: undefined,
          updated_at: undefined
        })),
        suppliers: includeSuppliers ? suppliers.map(s => ({
          ...s,
          id: undefined,
          created_at: undefined,
          updated_at: undefined
        })) : []
      }
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': 'attachment; filename="catalog_export.json"'
      }
    })

  } catch (error: any) {
    console.error('❌ Ошибка экспорта каталога:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Генерация SQL для импорта
 */
function generateSQL(
  categories: any[],
  subcategories: any[],
  products: any[],
  suppliers: any[]
): string {
  let sql = `-- Get2B Catalog Export
-- Generated: ${new Date().toISOString()}
-- Categories: ${categories.length}, Subcategories: ${subcategories.length}, Products: ${products.length}, Suppliers: ${suppliers.length}

-- ============================================
-- 1. СОЗДАНИЕ ТАБЛИЦ (если не существуют)
-- ============================================

CREATE TABLE IF NOT EXISTS catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES catalog_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_verified_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT,
  category TEXT,
  country TEXT,
  city TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending',
  contact_email TEXT,
  min_order TEXT,
  response_time TEXT,
  public_rating DECIMAL(3,2),
  certifications JSONB,
  specialties JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_verified_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory_id UUID REFERENCES catalog_subcategories(id),
  sku TEXT,
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'RUB',
  min_order TEXT,
  in_stock BOOLEAN DEFAULT true,
  specifications JSONB,
  images JSONB,
  supplier_id UUID REFERENCES catalog_verified_suppliers(id),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. КАТЕГОРИИ
-- ============================================

`

  // Категории
  for (const cat of categories) {
    sql += `INSERT INTO catalog_categories (name, key, description, icon, is_active) VALUES (
  '${escapeSql(cat.name)}',
  '${escapeSql(cat.key || '')}',
  '${escapeSql(cat.description || '')}',
  '${escapeSql(cat.icon || '')}',
  ${cat.is_active !== false}
) ON CONFLICT (name) DO NOTHING;\n`
  }

  sql += `\n-- ============================================
-- 3. ПОДКАТЕГОРИИ
-- ============================================

`

  // Подкатегории (нужно сопоставить category_id)
  for (const sub of subcategories) {
    const parentCat = categories.find(c => c.id === sub.category_id)
    if (parentCat) {
      sql += `INSERT INTO catalog_subcategories (category_id, name, description, icon, is_active)
SELECT c.id, '${escapeSql(sub.name)}', '${escapeSql(sub.description || '')}', '${escapeSql(sub.icon || '')}', ${sub.is_active !== false}
FROM catalog_categories c WHERE c.name = '${escapeSql(parentCat.name)}'
ON CONFLICT DO NOTHING;\n`
    }
  }

  sql += `\n-- ============================================
-- 4. ПОСТАВЩИКИ
-- ============================================

`

  // Поставщики
  for (const sup of suppliers) {
    sql += `INSERT INTO catalog_verified_suppliers (name, company_name, category, country, city, description, is_active, is_verified, moderation_status, contact_email, min_order, response_time, public_rating)
VALUES (
  '${escapeSql(sup.name)}',
  '${escapeSql(sup.company_name || '')}',
  '${escapeSql(sup.category || '')}',
  '${escapeSql(sup.country || '')}',
  '${escapeSql(sup.city || '')}',
  '${escapeSql(sup.description || '')}',
  ${sup.is_active !== false},
  ${sup.is_verified === true},
  '${escapeSql(sup.moderation_status || 'approved')}',
  '${escapeSql(sup.contact_email || '')}',
  '${escapeSql(sup.min_order || '')}',
  '${escapeSql(sup.response_time || '')}',
  ${sup.public_rating || 'NULL'}
) ON CONFLICT DO NOTHING;\n`
  }

  sql += `\n-- ============================================
-- 5. ТОВАРЫ
-- ============================================

`

  // Товары
  for (const prod of products) {
    const images = prod.images ? JSON.stringify(prod.images).replace(/'/g, "''") : '[]'
    const specs = prod.specifications ? JSON.stringify(prod.specifications).replace(/'/g, "''") : '{}'

    sql += `INSERT INTO catalog_verified_products (name, description, category, sku, price, currency, min_order, in_stock, specifications, images, is_active, is_featured, supplier_id, subcategory_id)
SELECT
  '${escapeSql(prod.name)}',
  '${escapeSql(prod.description || '')}',
  '${escapeSql(prod.category || '')}',
  '${escapeSql(prod.sku || '')}',
  ${prod.price || 'NULL'},
  '${prod.currency || 'RUB'}',
  '${escapeSql(prod.min_order || '')}',
  ${prod.in_stock !== false},
  '${specs}'::jsonb,
  '${images}'::jsonb,
  ${prod.is_active !== false},
  ${prod.is_featured === true},
  s.id,
  sub.id
FROM (SELECT 1) dummy
LEFT JOIN catalog_verified_suppliers s ON s.name = '${escapeSql(suppliers.find(s => s.id === prod.supplier_id)?.name || '')}'
LEFT JOIN catalog_subcategories sub ON sub.id IS NOT NULL AND sub.name = (
  SELECT name FROM catalog_subcategories WHERE id = '${prod.subcategory_id || '00000000-0000-0000-0000-000000000000'}'
)
ON CONFLICT DO NOTHING;\n`
  }

  sql += `\n-- ============================================
-- ГОТОВО! Импортировано:
-- - ${categories.length} категорий
-- - ${subcategories.length} подкатегорий
-- - ${suppliers.length} поставщиков
-- - ${products.length} товаров
-- ============================================
`

  return sql
}

function escapeSql(str: string): string {
  if (!str) return ''
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
}
