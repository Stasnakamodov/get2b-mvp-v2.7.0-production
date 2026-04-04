#!/usr/bin/env node
/**
 * Import products, suppliers from /Users/user/Downloads/code/database-dump/
 * into VPS PostgreSQL (via SSH tunnel on localhost:5433).
 *
 * Usage:
 *   ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8
 *   node scripts/import-dump-to-vps.mjs --dry-run
 *   node scripts/import-dump-to-vps.mjs
 */

import pg from 'pg'
import { readFileSync } from 'fs'

const { Pool } = pg

const DRY_RUN = process.argv.includes('--dry-run')
const DUMP_DIR = '/Users/user/Downloads/code/database-dump'

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'get2b',
  password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
  database: 'get2b',
})

// Load dump files
const products = JSON.parse(readFileSync(`${DUMP_DIR}/products.json`, 'utf8'))
const suppliers = JSON.parse(readFileSync(`${DUMP_DIR}/suppliers.json`, 'utf8'))
const oldCategories = JSON.parse(readFileSync(`${DUMP_DIR}/categories.json`, 'utf8'))

console.log(`Loaded: ${products.length} products, ${suppliers.length} suppliers, ${oldCategories.length} old categories`)

async function run() {
  const client = await pool.connect()

  try {
    // 1. Get current categories from VPS
    const { rows: vpsCategories } = await client.query(
      'SELECT id, name, key FROM catalog_categories WHERE parent_id IS NULL'
    )
    console.log(`VPS categories: ${vpsCategories.map(c => c.name).join(', ')}`)

    // Build name → id map for VPS categories
    const catByName = {}
    for (const c of vpsCategories) {
      catByName[c.name] = c.id
    }

    // Map old category names to VPS category names
    const categoryNameMap = {
      'Электроника': 'Электроника',
      'Дом и быт': 'Дом и быт',
      'Здоровье и красота': 'Здоровье и медицина',
      'Строительство': 'Строительство',
      'Автотовары': 'Автотовары',
      'Промышленность': 'Промышленность',
      'Профессиональная литература': 'Дом и быт',
      'Текстиль и одежда': 'Текстиль и одежда',
      'Продукты питания': 'Продукты питания',
    }

    // Build old category ID → VPS category ID map
    const oldCatParents = {}
    for (const c of oldCategories) {
      if (!c.parent_id) oldCatParents[c.id] = c.name
    }

    const oldCatIdToVpsId = {}
    for (const c of oldCategories) {
      const parentName = c.parent_id ? oldCatParents[c.parent_id] : c.name
      const vpsCatName = categoryNameMap[parentName]
      if (vpsCatName && catByName[vpsCatName]) {
        oldCatIdToVpsId[c.id] = catByName[vpsCatName]
      }
    }

    console.log(`Category mappings: ${Object.keys(oldCatIdToVpsId).length}`)

    // Default category for unmapped products
    const defaultCategoryId = catByName['Электроника']

    if (DRY_RUN) {
      console.log('\n=== DRY RUN ===')

      // Count products per category
      const perCat = {}
      let unmapped = 0
      for (const p of products) {
        const vpsCatId = oldCatIdToVpsId[p.category_id]
        if (vpsCatId) {
          const catName = vpsCategories.find(c => c.id === vpsCatId)?.name || 'unknown'
          perCat[catName] = (perCat[catName] || 0) + 1
        } else {
          unmapped++
        }
      }
      console.log('Products per category:')
      for (const [name, count] of Object.entries(perCat)) {
        console.log(`  ${name}: ${count}`)
      }
      console.log(`  Unmapped (→ Электроника): ${unmapped}`)
      console.log(`\nSuppliers to import: ${suppliers.length}`)
      console.log('\nRun without --dry-run to import.')
      return
    }

    // 2. Import suppliers
    await client.query('BEGIN')

    console.log('\nImporting suppliers...')
    const supplierIdMap = {}
    for (const s of suppliers) {
      const contactInfo = JSON.stringify({
        description: s.description,
        logo_url: s.logo_url,
        rating: s.rating,
        verified: s.verified,
      })
      const { rows } = await client.query(
        `INSERT INTO catalog_suppliers (name, country, contact_info, is_active, created_at)
         VALUES ($1, $2, $3, true, $4)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [s.name, s.country, contactInfo, s.created_at]
      )
      if (rows.length > 0) {
        supplierIdMap[s.id] = rows[0].id
        console.log(`  + ${s.name} (${s.country})`)
      }
    }
    console.log(`Imported ${Object.keys(supplierIdMap).length} suppliers`)

    // 3. Import products in batches
    console.log('\nImporting products...')
    let imported = 0
    let skipped = 0
    const BATCH = 100

    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH)

      for (const p of batch) {
        if (p.deleted_at) { skipped++; continue }

        const categoryId = oldCatIdToVpsId[p.category_id] || defaultCategoryId
        const supplierId = p.supplier_id ? (supplierIdMap[p.supplier_id] || null) : null

        try {
          await client.query(
            `INSERT INTO catalog_products (name, description, category_id, supplier_id, price, unit, specifications, images, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              p.name,
              p.description,
              categoryId,
              supplierId,
              p.price ? parseFloat(p.price) : null,
              p.currency || 'RUB',
              p.specifications ? JSON.stringify(p.specifications) : null,
              p.images || [],
              p.in_stock !== false,
              p.created_at,
              p.updated_at,
            ]
          )
          imported++
        } catch (err) {
          console.error(`  ! Failed: ${p.name}: ${err.message}`)
          skipped++
        }
      }

      process.stdout.write(`\r  ${imported} imported, ${skipped} skipped (${Math.round((i + batch.length) / products.length * 100)}%)`)
    }

    console.log(`\n\nDone: ${imported} products imported, ${skipped} skipped`)

    // 4. Update category counts
    await client.query(`
      UPDATE catalog_categories c
      SET products_count = (SELECT count(*) FROM catalog_products p WHERE p.category_id = c.id)
    `)
    console.log('Category counts updated')

    await client.query('COMMIT')
    console.log('Transaction committed!')

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ROLLBACK:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
