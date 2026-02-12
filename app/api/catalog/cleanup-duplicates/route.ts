import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashImageUrl, normalizeImageUrl } from '@/lib/services/ImportDeduplicationService'

/**
 * POST /api/catalog/cleanup-duplicates
 *
 * One-time admin endpoint to:
 * 1. Find and deactivate name duplicates (keep oldest)
 * 2. Find and deactivate image duplicates (keep oldest)
 * 3. Populate catalog_image_registry for remaining active products
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (admin access).
 */
export async function POST() {
  const startTime = Date.now()

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Missing SUPABASE_SERVICE_ROLE_KEY'
      }, { status: 503 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const report = {
      nameGroups: 0,
      nameDeactivated: 0,
      imageGroups: 0,
      imageDeactivated: 0,
      registryPopulated: 0,
      errors: [] as string[],
    }

    // ─── Step 1: Name duplicates ───────────────────────────────────────────

    // Load all active products
    const { data: allProducts, error: loadError } = await supabaseAdmin
      .from('catalog_verified_products')
      .select('id, name, name_normalized, images, created_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(6000)

    if (loadError) {
      return NextResponse.json({
        success: false,
        error: `Failed to load products: ${loadError.message}`
      }, { status: 500 })
    }

    if (!allProducts || allProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active products found',
        report,
      })
    }

    // Group by name_normalized
    const nameGroups = new Map<string, typeof allProducts>()
    for (const p of allProducts) {
      const key = (p.name_normalized || '').trim()
      if (!key || key.length <= 5) continue
      if (!nameGroups.has(key)) nameGroups.set(key, [])
      nameGroups.get(key)!.push(p)
    }

    // Deactivate duplicates (keep first = oldest by created_at)
    const nameDuplicateIds: string[] = []
    for (const [, group] of nameGroups) {
      if (group.length <= 1) continue
      report.nameGroups++
      // Keep the first (oldest), deactivate the rest
      for (let i = 1; i < group.length; i++) {
        nameDuplicateIds.push(group[i].id)
      }
    }

    if (nameDuplicateIds.length > 0) {
      // Batch deactivate in chunks of 200
      for (let i = 0; i < nameDuplicateIds.length; i += 200) {
        const chunk = nameDuplicateIds.slice(i, i + 200)
        const { error: deactError } = await supabaseAdmin
          .from('catalog_verified_products')
          .update({ is_active: false })
          .in('id', chunk)

        if (deactError) {
          report.errors.push(`Name deactivation error: ${deactError.message}`)
        } else {
          report.nameDeactivated += chunk.length
        }
      }
    }

    // ─── Step 2: Image duplicates ──────────────────────────────────────────

    // Rebuild active products list (exclude those just deactivated)
    const deactivatedSet = new Set(nameDuplicateIds)
    const activeProducts = allProducts.filter(p => !deactivatedSet.has(p.id))

    // Build image -> product mapping (first occurrence wins)
    const imageToProduct = new Map<string, { productId: string; createdAt: string }>()
    const imageDuplicateIds = new Set<string>()

    for (const p of activeProducts) {
      if (!Array.isArray(p.images)) continue
      for (const img of p.images) {
        if (!img || typeof img !== 'string') continue
        const hash = hashImageUrl(img)

        const existing = imageToProduct.get(hash)
        if (existing) {
          // This product shares an image with an older product -> mark as duplicate
          if (existing.productId !== p.id) {
            imageDuplicateIds.add(p.id)
          }
        } else {
          imageToProduct.set(hash, { productId: p.id, createdAt: p.created_at })
        }
      }
    }

    const imageDupArray = Array.from(imageDuplicateIds)
    if (imageDupArray.length > 0) {
      report.imageGroups = imageDupArray.length

      for (let i = 0; i < imageDupArray.length; i += 200) {
        const chunk = imageDupArray.slice(i, i + 200)
        const { error: deactError } = await supabaseAdmin
          .from('catalog_verified_products')
          .update({ is_active: false })
          .in('id', chunk)

        if (deactError) {
          report.errors.push(`Image deactivation error: ${deactError.message}`)
        } else {
          report.imageDeactivated += chunk.length
        }
      }
    }

    // ─── Step 3: Populate image registry ───────────────────────────────────

    // Get final active products (exclude both name and image duplicates)
    const allDeactivated = new Set([...nameDuplicateIds, ...imageDupArray])
    const finalActive = allProducts.filter(p => !allDeactivated.has(p.id))

    // Build registry rows
    const registryRows: Array<{
      url_hash: string
      normalized_url: string
      product_id: string
      original_url: string
      position: number
    }> = []

    const seenHashes = new Set<string>()
    for (const p of finalActive) {
      if (!Array.isArray(p.images)) continue
      for (let idx = 0; idx < p.images.length; idx++) {
        const img = p.images[idx]
        if (!img || typeof img !== 'string') continue
        const hash = hashImageUrl(img)
        if (seenHashes.has(hash)) continue
        seenHashes.add(hash)

        registryRows.push({
          url_hash: hash,
          normalized_url: normalizeImageUrl(img),
          product_id: p.id,
          original_url: img,
          position: idx,
        })
      }
    }

    // Insert in batches of 500
    for (let i = 0; i < registryRows.length; i += 500) {
      const chunk = registryRows.slice(i, i + 500)
      const { error: regError } = await supabaseAdmin
        .from('catalog_image_registry')
        .upsert(chunk, { onConflict: 'url_hash', ignoreDuplicates: true })

      if (regError) {
        report.errors.push(`Registry insert error: ${regError.message}`)
      } else {
        report.registryPopulated += chunk.length
      }
    }

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: `Cleanup complete. Deactivated ${report.nameDeactivated} name duplicates and ${report.imageDeactivated} image duplicates. Registered ${report.registryPopulated} images.`,
      report,
      executionTimeMs: executionTime,
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack,
    }, { status: 500 })
  }
}
