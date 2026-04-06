/**
 * Write unified catalog to GET2B: update catalog-seed.json + optionally PG upsert.
 * PG upsert pattern cloned from scripts/sync-catalog.mjs.
 */

import { writeFileSync, renameSync } from 'fs'
import { PATHS, DB_TARGETS } from '../config.mjs'
import crypto from 'crypto'

/**
 * Write unified products to catalog-seed.json.
 * Needs existing GET2B data to preserve category/supplier tables.
 */
export function writeSeedJson(unifiedProducts, existingGet2bData, dryRun = false) {
  // Rebuild products array in GET2B format
  const catById = new Map(existingGet2bData.categories.map(c => [c.id, c]))
  const catByName = new Map()
  for (const c of existingGet2bData.categories) {
    catByName.set(c.name.toLowerCase(), c)
  }
  const supByName = new Map()
  for (const s of existingGet2bData.suppliers) {
    supByName.set(s.name.toLowerCase(), s)
  }

  // Collect new categories and suppliers that need to be created
  const newCategories = []
  const newSuppliers = []

  const products = unifiedProducts.map(p => {
    // Resolve category_id
    let categoryId = p.get2b?.category_id
    if (!categoryId && p.subcategory_name) {
      const sub = catByName.get(p.subcategory_name.toLowerCase())
      categoryId = sub?.id
    }
    if (!categoryId && p.category_name) {
      const cat = catByName.get(p.category_name.toLowerCase())
      categoryId = cat?.id
    }
    if (!categoryId) {
      // Auto-create category
      categoryId = createCategoryId(p.category_name, p.subcategory_name, existingGet2bData.categories, newCategories, catByName)
    }

    // Resolve supplier_id
    let supplierId = p.get2b?.supplier_id
    if (!supplierId && p.supplier_name) {
      const sup = supByName.get(p.supplier_name.toLowerCase())
      supplierId = sup?.id
    }
    if (!supplierId && p.supplier_name) {
      supplierId = crypto.randomUUID()
      const newSup = {
        id: supplierId,
        name: p.supplier_name,
        country: p.spectorg?.supplier_city ? 'Китай' : 'Unknown',
        contact_info: p.spectorg ? {
          city: p.spectorg.supplier_city,
          verified: p.spectorg.supplier_verified,
          rating: String(p.spectorg.supplier_rating || ''),
        } : null,
        is_active: true,
        created_at: new Date().toISOString(),
      }
      newSuppliers.push(newSup)
      supByName.set(p.supplier_name.toLowerCase(), newSup)
    }

    return {
      id: p.get2b?.id || crypto.randomUUID(),
      name: p.name,
      description: p.description,
      category_id: categoryId,
      supplier_id: supplierId || null,
      price: String(p.price_rub),
      unit: p.get2b?.unit || 'RUB',
      specifications: p.specifications,
      images: p.images,
      is_active: p.is_active,
      created_at: p.created_at,
      updated_at: p.updated_at || new Date().toISOString(),
    }
  })

  const allCategories = [...existingGet2bData.categories, ...newCategories]
  const allSuppliers = [...existingGet2bData.suppliers, ...newSuppliers]

  const seed = {
    _meta: {
      exported_at: new Date().toISOString(),
      source: 'catalog-bridge',
      counts: {
        categories: allCategories.length,
        suppliers: allSuppliers.length,
        products: products.length,
        collections: existingGet2bData.collections?.length || 0,
      },
    },
    categories: allCategories,
    suppliers: allSuppliers,
    products,
    collections: existingGet2bData.collections || [],
  }

  if (dryRun) {
    console.log(`  [dry-run] Would write catalog-seed.json: ${products.length} products, ${allCategories.length} categories, ${allSuppliers.length} suppliers`)
    if (newCategories.length) console.log(`    New categories: ${newCategories.map(c => c.name).join(', ')}`)
    if (newSuppliers.length) console.log(`    New suppliers: ${newSuppliers.map(s => s.name).join(', ')}`)
    return seed
  }

  const tmp = PATHS.get2b.seed + '.tmp'
  writeFileSync(tmp, JSON.stringify(seed, null, 2), 'utf-8')
  renameSync(tmp, PATHS.get2b.seed)
  console.log(`  Wrote catalog-seed.json (${products.length} products)`)

  return seed
}

/**
 * Upsert unified products to GET2B PostgreSQL.
 * Requires SSH tunnel to be open.
 */
