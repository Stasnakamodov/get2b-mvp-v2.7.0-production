import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

/**
 * Generic query proxy for client-side query builder.
 * Accepts serialized query, verifies auth, executes against DB.
 */

// Tables that require authentication
const AUTH_REQUIRED_TABLES = new Set([
  'user_profiles',
  'client_profiles',
  'supplier_profiles',
  'projects',
  'project_specifications',
  'project_requisites',
  'project_status_history',
  'project_templates',
  'chat_rooms',
  'chat_messages',
  'catalog_user_suppliers',
  'catalog_user_products',
  'catalog_carts',
  'catalog_cart_items',
  'constructor_drafts',
  'manager_assignments',
  'project_invoices',
  'bank_accounts',
  'supplier_cards',
  'crypto_wallets',
])

// Tables that allow public read
const PUBLIC_READ_TABLES = new Set([
  'catalog_verified_products',
  'catalog_verified_suppliers',
  'catalog_categories',
  'catalog_subcategories',
  'catalog_collections',
])

// Whitelist of RPC functions callable through this proxy
const ALLOWED_RPC = new Set([
  'get_category_tree',
  'auto_categorize_product',
  'get_products_by_category',
  'get_product_facets',
  'get_cart_with_products',
  'get_supplier_template',
  'increment_template_usage',
  'create_scenario_branch',
  'get_scenario_resolved_steps',
  'freeze_other_scenarios',
  'count_products_by_category_name',
  'count_products_by_subcategory',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract auth (optional — needed for protected tables and mutations)
    let userId: string | null = null
    const token = request.headers.get('authorization')?.substring(7)
    if (token) {
      const payload = await verifyToken(token)
      if (payload) userId = payload.sub
    }

    // Handle RPC calls
    if (body.rpc) {
      if (!userId) {
        return NextResponse.json(
          { data: null, error: { message: 'Authentication required for RPC calls' }, count: null, status: 401, statusText: 'Unauthorized' },
          { status: 401 }
        )
      }

      if (!ALLOWED_RPC.has(body.rpc)) {
        return NextResponse.json(
          { data: null, error: { message: `RPC function '${body.rpc}' is not allowed` }, count: null, status: 403, statusText: 'Forbidden' },
          { status: 403 }
        )
      }

      const result = await db.rpc(body.rpc, body.args)
      return NextResponse.json(result)
    }

    const { table, operation, columns, filters, orders, limitValue, rangeFrom, rangeTo, single, maybeSingle, countMode, headOnly, data, selectAfterMutation } = body

    if (!table) {
      return NextResponse.json(
        { data: null, error: { message: 'Table is required' }, count: null, status: 400, statusText: 'Bad Request' },
        { status: 400 }
      )
    }

    // Check table access
    if (AUTH_REQUIRED_TABLES.has(table) && !userId) {
      return NextResponse.json(
        { data: null, error: { message: 'Authentication required' }, count: null, status: 401, statusText: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For tables not in PUBLIC_READ or AUTH_REQUIRED: require auth for non-select
    if (operation !== 'select' && !userId) {
      return NextResponse.json(
        { data: null, error: { message: 'Authentication required for mutations' }, count: null, status: 401, statusText: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For unknown tables not in public list: require auth for any operation
    if (!PUBLIC_READ_TABLES.has(table) && !AUTH_REQUIRED_TABLES.has(table) && !userId) {
      return NextResponse.json(
        { data: null, error: { message: 'Authentication required' }, count: null, status: 401, statusText: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build and execute query
    let query: any

    if (operation === 'select') {
      const selectOpts: any = {}
      if (countMode) selectOpts.count = countMode
      if (headOnly) selectOpts.head = true
      query = db.from(table).select(columns || '*', Object.keys(selectOpts).length > 0 ? selectOpts : undefined)
    } else if (operation === 'insert') {
      query = db.from(table).insert(data)
      if (selectAfterMutation) query = query.select()
    } else if (operation === 'update') {
      query = db.from(table).update(data)
      if (selectAfterMutation) query = query.select()
    } else if (operation === 'delete') {
      query = db.from(table).delete()
      if (selectAfterMutation) query = query.select()
    } else if (operation === 'upsert') {
      query = db.from(table).upsert(data)
      if (selectAfterMutation) query = query.select()
    }

    // Apply filters
    if (filters) {
      for (const f of filters) {
        switch (f.type) {
          case 'eq': query = query.eq(f.column, f.value); break
          case 'neq': query = query.neq(f.column, f.value); break
          case 'gt': query = query.gt(f.column, f.value); break
          case 'gte': query = query.gte(f.column, f.value); break
          case 'lt': query = query.lt(f.column, f.value); break
          case 'lte': query = query.lte(f.column, f.value); break
          case 'like': query = query.like(f.column, f.value); break
          case 'ilike': query = query.ilike(f.column, f.value); break
          case 'in': query = query.in(f.column, f.value); break
          case 'is': query = query.is(f.column, f.value); break
          case 'or': query = query.or(f.expr); break
          case 'contains': query = query.contains(f.column, f.value); break
          case 'not': query = query.not(f.column, f.value.op, f.value.value); break
        }
      }
    }

    // Apply modifiers
    if (orders) {
      for (const o of orders) {
        query = query.order(o.column, { ascending: o.ascending })
      }
    }
    if (limitValue) query = query.limit(limitValue)
    if (rangeFrom !== undefined && rangeTo !== undefined) {
      query = query.range(rangeFrom, rangeTo)
    }
    if (single) query = query.single()
    if (maybeSingle) query = query.maybeSingle()

    const result = await query
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json(
      { data: null, error: { message: e.message }, count: null, status: 500, statusText: 'Error' },
      { status: 500 }
    )
  }
}
