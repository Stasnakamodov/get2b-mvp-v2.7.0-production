import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { CATEGORY_CERTIFICATIONS } from "@/src/shared/config"

/**
 * Catalog categories API
 *
 * Source of truth is the DB: `catalog_categories` table already encodes
 * the parent/child hierarchy via `parent_id` + `level` (0 = root, 1 = narrow).
 * This route returns the 2-level tree. No hardcoded category names, no
 * hardcoded icons — they all live in DB columns.
 *
 * Modes:
 * - default: tree of active level=0 with children = active level=1 under them
 * - ?simple=true: flat array of category names (alphabetical)
 * - ?tree=true: RPC get_category_tree (legacy consumers)
 * - ?stats=true: products_count per level=0 category by matching
 *   catalog_verified_products.category (text) to level=1 child names
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const simpleList = searchParams.get('simple') === 'true'
    const treeMode = searchParams.get('tree') === 'true'
    const statsMode = searchParams.get('stats') === 'true'

    // ?tree=true — legacy RPC path
    if (treeMode) {
      const { data, error } = await db.rpc('get_category_tree')
      if (error) {
        console.error("[API] Category tree error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, tree: data })
    }

    // ?simple=true — just names
    if (simpleList) {
      const { data: categories, error } = await db
        .from("catalog_categories")
        .select("name")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("[API] Ошибка загрузки категорий:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      const categoryNames = categories?.map(c => c.name).filter(Boolean) || []
      return NextResponse.json({ success: true, categories: categoryNames, count: categoryNames.length })
    }

    // Load full active set once (both levels) — parents + children in a single query.
    const { data: allRows, error: allError } = await db
      .from("catalog_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (allError) {
      console.error("[API] Ошибка загрузки категорий:", allError)
      return NextResponse.json({ success: false, error: allError.message }, { status: 500 })
    }

    const rows = allRows || []
    const parents = rows.filter((r: any) => r.level === 0)
    const children = rows.filter((r: any) => r.level === 1 && r.parent_id)

    // Count products per narrow category name in a single GROUP BY RPC
    const childNames = children.map((c: any) => c.name)
    const countsByName: Record<string, number> = {}

    if (childNames.length > 0) {
      const { data: countData, error: rpcError } = await db.rpc(
        'count_products_by_category_name',
        { category_names: childNames }
      )
      if (!rpcError && countData) {
        for (const row of countData) {
          if (row.category_name) countsByName[row.category_name] = Number(row.count)
        }
      } else if (rpcError) {
        console.warn("[API] RPC fallback: count_products_by_category_name failed:", rpcError.message)
        const countPromises = childNames.map(async (name: string) => {
          const { count } = await db
            .from("catalog_verified_products")
            .select("*", { count: 'exact', head: true })
            .eq('category', name)
            .eq('is_active', true)
          return { name, count: count || 0 }
        })
        const results = await Promise.all(countPromises)
        for (const { name, count } of results) countsByName[name] = count
      }
    }

    // ?stats=true — sum child counts per parent (used by legacy callers)
    if (statsMode) {
      const categoryStats: Record<string, { verified: number; user: number; total: number }> = {}
      for (const p of parents) {
        const total = children
          .filter((c: any) => c.parent_id === p.id)
          .reduce((sum: number, c: any) => sum + (countsByName[c.name] || 0), 0)
        categoryStats[p.name] = { verified: total, user: 0, total }
      }
      const response = NextResponse.json({ success: true, categoryStats })
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      return response
    }

    // Default: tree of level=0 with embedded level=1 children
    const categoriesWithChildren = parents.map((parent: any) => {
      const parentChildren = children
        .filter((c: any) => c.parent_id === parent.id)
        .map((c: any) => ({
          id: c.id,
          key: c.key || c.name.toLowerCase().replace(/\s+/g, '_'),
          name: c.name,
          icon: c.icon || '📦',
          category_id: parent.id,
          products_count: countsByName[c.name] || 0,
        }))

      const totalProducts = parentChildren.reduce((sum, c) => sum + c.products_count, 0)

      return {
        ...parent,
        products_count: totalProducts,
        subcategories: parentChildren,
      }
    })

    const stats = {
      total_categories: parents.length,
      total_subcategories: children.length,
    }

    const response = NextResponse.json({
      success: true,
      categories: categoriesWithChildren,
      stats,
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error("[API] Критическая ошибка загрузки категорий:", error)
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 })
  }
}

// POST: Legacy sync of root categories from CATEGORY_CERTIFICATIONS. Icons are
// NOT set here — they are managed in DB migrations. Hierarchy (parent_id/level)
// is also not touched.
export async function POST() {
  try {
    const { data: existingCategories, error: selectError } = await db
      .from("catalog_categories")
      .select("key, name, id")

    if (selectError) {
      console.error("[API] Ошибка получения существующих категорий:", selectError)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    const existingKeys = new Set(existingCategories?.map(cat => cat.key) || [])

    const categoriesToInsert = CATEGORY_CERTIFICATIONS
      .filter(cat => !existingKeys.has(cat.category.toLowerCase().replace(/\s+/g, '_')))
      .map(cat => ({
        key: cat.category.toLowerCase().replace(/\s+/g, '_'),
        name: cat.category,
        description: `${cat.category}. Сертификации: ${cat.certifications.join(', ')}`,
        is_active: true,
      }))

    if (categoriesToInsert.length === 0) {
      return NextResponse.json({
        message: "Все категории уже синхронизированы",
        existing: existingCategories?.length || 0,
        total: CATEGORY_CERTIFICATIONS.length,
      })
    }

    const { data, error } = await db
      .from("catalog_categories")
      .insert(categoriesToInsert)
      .select()

    if (error) {
      console.error("[API] Ошибка создания категорий:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Категории успешно синхронизированы",
      created: data?.length || 0,
      existing: existingCategories?.length || 0,
      total: (existingCategories?.length || 0) + (data?.length || 0),
    })
  } catch (error) {
    console.error("[API] Критическая ошибка синхронизации:", error)
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 })
  }
}

// PATCH: Обновление категории
export async function PATCH(request: NextRequest) {
  const { id, ...updateData } = await request.json()
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для обновления" }, { status: 400 })
  }
  const { data, error } = await db
    .from("catalog_categories")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}

// DELETE: Удаление категории
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для удаления" }, { status: 400 })
  }
  const { data, error } = await db
    .from("catalog_categories")
    .delete()
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}
