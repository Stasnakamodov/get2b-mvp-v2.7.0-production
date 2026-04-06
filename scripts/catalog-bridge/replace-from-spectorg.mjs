#!/usr/bin/env node
/**
 * Replace GET2B catalog entirely with A-Spectorg data.
 * No merge — old GET2B products are thrown away.
 *
 * Usage:
 *   node scripts/catalog-bridge/replace-from-spectorg.mjs --dry-run
 *   node scripts/catalog-bridge/replace-from-spectorg.mjs
 *   node scripts/catalog-bridge/replace-from-spectorg.mjs --target prod   # also push to PG
 */

import { readFileSync, writeFileSync, renameSync, copyFileSync, existsSync } from 'fs'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

const SPECTORG_PATH = process.env.SPECTORG_CATALOG
  || '/Users/user/Downloads/code/data/realistic-catalog-v2.json'
const SEED_PATH = path.join(ROOT, 'data', 'catalog-seed.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const TARGET = args.find((_, i, a) => a[i - 1] === '--target') || null

// ── Read Spectorg ──────────────────────────────────────────────

console.log('\n=== Replace GET2B catalog from A-Spectorg ===\n')

const raw = JSON.parse(readFileSync(SPECTORG_PATH, 'utf-8'))
console.log(`Source: ${SPECTORG_PATH}`)
console.log(`  ${raw.products.length} products, ${raw.categories.length} categories, ${raw.suppliers.length} suppliers`)

// ── Build GET2B-format categories ──────────────────────────────

const categories = []
let catSortOrder = 0

for (const cat of raw.categories) {
  const rootId = crypto.randomUUID()

  categories.push({
    id: rootId,
    parent_id: null,
    key: cat.id,
    name: cat.name,
    slug: cat.id,
    icon: cat.icon || null,
    description: null,
    level: 0,
    sort_order: catSortOrder++,
    is_active: true,
    full_path: cat.name,
    has_subcategories: cat.subcategories.length > 0,
  })

  for (let i = 0; i < cat.subcategories.length; i++) {
    const subName = cat.subcategories[i]
    const subSlug = translitSlug(subName)
    categories.push({
      id: crypto.randomUUID(),
      parent_id: rootId,
      key: `${cat.id}_${subSlug}`,
      name: subName,
      slug: subSlug,
      icon: null,
      description: null,
      level: 1,
      sort_order: i,
      is_active: true,
      full_path: `${cat.name} > ${subName}`,
      has_subcategories: false,
    })
  }
}

console.log(`  Built ${categories.length} categories (${categories.filter(c => c.level === 0).length} root + ${categories.filter(c => c.level === 1).length} sub)`)

// ── Build GET2B-format suppliers ───────────────────────────────

const suppliers = raw.suppliers.map((s, i) => ({
  id: crypto.randomUUID(),
  name: s.name,
  country: s.country || 'Китай',
  contact_info: {
    city: s.city,
    verified: s.verified,
    rating: String(s.rating),
  },
  is_active: true,
  created_at: new Date().toISOString(),
}))

// Collect unique supplier names from products that aren't in suppliers list
const supplierByName = new Map(suppliers.map(s => [s.name.toLowerCase(), s]))
for (const p of raw.products) {
  if (p.supplier && !supplierByName.has(p.supplier.toLowerCase())) {
    const newSup = {
      id: crypto.randomUUID(),
      name: p.supplier,
      country: 'Китай',
      contact_info: {
        city: p.supplier_city || '',
        verified: p.supplier_verified ?? true,
        rating: String(p.supplier_rating || 4.5),
      },
      is_active: true,
      created_at: new Date().toISOString(),
    }
    suppliers.push(newSup)
    supplierByName.set(p.supplier.toLowerCase(), newSup)
  }
}

console.log(`  Built ${suppliers.length} suppliers`)

// ── Build lookup maps ──────────────────────────────────────────

// Category: "Электроника" + "Смартфоны" -> subcategory UUID
const catLookup = new Map()
for (const cat of categories) {
  if (cat.level === 1) {
    const parent = categories.find(c => c.id === cat.parent_id)
    if (parent) {
      catLookup.set(`${parent.name}|${cat.name}`, cat.id)
    }
  }
}
// Fallback: root category by name
const rootCatByName = new Map(
  categories.filter(c => c.level === 0).map(c => [c.name.toLowerCase(), c.id])
)

// ── Build GET2B-format products ────────────────────────────────

const products = raw.products.map(p => {
  // Resolve category
  let categoryId = catLookup.get(`${p.category}|${p.subcategory}`)
  if (!categoryId) {
    categoryId = rootCatByName.get((p.category || '').toLowerCase()) || categories[0].id
  }

  // Resolve supplier
  const sup = supplierByName.get((p.supplier || '').toLowerCase())
  const supplierId = sup?.id || null

  return {
    id: crypto.randomUUID(),
    name: p.name,
    description: p.description || '',
    category_id: categoryId,
    supplier_id: supplierId,
    price: String(p.price_rub || 0),
    unit: 'RUB',
    specifications: p.specifications || null,
    images: p.image_urls || (p.image_url ? [p.image_url] : []),
    is_active: p.in_stock !== false,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
})

console.log(`  Built ${products.length} products`)

// ── Category product counts ────────────────────────────────────

for (const cat of categories) {
  cat.products_count = products.filter(p => p.category_id === cat.id && p.is_active).length
}

// ── Write seed ─────────────────────────────────────────────────

const seed = {
  _meta: {
    exported_at: new Date().toISOString(),
    source: 'a-spectorg (replace-from-spectorg.mjs)',
    original_source: SPECTORG_PATH,
    counts: {
      categories: categories.length,
      suppliers: suppliers.length,
      products: products.length,
      collections: 0,
    },
  },
  categories,
  suppliers,
  products,
  collections: [],
}

if (DRY_RUN) {
  console.log(`\n[dry-run] Would write ${SEED_PATH}:`)
  console.log(`  ${products.length} products (was 1485)`)
  console.log(`  ${categories.length} categories`)
  console.log(`  ${suppliers.length} suppliers`)

  // Show category breakdown
  console.log(`\nCategories:`)
  for (const cat of categories.filter(c => c.level === 0)) {
    const count = products.filter(p => {
      if (p.category_id === cat.id) return true
      const subs = categories.filter(c => c.parent_id === cat.id)
      return subs.some(s => s.id === p.category_id)
    }).length
    console.log(`  ${cat.icon || ''} ${cat.name}: ${count} products`)
  }
} else {
  // Backup old seed
  if (existsSync(SEED_PATH)) {
    copyFileSync(SEED_PATH, SEED_PATH.replace('.json', '.backup-old-1485.json'))
    console.log(`\nBackup: catalog-seed.backup-old-1485.json`)
  }

  // Atomic write
  const tmp = SEED_PATH + '.tmp'
  writeFileSync(tmp, JSON.stringify(seed, null, 2), 'utf-8')
  renameSync(tmp, SEED_PATH)
  console.log(`\nWrote ${SEED_PATH}`)
  console.log(`  ${products.length} products (replaced 1485)`)
}

// ── Optional: push to PG ───────────────────────────────────────

if (TARGET && !DRY_RUN) {
  console.log(`\nPushing to PostgreSQL (${TARGET})...`)
  console.log(`Use: node scripts/sync-catalog.mjs --target ${TARGET}`)
  console.log(`(SSH tunnel required: ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8)`)
}

console.log('\nDone!')

// ── Helpers ────────────────────────────────────────────────────

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
