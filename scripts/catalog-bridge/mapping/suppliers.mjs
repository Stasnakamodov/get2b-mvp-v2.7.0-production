/**
 * Supplier matching between GET2B and A-Spectorg.
 * Matches by exact name (case-insensitive).
 */

import { normalizeName, setSupplierMapping } from './id-map.mjs'

/**
 * Match suppliers from source to target by name.
 */
export function matchSuppliers(sourceSuppliers, targetSuppliers) {
  const targetByName = new Map()
  for (const s of targetSuppliers) {
    targetByName.set(normalizeName(s.name), s)
  }

  const matched = new Map()
  const unmatched = []

  for (const src of sourceSuppliers) {
    const target = targetByName.get(normalizeName(src.name))
    if (target) {
      matched.set(src.name, target)
    } else {
      unmatched.push(src)
    }
  }

  return { matched, unmatched }
}

/**
 * Merge supplier lists: combine matched + add unmatched from both sides.
 */
export function mergeSuppliers(get2bSuppliers, spectorgSuppliers) {
  const { matched, unmatched: unmatchedGet2b } = matchSuppliers(get2bSuppliers, spectorgSuppliers)
  const { unmatched: unmatchedSpectorg } = matchSuppliers(spectorgSuppliers, get2bSuppliers)

  const merged = []

  // Matched: combine fields
  for (const [get2bName, spectorgSup] of matched) {
    const get2bSup = get2bSuppliers.find(s => s.name === get2bName)
    merged.push({
      ...get2bSup,
      spectorg: spectorgSup.spectorg,
    })
    setSupplierMapping(get2bName, get2bSup.get2b?.id || null)
  }

  // Unmatched
  for (const s of unmatchedGet2b) merged.push(s)
  for (const s of unmatchedSpectorg) merged.push(s)

  return merged
}
