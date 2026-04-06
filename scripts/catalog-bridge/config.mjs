/**
 * Configuration for catalog-bridge: paths, DB targets, constants.
 */

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

// ── Paths ──────────────────────────────────────────────────────

export const PATHS = {
  get2b: {
    root: ROOT,
    seed: path.join(ROOT, 'data', 'catalog-seed.json'),
  },
  spectorg: {
    root: process.env.SPECTORG_ROOT || '/Users/user/Downloads/code',
    get catalog() { return path.join(this.root, 'data', 'realistic-catalog-v2.json') },
  },
  idMap: path.join(ROOT, 'data', 'id-map.json'),
  categoryMapping: path.join(ROOT, 'data', 'category-mapping.json'),
}

// ── DB Targets (same as sync-catalog.mjs) ──────────────────────

export const DB_TARGETS = {
  prod: {
    host: 'localhost',
    port: 5433,
    user: 'get2b',
    password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
    database: 'get2b',
    sshTunnel: 'ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8',
  },
  staging: {
    host: 'localhost',
    port: 5434,
    user: 'get2b',
    password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
    database: 'get2b',
    sshTunnel: 'ssh -f -N -L 5434:127.0.0.1:5432 root@STAGING_IP',
  },
  local: {
    host: 'localhost',
    port: 5432,
    user: 'get2b',
    password: '6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV',
    database: 'get2b',
  },
}

// ── CLI Args Parser ────────────────────────────────────────────

export function parseArgs() {
  const args = process.argv.slice(2)

  const getFlag = (name) => args.includes(`--${name}`)
  const getParam = (name) => {
    const idx = args.indexOf(`--${name}`)
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null
  }

  return {
    from: getParam('from'),       // 'get2b' | 'spectorg'
    to: getParam('to'),           // 'get2b' | 'spectorg'
    merge: getFlag('merge'),
    diff: getFlag('diff'),
    dryRun: getFlag('dry-run'),
    target: getParam('target') || 'prod',
    spectorgPath: getParam('spectorg-path'),
    force: getFlag('force'),
  }
}
