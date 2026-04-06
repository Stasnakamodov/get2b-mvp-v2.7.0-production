#!/usr/bin/env node
/**
 * Sync catalog from data/catalog-seed.json to a target PostgreSQL server.
 *
 * Usage:
 *   # First open SSH tunnel to target:
 *   ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8
 *
 *   # Then sync:
 *   node scripts/sync-catalog.mjs --target prod
 *   node scripts/sync-catalog.mjs --target staging
 *   node scripts/sync-catalog.mjs --target prod --dry-run
 *
 *   # Or with custom connection:
 *   DB_HOST=localhost DB_PORT=5433 node scripts/sync-catalog.mjs
 *
 * What it does:
 *   1. Reads data/catalog-seed.json (source of truth)
 *   2. Upserts categories, suppliers, products, collections
 *   3. Updates category product counts
 *   4. Reports what changed
 */

import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const { Pool } = pg

// ── Config ──────────────────────────────────────────────────────

const TARGETS = {
  prod: {
    host: 'localhost',
    port: 5433,
    user: 'get2b',
    password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
    database: 'get2b',
    sshTunnel: 'ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8',
  },
  staging: {
    host: 'localhost',
    port: 5434,
    user: 'get2b',
    password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
    database: 'get2b',
    sshTunnel: 'ssh -f -N -L 5434:127.0.0.1:5432 root@STAGING_IP',
  },
  local: {
    host: 'localhost',
    port: 5432,
    user: 'get2b',
    password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
    database: 'get2b',
  },
}

// ── Parse args ──────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const targetName = args.find((_, i, a) => a[i - 1] === '--target') || 'prod'
const target = TARGETS[targetName]

if (!target) {
  console.error(`Unknown target: ${targetName}. Available: ${Object.keys(TARGETS).join(', ')}`)
  process.exit(1)
}

// Allow env overrides
const dbConfig = {
  host: process.env.DB_HOST || target.host,
  port: parseInt(process.env.DB_PORT || String(target.port)),
  user: process.env.DB_USER || target.user,
  password: process.env.DB_PASS || target.password,
  database: process.env.DB_NAME || target.database,
}

// ── Load seed ───────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedPath = path.join(__dirname, '..', 'data', 'catalog-seed.json')
const seed = JSON.parse(readFileSync(seedPath, 'utf8'))

console.log(`\n📦 Catalog Sync`)
console.log(`   Source: data/catalog-seed.json (exported ${seed._meta.exported_at})`)
console.log(`   Target: ${targetName} (${dbConfig.host}:${dbConfig.port})`)
console.log(`   Mode:   ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`)
console.log(`   Data:   ${seed._meta.counts.categories} categories, ${seed._meta.counts.suppliers} suppliers, ${seed._meta.counts.products} products, ${seed._meta.counts.collections} collections`)

if (target.sshTunnel) {
  console.log(`\n   ⚠️  SSH tunnel required: ${target.sshTunnel}`)
}

// ── Sync ────────────────────────────────────────────────────────

const pool = new Pool(dbConfig)

