#!/usr/bin/env node
/**
 * Catalog Bridge — bidirectional sync between GET2B and A-Spectorg.
 *
 * Usage:
 *   node scripts/catalog-bridge/index.mjs --from get2b --to spectorg [--dry-run]
 *   node scripts/catalog-bridge/index.mjs --from spectorg --to get2b [--dry-run] [--target prod]
 *   node scripts/catalog-bridge/index.mjs --merge [--dry-run]
 *   node scripts/catalog-bridge/index.mjs --diff
 */

import { parseArgs } from './config.mjs'
import { syncGet2bToSpectorg, syncSpectorgToGet2b, syncMerge, showDiff } from './sync.mjs'

const args = parseArgs()

console.log('='.repeat(60))
console.log('  Catalog Bridge — GET2B <-> A-Spectorg')
console.log('='.repeat(60))

if (args.dryRun) console.log('  Mode: DRY RUN')
if (args.spectorgPath) console.log(`  Spectorg path: ${args.spectorgPath}`)

const opts = {
  dryRun: args.dryRun,
  target: args.target,
  spectorgPath: args.spectorgPath || null,
}

try {
  if (args.diff) {
    showDiff(opts)
  } else if (args.merge) {
    await syncMerge(opts)
  } else if (args.from && args.to) {
    if (args.from === 'get2b' && args.to === 'spectorg') {
      await syncGet2bToSpectorg(opts)
    } else if (args.from === 'spectorg' && args.to === 'get2b') {
      await syncSpectorgToGet2b(opts)
    } else {
      console.error(`\nUnknown direction: --from ${args.from} --to ${args.to}`)
      console.error('Valid: --from get2b --to spectorg, --from spectorg --to get2b')
      process.exit(1)
    }
  } else {
    console.log(`
Usage:
  node scripts/catalog-bridge/index.mjs --from get2b --to spectorg [--dry-run]
  node scripts/catalog-bridge/index.mjs --from spectorg --to get2b [--dry-run] [--target prod]
  node scripts/catalog-bridge/index.mjs --merge [--dry-run]
  node scripts/catalog-bridge/index.mjs --diff
`)
    process.exit(0)
  }

  console.log('\n' + '='.repeat(60))
  console.log('  Done!')
  console.log('='.repeat(60))

} catch (err) {
  console.error(`\nFATAL: ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}
