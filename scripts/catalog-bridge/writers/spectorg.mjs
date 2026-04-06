/**
 * Write unified catalog to A-Spectorg realistic-catalog-v2.json.
 * Atomic write pattern from lib/catalog-write.ts.
 */

import { writeFileSync, renameSync, copyFileSync } from 'fs'
import { PATHS } from '../config.mjs'

/**
 * Convert unified products/categories/suppliers to Spectorg JSON format
 * and write to realistic-catalog-v2.json.
 */
export function writeSpectorgJson(unifiedProducts, unifiedCategories, unifiedSuppliers, overridePath, dryRun = false) {
  const catalogPath = overridePath || PATHS.spectorg.catalog

  // Build categories in Spectorg format: flat with subcategories array
  const rootCats = unifiedCategories.filter(c => c.level === 0)
  const categories = rootCats.map(root => {
    const subs = unifiedCategories.filter(c =>
      c.level === 1 && c.parent_name === root.name
    )
    return {
      id: root.spectorg?.id || root.slug || translitSlug(root.name),
      name: root.name,
      icon: root.icon || '',
      subcategories: subs.map(s => s.name),
    }
  })

  // Build suppliers in Spectorg format
  const supplierNames = new Set(unifiedProducts.map(p => p.supplier_name).filter(Boolean))
  const suppliers = unifiedSuppliers
    .filter(s => supplierNames.has(s.name))
    .map(s => ({
      name: s.name,
      country: s.country || 'Китай',
      city: s.spectorg?.city || '',
      verified: s.spectorg?.verified ?? true,
      rating: s.spectorg?.rating ?? 4.5,
    }))

  // Assign Spectorg IDs to products that don't have them
  let maxId = 0
  for (const p of unifiedProducts) {
    if (p.spectorg?.id != null && typeof p.spectorg.id === 'number') {
      maxId = Math.max(maxId, p.spectorg.id)
    }
  }

  // Build products in Spectorg format
  const products = unifiedProducts.map(p => {
    let spectorgId = p.spectorg?.id
    if (spectorgId == null) {
      spectorgId = ++maxId
    }

    return {
      id: spectorgId,
      name: p.name,
      category: p.category_name || '',
      subcategory: p.subcategory_name || '',
      description: p.description || '',
      price_rub: p.price_rub || 0,
      moq: p.spectorg?.moq || 20,
      supplier: p.supplier_name || '',
      in_stock: p.is_active !== false,
      image_url: p.spectorg?.image_url || p.images?.[0] || '/images/products/placeholder.jpg',
      image_urls: p.images?.length > 1 ? p.images : undefined,
      specifications: p.specifications || undefined,
      created_at: p.created_at || new Date().toISOString(),
      price_1688_cny: p.spectorg?.price_1688_cny || undefined,
      margin_percent: p.spectorg?.margin_percent || undefined,
      supplier_city: p.spectorg?.supplier_city || undefined,
      supplier_verified: p.spectorg?.supplier_verified || undefined,
      supplier_rating: p.spectorg?.supplier_rating || undefined,
    }
  })

  const output = {
    generated_at: new Date().toISOString(),
    total_products: products.length,
    categories,
    suppliers,
    products,
  }

  if (dryRun) {
    console.log(`  [dry-run] Would write ${catalogPath}:`)
    console.log(`    ${products.length} products, ${categories.length} categories, ${suppliers.length} suppliers`)
    const newFromGet2b = unifiedProducts.filter(p => !p.spectorg).length
    if (newFromGet2b) console.log(`    New from GET2B: ${newFromGet2b} products`)
    return output
  }

  // Backup
  try {
    copyFileSync(catalogPath, catalogPath + '.backup.json')
  } catch { /* first run, no existing file */ }

  // Atomic write
  const tmp = catalogPath + '.tmp'
  writeFileSync(tmp, JSON.stringify(output, null, 2), 'utf-8')
  renameSync(tmp, catalogPath)
  console.log(`  Wrote ${catalogPath} (${products.length} products)`)

  return output
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