async function run() {
  const client = await pool.connect()
  const stats = { categories: { inserted: 0, updated: 0 }, suppliers: { inserted: 0, updated: 0 }, products: { inserted: 0, updated: 0, skipped: 0 }, collections: { inserted: 0, updated: 0 } }

  try {
    // Test connection
    await client.query('SELECT 1')
    console.log('\n✅ Connected to database\n')

    if (DRY_RUN) {
      // Just show what would happen
      const { rows: [{ count: existingProducts }] } = await client.query('SELECT count(*) FROM catalog_products')
      const { rows: [{ count: existingSuppliers }] } = await client.query('SELECT count(*) FROM catalog_suppliers')
      const { rows: [{ count: existingCategories }] } = await client.query('SELECT count(*) FROM catalog_categories')

      console.log(`   Current DB state:`)
      console.log(`     Categories: ${existingCategories}`)
      console.log(`     Suppliers:  ${existingSuppliers}`)
      console.log(`     Products:   ${existingProducts}`)
      console.log(`\n   Would sync:`)
      console.log(`     Categories: ${seed.categories.length}`)
      console.log(`     Suppliers:  ${seed.suppliers.length}`)
      console.log(`     Products:   ${seed.products.length}`)
      console.log(`     Collections: ${seed.collections.length}`)
      console.log(`\n   Run without --dry-run to apply.`)
      return
    }

    await client.query('BEGIN')

    // 1. Categories (upsert by key, preserve IDs)
    console.log('📁 Syncing categories...')
    // First: top-level (level 0)
    for (const cat of seed.categories.filter(c => c.level === 0)) {
      const { rowCount } = await client.query(`
        INSERT INTO catalog_categories (id, key, name, slug, icon, description, level, sort_order, is_active, full_path, has_subcategories)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon,
          description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active, full_path = EXCLUDED.full_path, has_subcategories = EXCLUDED.has_subcategories
      `, [cat.id, cat.key, cat.name, cat.slug, cat.icon, cat.description, cat.level, cat.sort_order, cat.is_active, cat.full_path, cat.has_subcategories])
      stats.categories.inserted++
    }
    // Then: subcategories (level 1+)
    for (const cat of seed.categories.filter(c => c.level > 0)) {
      await client.query(`
        INSERT INTO catalog_categories (id, parent_id, key, name, slug, icon, description, level, sort_order, is_active, full_path, has_subcategories)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          parent_id = EXCLUDED.parent_id, name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon,
          description = EXCLUDED.description, sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active, full_path = EXCLUDED.full_path, has_subcategories = EXCLUDED.has_subcategories
      `, [cat.id, cat.parent_id, cat.key, cat.name, cat.slug, cat.icon, cat.description, cat.level, cat.sort_order, cat.is_active, cat.full_path, cat.has_subcategories])
      stats.categories.inserted++
    }
    console.log(`   ✅ ${stats.categories.inserted} categories synced`)

    // 2. Suppliers (upsert by id)
    console.log('🏭 Syncing suppliers...')
    for (const s of seed.suppliers) {
      await client.query(`
        INSERT INTO catalog_suppliers (id, name, country, contact_info, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, country = EXCLUDED.country,
          contact_info = EXCLUDED.contact_info, is_active = EXCLUDED.is_active
      `, [s.id, s.name, s.country, s.contact_info ? JSON.stringify(s.contact_info) : null, s.is_active, s.created_at])
      stats.suppliers.inserted++
    }
    console.log(`   ✅ ${stats.suppliers.inserted} suppliers synced`)

    // 3. Products (upsert by id, batch for performance)
    console.log('📦 Syncing products...')

    // Disable trigger for performance
    await client.query('ALTER TABLE catalog_products DISABLE TRIGGER ALL').catch(() => {})

    for (let i = 0; i < seed.products.length; i++) {
      const p = seed.products[i]
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
          p.images || [],
          p.is_active, p.created_at, p.updated_at,
        ])
        stats.products.inserted++
      } catch (err) {
        console.error(`   ⚠️  Skip: ${p.name}: ${err.message}`)
        stats.products.skipped++
      }

      if ((i + 1) % 200 === 0 || i === seed.products.length - 1) {
        process.stdout.write(`\r   ${stats.products.inserted} synced, ${stats.products.skipped} skipped (${Math.round((i + 1) / seed.products.length * 100)}%)`)
      }
    }

    // Re-enable triggers
    await client.query('ALTER TABLE catalog_products ENABLE TRIGGER ALL').catch(() => {})

    console.log(`\n   ✅ ${stats.products.inserted} products synced`)

    // 4. Collections (upsert by slug)
    console.log('🏷️  Syncing collections...')
    for (const c of seed.collections) {
      await client.query(`
        INSERT INTO catalog_collections (id, slug, name, description, rules, sort_field, sort_order, max_products, is_active, is_featured, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug, name = EXCLUDED.name, description = EXCLUDED.description,
          rules = EXCLUDED.rules, sort_field = EXCLUDED.sort_field, sort_order = EXCLUDED.sort_order,
          max_products = EXCLUDED.max_products, is_active = EXCLUDED.is_active,
          is_featured = EXCLUDED.is_featured, position = EXCLUDED.position
      `, [c.id, c.slug, c.name, c.description, c.rules ? JSON.stringify(c.rules) : '{}', c.sort_field, c.sort_order, c.max_products, c.is_active, c.is_featured, c.position])
      stats.collections.inserted++
    }
    console.log(`   ✅ ${stats.collections.inserted} collections synced`)

    // 5. Update category counts
    console.log('🔢 Updating category counts...')
    await client.query(`
      UPDATE catalog_categories c
      SET products_count = (SELECT count(*) FROM catalog_products p WHERE p.category_id = c.id AND p.is_active = true)
    `)
    console.log('   ✅ Counts updated')

    await client.query('COMMIT')

    // Final report
    const { rows: [{ count: totalProducts }] } = await client.query('SELECT count(*) FROM catalog_products')
    const { rows: [{ count: totalSuppliers }] } = await client.query('SELECT count(*) FROM catalog_suppliers')

    console.log(`\n✅ Sync complete!`)
    console.log(`   Total in DB: ${totalProducts} products, ${totalSuppliers} suppliers`)

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('\n❌ ROLLBACK:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
