/**
 * Fix remaining 33+12 products that weren't reassigned.
 * - Rename products with duplicate names BEFORE moving
 * - Add "Одежда и аксессуары" → Guangzhou HomeTrade
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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
  'Одежда и аксессуары': 'Guangzhou HomeTrade',
}

async function main() {
  console.log('=== Fixing remaining products ===\n')

  // Load suppliers
  const supplierIds = {}
  const { data: activeSuppliers } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .eq('is_active', true)
  for (const s of (activeSuppliers || [])) {
    supplierIds[s.name] = s.id
  }

  // Find products NOT yet assigned to an active supplier
  const activeIds = new Set(Object.values(supplierIds))
  const { data: allProducts } = await supabase
    .from('catalog_verified_products')
    .select('id, name, category, supplier_id')

  const remaining = allProducts.filter(p => !activeIds.has(p.supplier_id))
  console.log(`Ещё не переназначено: ${remaining.length}`)

  // For each remaining product, check if its name conflicts with an existing product
  // under the target supplier, and rename if needed
  let fixed = 0
  let errors = 0

  for (const p of remaining) {
    const supplierName = CATEGORY_MAP[p.category]
    if (!supplierName || !supplierIds[supplierName]) {
      console.log(`  ? "${p.name}" — category "${p.category}" not mapped`)
      continue
    }

    const newSupplierId = supplierIds[supplierName]

    // Check if name already exists under target supplier
    const { data: existing } = await supabase
      .from('catalog_verified_products')
      .select('id')
      .eq('supplier_id', newSupplierId)
      .eq('name', p.name)

    let finalName = p.name
    if (existing && existing.length > 0) {
      // Name conflict — find a unique name
      let suffix = 2
      while (true) {
        const candidate = `${p.name} (вар. ${suffix})`
        const { data: check } = await supabase
          .from('catalog_verified_products')
          .select('id')
          .eq('supplier_id', newSupplierId)
          .eq('name', candidate)
        if (!check || check.length === 0) {
          finalName = candidate
          break
        }
        suffix++
      }
    }

    // Update: rename + reassign in one call
    const updateData = { supplier_id: newSupplierId }
    if (finalName !== p.name) updateData.name = finalName

    const { error } = await supabase
      .from('catalog_verified_products')
      .update(updateData)
      .eq('id', p.id)

    if (error) {
      console.log(`  ✗ ${p.name}: ${error.message}`)
      errors++
    } else {
      fixed++
    }
  }

  console.log(`\n  Переназначено: ${fixed}`)
  if (errors > 0) console.log(`  Ошибок: ${errors}`)
  console.log('Done!')
}

main().catch(console.error)
