/**
 * Read GET2B catalog-seed.json and convert to unified format.
 */

import { readFileSync } from 'fs'
import { PATHS } from '../config.mjs'

export function readGet2b() {
  const raw = JSON.parse(readFileSync(PATHS.get2b.seed, 'utf-8'))

  // Build lookup maps
  const catById = new Map(raw.categories.map(c => [c.id, c]))
  const supById = new Map(raw.suppliers.map(s => [s.id, s]))

  // Categories -> unified
  const categories = raw.categories.map(c => {
    const parent = c.parent_id ? catById.get(c.parent_id) : null
    return {
      name: c.name,
      slug: c.slug || c.key,
      icon: c.icon || null,
      description: c.description || null,
      level: c.level,
      parent_name: parent?.name || null,
      sort_order: c.sort_order,
      is_active: c.is_active,
      get2b: {
        id: c.id,
        parent_id: c.parent_id,
        key: c.key,
        full_path: c.full_path,
        has_subcategories: c.has_subcategories,
      },
      spectorg: null,
    }
  })

  // Suppliers -> unified
  const suppliers = raw.suppliers.map(s => ({
    name: s.name,
    country: s.country,
    is_active: s.is_active,
    get2b: {
      id: s.id,
      contact_info: s.contact_info,
      created_at: s.created_at,
    },
    spectorg: null,
  }))

  // Products -> unified
  const products = raw.products.map(p => {
    const cat = catById.get(p.category_id)
    const parentCat = cat?.parent_id ? catById.get(cat.parent_id) : cat
    const sup = supById.get(p.supplier_id)

    return {
      name: p.name,
      description: p.description,
      category_name: cat?.level > 0 ? parentCat?.name || cat?.name : cat?.name || null,
      subcategory_name: cat?.level > 0 ? cat.name : null,
      supplier_name: sup?.name || null,
      price_rub: parseFloat(p.price) || 0,
      is_active: p.is_active,
      images: p.images || [],
      specifications: p.specifications || null,
      created_at: p.created_at,
      updated_at: p.updated_at,
      get2b: {
        id: p.id,
        category_id: p.category_id,
        supplier_id: p.supplier_id,
        unit: p.unit,
      },
      spectorg: null,
    }
  })

  console.log(`  GET2B: ${products.length} products, ${categories.length} categories, ${suppliers.length} suppliers`)

  return {
    categories,
    suppliers,
    products,
    collections: raw.collections || [],
    meta: raw._meta,
  }
}
