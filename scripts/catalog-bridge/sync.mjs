/**
 * Sync orchestrator: coordinates readers, mapping, and writers.
 */

import { PATHS } from './config.mjs'
import { readGet2b } from './readers/get2b.mjs'
import { readSpectorg } from './readers/spectorg.mjs'
import { mergeCategories } from './mapping/categories.mjs'
import { mergeSuppliers } from './mapping/suppliers.mjs'
import { mergeProducts, matchProducts } from './mapping/products.mjs'
import { writeSeedJson, upsertToPostgres } from './writers/get2b.mjs'
import { writeSpectorgJson } from './writers/spectorg.mjs'
import { saveIdMap } from './mapping/id-map.mjs'

/**
 * Sync from GET2B -> A-Spectorg.
 * GET2B products appear in Spectorg JSON.
 */
export async function syncGet2bToSpectorg(opts) {
  const { dryRun, spectorgPath } = opts

  console.log('\n--- Reading sources ---')
  const get2b = readGet2b()
  const spectorg = readSpectorg(spectorgPath)

  console.log('\n--- Matching ---')
  const mergedCategories = mergeCategories(get2b.categories, spectorg.categories)
  const mergedSuppliers = mergeSuppliers(get2b.suppliers, spectorg.suppliers)
  const { products: mergedProducts, stats } = mergeProducts(get2b.products, spectorg.products)

  console.log(`  Matched: ${stats.matched}`)
  console.log(`  New from GET2B: ${stats.newFromGet2b}`)
  console.log(`  Already in Spectorg: ${stats.newFromSpectorg}`)
  console.log(`  Total: ${mergedProducts.length}`)

  console.log('\n--- Writing to Spectorg ---')
  writeSpectorgJson(mergedProducts, mergedCategories, mergedSuppliers, spectorgPath, dryRun)

  console.log('\n--- Saving ID map ---')
  saveIdMap(dryRun)

  return { stats, total: mergedProducts.length }
}

/**
 * Sync from A-Spectorg -> GET2B.
 * Spectorg products appear in GET2B seed + optionally PG.
 */
export async function syncSpectorgToGet2b(opts) {
  const { dryRun, target, spectorgPath } = opts

  console.log('\n--- Reading sources ---')
  const get2b = readGet2b()
  const spectorg = readSpectorg(spectorgPath)

  console.log('\n--- Matching ---')
  const { products: mergedProducts, stats } = mergeProducts(get2b.products, spectorg.products)

  console.log(`  Matched: ${stats.matched}`)
  console.log(`  Already in GET2B: ${stats.newFromGet2b}`)
  console.log(`  New from Spectorg: ${stats.newFromSpectorg}`)
  console.log(`  Total: ${mergedProducts.length}`)

  console.log('\n--- Writing to GET2B seed ---')
  // We need existing category/supplier data to resolve IDs
  const rawGet2b = JSON.parse((await import('fs')).readFileSync(PATHS.get2b.seed, 'utf-8'))
  const seed = writeSeedJson(mergedProducts, rawGet2b, dryRun)

  if (target && !dryRun) {
    console.log(`\n--- Upserting to PostgreSQL (${target}) ---`)
    await upsertToPostgres(seed, target, dryRun)
  }

  console.log('\n--- Saving ID map ---')
  saveIdMap(dryRun)

  return { stats, total: mergedProducts.length }
}

/**
 * Full bidirectional merge: both sides get all products.
 */
export async function syncMerge(opts) {
  const { dryRun, target, spectorgPath } = opts

  console.log('\n--- Reading sources ---')
  const get2b = readGet2b()
  const spectorg = readSpectorg(spectorgPath)

  console.log('\n--- Merging ---')
  const mergedCategories = mergeCategories(get2b.categories, spectorg.categories)
  const mergedSuppliers = mergeSuppliers(get2b.suppliers, spectorg.suppliers)
  const { products: mergedProducts, stats } = mergeProducts(get2b.products, spectorg.products)

  console.log(`  Matched: ${stats.matched}`)
  console.log(`  GET2B only: ${stats.newFromGet2b}`)
  console.log(`  Spectorg only: ${stats.newFromSpectorg}`)
  console.log(`  Total merged: ${mergedProducts.length}`)

  // Write to both sides
  console.log('\n--- Writing to Spectorg ---')
  writeSpectorgJson(mergedProducts, mergedCategories, mergedSuppliers, spectorgPath, dryRun)

  console.log('\n--- Writing to GET2B seed ---')
  const rawGet2b = JSON.parse((await import('fs')).readFileSync(PATHS.get2b.seed, 'utf-8'))
  const seed = writeSeedJson(mergedProducts, rawGet2b, dryRun)

  if (target && !dryRun) {
    console.log(`\n--- Upserting to PostgreSQL (${target}) ---`)
    await upsertToPostgres(seed, target, dryRun)
  }

  console.log('\n--- Saving ID map ---')
  saveIdMap(dryRun)

  return { stats, total: mergedProducts.length }
}

/**
 * Show diff between GET2B and Spectorg without writing.
 */
export function showDiff(opts) {
  const { spectorgPath } = opts

  console.log('\n--- Reading sources ---')
  const get2b = readGet2b()
  const spectorg = readSpectorg(spectorgPath)

  console.log('\n--- Diff ---')
  const { matched: matchedG2S, unmatched: onlyGet2b } = matchProducts(get2b.products, spectorg.products)
  const { unmatched: onlySpectorg } = matchProducts(spectorg.products, get2b.products)

  console.log(`\n  Products in both: ${matchedG2S.size}`)
  console.log(`  Only in GET2B: ${onlyGet2b.length}`)
  console.log(`  Only in Spectorg: ${onlySpectorg.length}`)

  if (onlyGet2b.length > 0 && onlyGet2b.length <= 20) {
    console.log(`\n  GET2B-only products:`)
    for (const p of onlyGet2b.slice(0, 20)) {
      console.log(`    - ${p.name} (${p.category_name}/${p.subcategory_name}) ₽${p.price_rub}`)
    }
  }

  if (onlySpectorg.length > 0 && onlySpectorg.length <= 20) {
    console.log(`\n  Spectorg-only products:`)
    for (const p of onlySpectorg.slice(0, 20)) {
      console.log(`    - ${p.name} (${p.category_name}/${p.subcategory_name}) ₽${p.price_rub}`)
    }
  }

  // Category diff
  const get2bCatNames = new Set(get2b.categories.filter(c => c.level === 0).map(c => c.name))
  const spectorgCatNames = new Set(spectorg.categories.filter(c => c.level === 0).map(c => c.name))
  const commonCats = [...get2bCatNames].filter(n => spectorgCatNames.has(n))
  const onlyGet2bCats = [...get2bCatNames].filter(n => !spectorgCatNames.has(n))
  const onlySpectorgCats = [...spectorgCatNames].filter(n => !get2bCatNames.has(n))

  console.log(`\n  Root categories:`)
  console.log(`    Common: ${commonCats.join(', ') || 'none'}`)
  console.log(`    Only GET2B: ${onlyGet2bCats.join(', ') || 'none'}`)
  console.log(`    Only Spectorg: ${onlySpectorgCats.join(', ') || 'none'}`)

  return {
    matched: matchedG2S.size,
    onlyGet2b: onlyGet2b.length,
    onlySpectorg: onlySpectorg.length,
  }
}
