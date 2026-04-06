/**
 * Category matching between GET2B and A-Spectorg.
 * Uses name-based matching with manual mapping overrides.
 */

import { readFileSync, existsSync } from 'fs'
import { PATHS } from '../config.mjs'
import { normalizeName, setCategoryMapping } from './id-map.mjs'

let _mapping = null

function loadCategoryMapping() {
  if (_mapping) return _mapping
  if (existsSync(PATHS.categoryMapping)) {
    _mapping = JSON.parse(readFileSync(PATHS.categoryMapping, 'utf-8'))
  } else {
    _mapping = { roots: {}, name_aliases: {}, unmapped_get2b: [], unmapped_spectorg: [] }
  }
  return _mapping
}

/**
 * Build a reverse alias map: normalized alias -> canonical name
 */
function buildAliasMap() {
  const mapping = loadCategoryMapping()
  const aliases = new Map()
  for (const [canonical, aliasList] of Object.entries(mapping.name_aliases || {})) {
    for (const alias of aliasList) {
      aliases.set(normalizeName(alias), canonical)
    }
    aliases.set(normalizeName(canonical), canonical)
  }
  return aliases
}

/**
 * Match categories from source to target.
 * Returns a map: source category name -> target category (unified).
 */
export function matchCategories(sourceCategories, targetCategories) {
  const aliases = buildAliasMap()
  const matched = new Map()   // sourceName -> targetCategory
  const unmatched = []

  // Build target lookup by normalized name + aliases
  const targetByName = new Map()
  for (const cat of targetCategories) {
    targetByName.set(normalizeName(cat.name), cat)
  }

  for (const srcCat of sourceCategories) {
    const srcNorm = normalizeName(srcCat.name)

    // Direct name match
    if (targetByName.has(srcNorm)) {
      matched.set(srcCat.name, targetByName.get(srcNorm))
      continue
    }

    // Alias match: resolve source name to canonical, then find canonical in target
    const canonical = aliases.get(srcNorm)
    if (canonical) {
      // Find target category matching this canonical or any of its aliases
      const mapping = loadCategoryMapping()
      const targetAliases = mapping.name_aliases[canonical] || []
      const allNames = [canonical, ...targetAliases]

      let found = null
      for (const name of allNames) {
        found = targetByName.get(normalizeName(name))
        if (found) break
      }
      if (found) {
        matched.set(srcCat.name, found)
        continue
      }
    }

    unmatched.push(srcCat)
  }

  return { matched, unmatched }
}

/**
 * Merge category lists: combine matched + add unmatched from both sides.
 * Returns unified category list with both get2b and spectorg fields populated where possible.
 */
export function mergeCategories(get2bCategories, spectorgCategories) {
  const { matched, unmatched: unmatchedGet2b } = matchCategories(get2bCategories, spectorgCategories)
  const { unmatched: unmatchedSpectorg } = matchCategories(spectorgCategories, get2bCategories)

  const merged = []

  // Matched categories: combine get2b + spectorg fields
  for (const [get2bName, spectorgCat] of matched) {
    const get2bCat = get2bCategories.find(c => c.name === get2bName)
    merged.push({
      ...get2bCat,
      spectorg: spectorgCat.spectorg,
    })

    // Update id-map
    setCategoryMapping(
      get2bName,
      get2bCat.get2b?.id || null,
      spectorgCat.spectorg?.id || null
    )
  }

  // Unmatched from GET2B (new for Spectorg)
  for (const cat of unmatchedGet2b) {
    merged.push(cat)
  }

  // Unmatched from Spectorg (new for GET2B)
  for (const cat of unmatchedSpectorg) {
    merged.push(cat)
  }

  return merged
}
