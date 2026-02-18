/**
 * Скрипт для переназначения товаров на новых поставщиков.
 * Шаг 1-2 (удаление фейковых + создание новых) уже выполнены.
 * Этот скрипт:
 *   - Переименовывает дубликаты имён в рамках одной категории
 *   - Переназначает все товары на новых поставщиков по категории
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const CATEGORY_MAP = {
  'Электроника': 'Shenzhen TechLine',
  'Дом и быт': 'Guangzhou HomeTrade',
  'Здоровье и красота': 'Yiwu BeautyPro',
  'Строительство': 'Shanghai BuildMart',
  'Автотовары': 'Shanghai BuildMart',
}

async function main() {
  console.log('=== Reassigning products ===\n')

  // 1. Load new suppliers
  const supplierIds = {}
  const { data: activeSuppliers } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .eq('is_active', true)

  for (const s of (activeSuppliers || [])) {
    supplierIds[s.name] = s.id
    console.log(`  Supplier: ${s.name} → ${s.id}`)
  }

  // 2. Load ALL products
  const { data: products, error: prodErr } = await supabase
    .from('catalog_verified_products')
    .select('id, name, category, supplier_id')

  if (prodErr) { console.error('Fetch error:', prodErr.message); return }
  console.log(`\n  Товаров в базе: ${products.length}`)

  // 3. Group products by target supplier, detect duplicates, rename FIRST
  console.log('\n--- Phase 1: Rename duplicates ---')
  const groups = {} // supplierId -> { name -> [product] }

  for (const p of products) {
    const supplierName = CATEGORY_MAP[p.category]
    if (!supplierName || !supplierIds[supplierName]) continue
    const targetId = supplierIds[supplierName]

    if (!groups[targetId]) groups[targetId] = {}
    if (!groups[targetId][p.name]) groups[targetId][p.name] = []
    groups[targetId][p.name].push(p)
  }

  let renamedCount = 0
  for (const [supplierId, nameMap] of Object.entries(groups)) {
    for (const [name, prods] of Object.entries(nameMap)) {
      if (prods.length <= 1) continue
      // First product keeps original name, rest get suffix
      for (let i = 1; i < prods.length; i++) {
        const newName = `${name} (вар. ${i + 1})`
        const { error } = await supabase
          .from('catalog_verified_products')
          .update({ name: newName })
          .eq('id', prods[i].id)

        if (error) {
          console.log(`  ✗ rename ${prods[i].id}: ${error.message}`)
        } else {
          renamedCount++
          prods[i].name = newName // update local copy
        }
      }
    }
  }
  console.log(`  Переименовано дубликатов: ${renamedCount}`)

  // 4. Now reassign all products to new suppliers
  console.log('\n--- Phase 2: Reassign supplier_id ---')
  const stats = {}
  let errors = 0

  for (const p of products) {
    const supplierName = CATEGORY_MAP[p.category]
    if (!supplierName || !supplierIds[supplierName]) {
      console.log(`  ? skip "${p.name}" — category "${p.category}" not mapped`)
      continue
    }

    const newSupplierId = supplierIds[supplierName]
    if (p.supplier_id === newSupplierId) {
      // Already assigned
      stats[supplierName] = (stats[supplierName] || 0) + 1
      continue
    }

    const { error } = await supabase
      .from('catalog_verified_products')
      .update({ supplier_id: newSupplierId })
      .eq('id', p.id)

    if (error) {
      console.log(`  ✗ ${p.name}: ${error.message}`)
      errors++
    } else {
      stats[supplierName] = (stats[supplierName] || 0) + 1
    }
  }

  console.log('\n=== Результат ===')
  for (const [name, count] of Object.entries(stats)) {
    console.log(`  ${name}: ${count} товаров`)
  }
  const total = Object.values(stats).reduce((a, b) => a + b, 0)
  console.log(`\n  Переназначено: ${total} из ${products.length}`)
  if (errors > 0) console.log(`  Ошибок: ${errors}`)
  console.log('\nDone!')
}

main().catch(console.error)
