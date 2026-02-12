/**
 * ImportDeduplicationService - 5-layer deduplication for OTAPI product imports
 *
 * Ported from archive/old-import-scripts/smart-import-otapi.js to production TypeScript.
 *
 * Layers:
 * 1. SKU exact match (O(1) Set lookup)
 * 2. Normalized name exact match (O(1) Map lookup)
 * 3. Image URL hash match (O(1) Map lookup per image)
 * 4. Fuzzy name similarity — Jaccard, threshold 0.6 (O(n) linear scan)
 * 5. Price + name similarity — ±10 RUB + 0.5 Jaccard (O(n) linear scan)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DuplicateCheckInput {
  sku?: string
  name: string
  images: string[]
  price: number
  category?: string
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  reason?: 'sku' | 'name_exact' | 'image_hash' | 'name_fuzzy' | 'price_name'
  matchedProductId?: string
  similarity?: number
}

interface CachedProduct {
  id: string
  name: string
  nameNormalized: string
  nameTokens: Set<string>
  price: number
  sku?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FUZZY_NAME_THRESHOLD = 0.6
const PRICE_NAME_THRESHOLD = 0.5
const PRICE_TOLERANCE_RUB = 10

/** CDN / tracking params to strip from image URLs */
const STRIP_PARAMS = [
  'x-oss-process', 'scm', 'scm_id', '_', 'spm', 'pvid',
  'algo_pvid', 'algo_exp_id', 'btsid', 'ws_ab_test', 'sk',
  'aff_platform', 'aff_trace_key', 'terminal_id'
]

/** Size suffixes appended by CDN (e.g. _100x100.jpg) */
const SIZE_SUFFIX_RE = /_\d+x\d+(?:\.\w+)?$/

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalize image URL: strip CDN variants, tracking params, size suffixes.
 */
export function normalizeImageUrl(url: string): string {
  try {
    const u = new URL(url)
    // Remove tracking / CDN params
    for (const p of STRIP_PARAMS) u.searchParams.delete(p)
    // Remove size suffix from pathname  e.g.  /img/abc_100x100.jpg -> /img/abc.jpg
    u.pathname = u.pathname.replace(SIZE_SUFFIX_RE, '')
    // Normalise protocol
    u.protocol = 'https:'
    return u.toString()
  } catch {
    // If URL parsing fails, do simple string cleanup
    return url.split('?')[0].replace(SIZE_SUFFIX_RE, '')
  }
}

/**
 * Hash an image URL. Tries to extract the unique image ID first;
 * falls back to MD5 of the normalized URL.
 */
export function hashImageUrl(url: string): string {
  const normalized = normalizeImageUrl(url)
  // Try to extract image file ID from path (common CDN pattern)
  const match = normalized.match(/\/([A-Za-z0-9_-]{8,})\.(jpg|jpeg|png|gif|webp)/i)
  if (match) return match[1]
  return createHash('md5').update(normalized).digest('hex')
}

/**
 * Normalize a product name for exact-match deduplication.
 * Matches the DB trigger fn_normalize_product_name().
 */
export function normalizeName(name: string): string {
  return name
    .substring(0, 60)
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
}

/**
 * Tokenize a string into a Set of words (for Jaccard).
 */
function tokenize(str: string): Set<string> {
  return new Set(
    str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean)
  )
}