export async function upsertToPostgres(seed, targetName = 'prod', dryRun = false) {
  const target = DB_TARGETS[targetName]
  if (!target) {
    console.error(`  Unknown target: ${targetName}`)
    return
  }

  if (dryRun) {
    console.log(`  [dry-run] Would upsert to ${targetName}: ${seed.products.length} products, ${seed.categories.length} categories`)
    return
  }

  const pg = await import('pg')
  const pool = new pg.default.Pool({
    host: target.host,
    port: target.port,
    user: target.user,
    password: target.password,
    database: target.database,
  })

  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
    console.log(`  Connected to ${targetName}`)

    await client.query('BEGIN')

    // Categories (level 0 first, then level 1+)
    for (const cat of seed.categories.filter(c => c.level === 0 || !c.parent_id)) {
      await client.query(`
        INSERT INTO catalog_categories (id, key, name, slug, icon, description, level, sort_order, is_active, full_path, has_subcategories)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon,
          description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active, full_path = EXCLUDED.full_path, has_subcategories = EXCLUDED.has_subcategories
      `, [cat.id, cat.key, cat.name, cat.slug, cat.icon, cat.description, cat.level, cat.sort_order, cat.is_active, cat.full_path, cat.has_subcategories])
    }
    for (const cat of seed.categories.filter(c => c.level > 0 && c.parent_id)) {
      await client.query(`
        INSERT INTO catalog_categories (id, parent_id, key, name, slug, icon, description, level, sort_order, is_active, full_path, has_subcategories)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          parent_id = EXCLUDED.parent_id, name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon,
          description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active, full_path = EXCLUDED.full_path, has_subcategories = EXCLUDED.has_subcategories
      `, [cat.id, cat.parent_id, cat.key, cat.name, cat.slug, cat.icon, cat.description, cat.level, cat.sort_order, cat.is_active, cat.full_path, cat.has_subcategories])
    }
    console.log(`  Upserted ${seed.categories.length} categories`)

    // Suppliers
    for (const s of seed.suppliers) {
      await client.query(`
        INSERT INTO catalog_suppliers (id, name, country, contact_info, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, country = EXCLUDED.country,
          contact_info = EXCLUDED.contact_info, is_active = EXCLUDED.is_active
      `, [s.id, s.name, s.country, s.contact_info ? JSON.stringify(s.contact_info) : null, s.is_active, s.created_at])
    }
    console.log(`  Upserted ${seed.suppliers.length} suppliers`)

    // Products
    await client.query('ALTER TABLE catalog_products DISABLE TRIGGER ALL').catch(() => {})
    let synced = 0, skipped = 0
    for (const p of seed.products) {
      try {
        await client.query(`
          INSERT INTO catalog_products (id, name, description, category_id, supplier_id, price, unit, specifications, images, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, description = EXCLUDED.description,
            category_id = EXCLUDED.category_id, supplier_id = EXCLUDED.supplier_id,
            price = EXCLUDED.price, unit = EXCLUDED.unit,
            specifications = EXCLUDED.specifications, images = EXCLUDED.images,
            is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at
        `, [
          p.id, p.name, p.description, p.category_id, p.supplier_id,
          p.price, p.unit,
          p.specifications ? JSON.stringify(p.specifications) : null,
          p.images || [], p.is_active, p.created_at, p.updated_at,
        ])
        synced++
      } catch (err) {
        console.error(`    Skip: ${p.name}: ${err.message}`)
        skipped++
      }
    }
    await client.query('ALTER TABLE catalog_products ENABLE TRIGGER ALL').catch(() => {})
    console.log(`  Upserted ${synced} products (${skipped} skipped)`)

    // Update category counts
    await client.query(`
      UPDATE catalog_categories c
      SET products_count = (SELECT count(*) FROM catalog_products p WHERE p.category_id = c.id AND p.is_active = true)
    `)

    await client.query('COMMIT')
    console.log(`  PG sync complete`)

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(`  ROLLBACK: ${err.message}`)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

// ── Helpers ────────────────────────────────────────────────────

function createCategoryId(categoryName, subcategoryName, existingCategories, newCategories, catByName) {
  if (!categoryName) return existingCategories[0]?.id || null

  // Find or create root category
  let root = catByName.get(categoryName.toLowerCase())
  if (!root) {
    root = {
      id: crypto.randomUUID(),
      parent_id: null,
      key: translitSlug(categoryName),
      name: categoryName,
      slug: translitSlug(categoryName),
      icon: null,
      description: null,
      level: 0,
      sort_order: existingCategories.length + newCategories.filter(c => c.level === 0).length,
      is_active: true,
      full_path: categoryName,
      has_subcategories: !!subcategoryName,
    }
    newCategories.push(root)
    catByName.set(categoryName.toLowerCase(), root)
  }

  if (!subcategoryName) return root.id

  // Find or create subcategory
  let sub = catByName.get(subcategoryName.toLowerCase())
  if (!sub) {
    sub = {
      id: crypto.randomUUID(),
      parent_id: root.id,
      key: `${root.key}_${translitSlug(subcategoryName)}`,
      name: subcategoryName,
      slug: translitSlug(subcategoryName),
      icon: null,
      description: null,
      level: 1,
      sort_order: 0,
      is_active: true,
      full_path: `${categoryName} > ${subcategoryName}`,
      has_subcategories: false,
    }
    newCategories.push(sub)
    catByName.set(subcategoryName.toLowerCase(), sub)
  }

  return sub.id
}

function translitSlug(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '-',
  }
  return text.toLowerCase().split('').map(c => map[c] || c).join('').replace(/[^a-z0-9-]/g, '')
}
