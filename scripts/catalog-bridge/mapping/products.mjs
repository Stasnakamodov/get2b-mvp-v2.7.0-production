/**
 * Product matching between GET2B and A-Spectorg.
 * Strategy: 1) id-map lookup, 2) exact name match.
 */

import { normalizeName, getProductMapping, setProductMapping } from './id-map.mjs'

/**
 * Match products from source to target.
 * Returns { matched: Map<srcProduct, targetProduct>, unmatched: srcProduct[] }
 */
export function matchProducts(sourceProducts, targetProducts) {
  const targetByName = new Map()
  for (const p of targetProducts) {
    targetByName.set(normalizeName(p.name), p)
  }

  const matched = new Map()
  const unmatched = []

  for (const src of sourceProducts) {
    // 1. Check id-map
    const mapping = getProductMapping(src.name)
    if (mapping) {
      // Find target by mapped ID
      const targetId = src.get2b ? mapping.spectorg_id : mapping.get2b_uuid
      if (targetId != null) {
        const target = targetProducts.find(p => {
          if (src.get2b) return p.spectorg?.id === targetId
          return p.get2b?.id === targetId
        })
        if (target) {
          matched.set(src, target)
          continue
        }
      }
    }

    // 2. Exact name match
    const target = targetByName.get(normalizeName(src.name))
    if (target) {
      matched.set(src, target)
      continue
    }

    unmatched.push(src)
  }

  return { matched, unmatched }
}

/**
 * Merge two product into one unified product (combine get2b + spectorg fields).
 * Conflict resolution: last-write-wins by updated_at/created_at.
 */
export function mergeProduct(a, b) {
  const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
  const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
  const newer = aTime >= bTime ? a : b
  const older = aTime >= bTime ? b : a

  const merged = {
    name: newer.name,
    description: newer.description,
    category_name: newer.category_name,
    subcategory_name: newer.subcategory_name,
    supplier_name: newer.supplier_name,
    price_rub: newer.price_rub,
    is_active: newer.is_active,
    images: newer.images.length > 0 ? newer.images : older.images,
    specifications: newer.specifications || older.specifications,
    created_at: older.created_at || newer.created_at,
    updated_at: newer.updated_at || newer.created_at,
    // Combine system-specific fields from both sides
    get2b: a.get2b || b.get2b,
    spectorg: a.spectorg || b.spectorg,
  }

  // Update id-map
  setProductMapping(
    merged.name,
    merged.get2b?.id || null,
    merged.spectorg?.id ?? null
  )

  return merged
}

/**
 * Merge two product lists.
 * Returns: { products: unified[], stats: { matched, newFromA, newFromB } }
 */
export function mergeProducts(get2bProducts, spectorgProducts) {
  const { matched, unmatched: newFromGet2b } = matchProducts(get2bProducts, spectorgProducts)
  const { unmatched: newFromSpectorg } = matchProducts(spectorgProducts, get2bProducts)

  const merged = []

  // Matched products: merge fields
  for (const [get2bProd, spectorgProd] of matched) {
    merged.push(mergeProduct(get2bProd, spectorgProd))
  }

  // New from GET2B (not in Spectorg)
  for (const p of newFromGet2b) {
    setProductMapping(p.name, p.get2b?.id || null, null)
    merged.push(p)
  }

  // New from Spectorg (not in GET2B)
  for (const p of newFromSpectorg) {
    setProductMapping(p.name, null, p.spectorg?.id ?? null)
    merged.push(p)
  }

  return {
    products: merged,
    stats: {
      matched: matched.size,
      newFromGet2b: newFromGet2b.length,
      newFromSpectorg: newFromSpectorg.length,
    },
  }
}