/**
 * Jaccard similarity between two token sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let intersection = 0
  a.forEach(token => {
    if (b.has(token)) intersection++
  })
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ImportDeduplicationService {
  private supabase: SupabaseClient
  private initialized = false

  // In-memory caches
  private skuSet = new Set<string>()
  private nameMap = new Map<string, string>()        // normalized_name -> product_id
  private imageHashMap = new Map<string, string>()    // url_hash -> product_id
  private products: CachedProduct[] = []              // for fuzzy scans

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  /**
   * Load existing products into in-memory caches.
   * Call once before processing a batch.
   */
  async initialize(category?: string): Promise<void> {
    this.skuSet.clear()
    this.nameMap.clear()
    this.imageHashMap.clear()
    this.products = []

    // Load products
    let query = this.supabase
      .from('catalog_verified_products')
      .select('id, name, name_normalized, sku, price, images')
      .eq('is_active', true)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: products, error } = await query.limit(6000)

    if (error) {
      console.error('[Dedup] Error loading products:', error.message)
      throw new Error(`Failed to load products for dedup: ${error.message}`)
    }

    if (products) {
      for (const p of products) {
        // SKU
        if (p.sku) this.skuSet.add(p.sku)

        // Normalized name
        const normalized = p.name_normalized || normalizeName(p.name)
        this.nameMap.set(normalized, p.id)

        // Images
        if (Array.isArray(p.images)) {
          for (const img of p.images) {
            if (typeof img === 'string' && img) {
              this.imageHashMap.set(hashImageUrl(img), p.id)
            }
          }
        }

        // For fuzzy scan
        this.products.push({
          id: p.id,
          name: p.name,
          nameNormalized: normalized,
          nameTokens: tokenize(p.name),
          price: p.price ?? 0,
          sku: p.sku ?? undefined,
        })
      }
    }

    // Also load from image registry (in case some images aren't in product.images array)
    const { data: registryImages } = await this.supabase
      .from('catalog_image_registry')
      .select('url_hash, product_id')
      .limit(20000)

    if (registryImages) {
      for (const ri of registryImages) {
        if (!this.imageHashMap.has(ri.url_hash)) {
          this.imageHashMap.set(ri.url_hash, ri.product_id)
        }
      }
    }

    console.log(`[Dedup] Initialized: ${this.skuSet.size} SKUs, ${this.nameMap.size} names, ${this.imageHashMap.size} images, ${this.products.length} products`)
    this.initialized = true
  }

  /**
   * 5-layer duplicate check.
   */
  checkDuplicate(input: DuplicateCheckInput): DuplicateCheckResult {
    if (!this.initialized) {
      throw new Error('[Dedup] Service not initialized. Call initialize() first.')
    }

    // Layer 1: SKU exact match
    if (input.sku && this.skuSet.has(input.sku)) {
      return { isDuplicate: true, reason: 'sku' }
    }

    // Layer 2: Normalized name exact match
    const normalized = normalizeName(input.name)
    const nameMatch = this.nameMap.get(normalized)
    if (nameMatch) {
      return { isDuplicate: true, reason: 'name_exact', matchedProductId: nameMatch }
    }

    // Layer 3: Image URL hash match
    for (const img of input.images) {
      if (!img) continue
      const hash = hashImageUrl(img)
      const imgMatch = this.imageHashMap.get(hash)
      if (imgMatch) {
        return { isDuplicate: true, reason: 'image_hash', matchedProductId: imgMatch }
      }
    }

    // Layer 4: Fuzzy name similarity (Jaccard >= 0.6)
    const inputTokens = tokenize(input.name)
    if (inputTokens.size > 1) {
      for (const existing of this.products) {
        const sim = jaccardSimilarity(inputTokens, existing.nameTokens)
        if (sim >= FUZZY_NAME_THRESHOLD) {
          return {
            isDuplicate: true,
            reason: 'name_fuzzy',
            matchedProductId: existing.id,
            similarity: sim,
          }
        }
      }
    }

    // Layer 5: Price + name similarity (±10 RUB + Jaccard > 0.5)
    if (input.price > 0 && inputTokens.size > 1) {
      for (const existing of this.products) {
        if (Math.abs(existing.price - input.price) <= PRICE_TOLERANCE_RUB) {
          const sim = jaccardSimilarity(inputTokens, existing.nameTokens)
          if (sim > PRICE_NAME_THRESHOLD) {
            return {
              isDuplicate: true,
              reason: 'price_name',
              matchedProductId: existing.id,
              similarity: sim,
            }
          }
        }
      }
    }

    return { isDuplicate: false }
  }

  /**
   * Register a newly imported product in the in-memory caches
   * so within-batch duplicates are also caught.
   */
  registerProduct(product: {
    id: string
    name: string
    sku?: string
    price: number
    images: string[]
  }): void {
    if (product.sku) this.skuSet.add(product.sku)

    const normalized = normalizeName(product.name)
    this.nameMap.set(normalized, product.id)

    for (const img of product.images) {
      if (img) this.imageHashMap.set(hashImageUrl(img), product.id)
    }

    this.products.push({
      id: product.id,
      name: product.name,
      nameNormalized: normalized,
      nameTokens: tokenize(product.name),
      price: product.price,
      sku: product.sku,
    })
  }

  /**
   * Register product images in the catalog_image_registry table.
   */
  async registerImages(productId: string, images: string[]): Promise<void> {
    const rows = images.map((img, idx) => ({
      url_hash: hashImageUrl(img),
      normalized_url: normalizeImageUrl(img),
      product_id: productId,
      original_url: img,
      position: idx,
    }))

    if (rows.length === 0) return

    // Use upsert to skip conflicts on url_hash
    const { error } = await this.supabase
      .from('catalog_image_registry')
      .upsert(rows, { onConflict: 'url_hash', ignoreDuplicates: true })

    if (error) {
      console.warn(`[Dedup] Image registry error for product ${productId}: ${error.message}`)
    }
  }

  get stats() {
    return {
      skus: this.skuSet.size,
      names: this.nameMap.size,
      imageHashes: this.imageHashMap.size,
      products: this.products.length,
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _instance: ImportDeduplicationService | null = null

export function getDeduplicationService(): ImportDeduplicationService {
  if (!_instance) {
    // Use admin client (service role) for server-side access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    _instance = new ImportDeduplicationService(supabaseAdmin)
  }
  return _instance
}
