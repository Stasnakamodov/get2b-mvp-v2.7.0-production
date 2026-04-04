#!/usr/bin/env node
/**
 * Import 544 real products from real-products.json into VPS PostgreSQL.
 *
 * Prerequisites: ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8
 * Usage: node scripts/import-real-products.mjs
 */

import pg from 'pg'
import { readFileSync } from 'fs'

const { Pool } = pg

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'get2b',
  password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
  database: 'get2b',
})

const products = JSON.parse(
  readFileSync('/Users/user/Downloads/code/database-dump/real-products.json', 'utf8')
)

console.log(`Loaded ${products.length} real products`)

const categoryNameMap = {
  'Электроника': 'Электроника',
  'Дом и быт': 'Дом и быт',
  'Здоровье и красота': 'Здоровье и медицина',
  'Строительство': 'Строительство',
  'Автотовары': 'Автотовары',
}

async function run() {
  const client = await pool.connect()

  try {
    // Get VPS categories
    const { rows: vpsCats } = await client.query(
      'SELECT id, name FROM catalog_categories WHERE parent_id IS NULL'
    )
    const catByName = Object.fromEntries(vpsCats.map(c => [c.name, c.id]))

    await client.query('BEGIN')

    // Disable trigger temporarily for performance
    await client.query('ALTER TABLE catalog_products DISABLE TRIGGER trigger_update_products_count')

    let imported = 0
    let skipped = 0

    for (const p of products) {
      const topCategory = p.category_name?.split(' > ')[0] || ''
      const vpsCatName = categoryNameMap[topCategory]
      const categoryId = vpsCatName ? catByName[vpsCatName] : null

      if (!categoryId) {
        console.warn(`  ! No category for "${p.category_name}" — skipping "${p.name}"`)
        skipped++
        continue
      }

      try {
        await client.query(
          `INSERT INTO catalog_products (name, description, category_id, price, unit, specifications, images, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            p.name,
            p.description,
            categoryId,
            p.price || null,
            p.currency || 'RUB',
            p.specifications ? JSON.stringify(p.specifications) : null,
            p.images || [],
          ]
        )
        imported++
      } catch (err) {
        console.error(`  ! Failed: ${p.name}: ${err.message}`)
        skipped++
      }
    }

    // Re-enable trigger
    await client.query('ALTER TABLE catalog_products ENABLE TRIGGER trigger_update_products_count')

    // Update category counts
    await client.query(`
      UPDATE catalog_categories c
      SET products_count = (SELECT count(*) FROM catalog_products p WHERE p.category_id = c.id)
    `)

    await client.query('COMMIT')
    console.log(`\nDone: ${imported} imported, ${skipped} skipped`)

    // Show result
    const { rows } = await client.query(`
      SELECT c.name, c.products_count
      FROM catalog_categories c
      WHERE c.parent_id IS NULL AND c.products_count > 0
      ORDER BY c.products_count DESC
    `)
    console.log('\nCategory counts:')
    for (const r of rows) {
      console.log(`  ${r.name}: ${r.products_count}`)
    }

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ROLLBACK:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
