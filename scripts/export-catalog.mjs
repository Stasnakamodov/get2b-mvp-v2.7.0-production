#!/usr/bin/env node
/**
 * Export catalog data from VPS PostgreSQL into data/catalog-seed.json.
 *
 * Prerequisites: ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8
 * Usage: node scripts/export-catalog.mjs
 */

import pg from 'pg'
import { writeFileSync } from 'fs'

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'get2b',
  password: process.env.DB_PASS || '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
  database: process.env.DB_NAME || 'get2b',
})

async function run() {
  const client = await pool.connect()

  try {
    // Categories
    const { rows: categories } = await client.query(`
      SELECT id, parent_id, key, name, slug, icon, description, level, sort_order, is_active, full_path, has_subcategories
      FROM catalog_categories
      ORDER BY level, sort_order
    `)
    console.log(`Categories: ${categories.length}`)

    // Suppliers
    const { rows: suppliers } = await client.query(`
      SELECT id, name, country, contact_info, is_active, created_at
      FROM catalog_suppliers
      ORDER BY name
    `)
    console.log(`Suppliers: ${suppliers.length}`)

    // Products
    const { rows: products } = await client.query(`
      SELECT id, name, description, category_id, supplier_id, price, unit, specifications, images, is_active, created_at, updated_at
      FROM catalog_products
      ORDER BY created_at
    `)
    console.log(`Products: ${products.length}`)

    // Collections
    const { rows: collections } = await client.query(`
      SELECT id, slug, name, description, rules, sort_field, sort_order, max_products, is_active, is_featured, position
      FROM catalog_collections
      ORDER BY position
    `)
    console.log(`Collections: ${collections.length}`)

    const seed = {
      _meta: {
        exported_at: new Date().toISOString(),
        source: 'get2b-postgres (VPS 83.220.172.8)',
        counts: {
          categories: categories.length,
          suppliers: suppliers.length,
          products: products.length,
          collections: collections.length,
        },
      },
      categories,
      suppliers,
      products,
      collections,
    }

    const outPath = new URL('../data/catalog-seed.json', import.meta.url).pathname
    writeFileSync(outPath, JSON.stringify(seed, null, 2))
    console.log(`\nSaved to ${outPath} (${(JSON.stringify(seed).length / 1024 / 1024).toFixed(1)} MB)`)

  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => { console.error(err); process.exit(1) })
