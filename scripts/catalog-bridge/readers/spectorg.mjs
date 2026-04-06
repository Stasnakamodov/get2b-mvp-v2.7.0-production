/**
 * Read A-Spectorg realistic-catalog-v2.json and convert to unified format.
 */

import { readFileSync } from 'fs'
import { PATHS } from '../config.mjs'

export function readSpectorg(overridePath) {
  const catalogPath = overridePath || PATHS.spectorg.catalog
  const raw = JSON.parse(readFileSync(catalogPath, 'utf-8'))

  // Categories -> unified (flat -> tree)
  const categories = []
  for (const cat of raw.categories) {
    // Root category
    categories.push({
      name: cat.name,
      slug: cat.id,
      icon: cat.icon || null,
      description: null,
      level: 0,
      parent_name: null,
      sort_order: categories.filter(c => c.level === 0).length,
      is_active: true,
      get2b: null,
      spectorg: {
        id: cat.id,
        subcategories: cat.subcategories,
      },
    })

    // Subcategories
    for (let i = 0; i < cat.subcategories.length; i++) {
      categories.push({
        name: cat.subcategories[i],
        slug: transliterate(cat.subcategories[i]),
        icon: null,
        description: null,
        level: 1,
        parent_name: cat.name,
        sort_order: i,
        is_active: true,
        get2b: null,
        spectorg: {
          id: `${cat.id}/${transliterate(cat.subcategories[i])}`,
          subcategories: null,
        },
      })
    }
  }

  // Suppliers -> unified
  const suppliers = raw.suppliers.map(s => ({
    name: s.name,
    country: s.country,
    is_active: true,
    get2b: null,
    spectorg: {
      city: s.city,
      verified: s.verified,
      rating: s.rating,
    },
  }))

  // Products -> unified
  const products = raw.products.map(p => ({
    name: p.name,
    description: p.description,
    category_name: p.category,
    subcategory_name: p.subcategory,
    supplier_name: p.supplier,
    price_rub: p.price_rub || 0,
    is_active: p.in_stock !== false,
    images: p.image_urls || (p.image_url ? [p.image_url] : []),
    specifications: p.specifications || null,
    created_at: p.created_at,
    updated_at: null,
    get2b: null,
    spectorg: {
      id: p.id,
      category: p.category,
      subcategory: p.subcategory,
      supplier: p.supplier,
      price_1688_cny: p.price_1688_cny || null,
      margin_percent: p.margin_percent || null,
      moq: p.moq || 20,
      in_stock: p.in_stock,
      image_url: p.image_url,
      supplier_city: p.supplier_city || null,
      supplier_verified: p.supplier_verified || null,
      supplier_rating: p.supplier_rating || null,
    },
  }))

  console.log(`  Spectorg: ${products.length} products, ${categories.length} categories, ${suppliers.length} suppliers`)

  return {
    categories,
    suppliers,
    products,
    meta: { generated_at: raw.generated_at, total_products: raw.total_products },
  }
}

// ── Helpers ────────────────────────────────────────────────────

function transliterate(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '-',
  }
  return text.toLowerCase().split('').map(c => map[c] || c).join('')
}
