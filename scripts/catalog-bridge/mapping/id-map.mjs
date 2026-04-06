/**
 * Persistent ID map: stores cross-system ID mappings.
 * Keys are normalized names (lowercase, trimmed).
 */

import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { PATHS } from '../config.mjs'

const EMPTY_MAP = {
  _meta: { version: 1, last_sync: null },
  products: {},
  categories: {},
  suppliers: {},
}

let _map = null

export function normalizeName(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export function loadIdMap() {
  if (_map) return _map
  if (existsSync(PATHS.idMap)) {
    _map = JSON.parse(readFileSync(PATHS.idMap, 'utf-8'))
  } else {
    _map = structuredClone(EMPTY_MAP)
  }
  return _map
}

export function saveIdMap(dryRun = false) {
  const map = loadIdMap()
  map._meta.last_sync = new Date().toISOString()
  if (dryRun) {
    console.log(`  [dry-run] Would save id-map.json (${Object.keys(map.products).length} products, ${Object.keys(map.categories).length} categories, ${Object.keys(map.suppliers).length} suppliers)`)
    return
  }
  const tmp = PATHS.idMap + '.tmp'
  writeFileSync(tmp, JSON.stringify(map, null, 2), 'utf-8')
  renameSync(tmp, PATHS.idMap)
  console.log(`  Saved id-map.json`)
}

// ── Product mappings ───────────────────────────────────────────

export function getProductMapping(name) {
  const map = loadIdMap()
  return map.products[normalizeName(name)] || null
}

export function setProductMapping(name, get2bUuid, spectorgId) {
  const map = loadIdMap()
  const key = normalizeName(name)
  const existing = map.products[key] || {}
  map.products[key] = {
    get2b_uuid: get2bUuid ?? existing.get2b_uuid ?? null,
    spectorg_id: spectorgId ?? existing.spectorg_id ?? null,
    last_synced: new Date().toISOString(),
  }
}

// ── Category mappings ──────────────────────────────────────────

export function getCategoryMapping(name) {
  const map = loadIdMap()
  return map.categories[normalizeName(name)] || null
}

export function setCategoryMapping(name, get2bUuid, spectorgKey) {
  const map = loadIdMap()
  map.categories[normalizeName(name)] = {
    get2b_uuid: get2bUuid ?? null,
    spectorg_key: spectorgKey ?? null,
  }
}

// ── Supplier mappings ──────────────────────────────────────────

export function getSupplierMapping(name) {
  const map = loadIdMap()
  return map.suppliers[normalizeName(name)] || null
}

export function setSupplierMapping(name, get2bUuid) {
  const map = loadIdMap()
  map.suppliers[normalizeName(name)] = {
    get2b_uuid: get2bUuid ?? null,
  }
}
