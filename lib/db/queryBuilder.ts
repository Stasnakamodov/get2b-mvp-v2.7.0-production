/**
 * Supabase-compatible query builder over plain pg Pool.
 *
 * Supports the chaining patterns actually used in the codebase:
 *   db.from('table').select('*').eq('field', val).order('col').range(0, 9)
 *   db.from('table').insert({...}).select().single()
 *   db.from('table').update({...}).eq('id', val).select().single()
 *   db.from('table').delete().eq('id', val)
 *   db.rpc('function_name', { arg: val })
 */

import { Pool, QueryResult } from 'pg'

// ── Response types matching Supabase shape ──────────────────────────

export interface DbResponse<T = any> {
  data: T | null
  error: DbError | null
  count: number | null
  status: number
  statusText: string
}

export interface DbError {
  message: string
  code?: string
  details?: string
  hint?: string
}

// ── PostgREST .or() filter parser ───────────────────────────────────

interface ParsedCondition {
  sql: string
  values: any[]
}

const POSTGREST_OPS: Record<string, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  ilike: 'ILIKE',
  is: 'IS',
  in: 'IN',
}

/**
 * Parse a single PostgREST filter token like "name.ilike.%foo%"
 * Returns { sql, values } with parameterized placeholder.
 */
function parsePostgrestToken(token: string, paramOffset: number): ParsedCondition {
  // Handle and(...) groups
  const andMatch = token.match(/^and\((.+)\)$/)
  if (andMatch) {
    return parsePostgrestExpr(andMatch[1], paramOffset, 'AND')
  }

  // field.op.value
  const dotIdx = token.indexOf('.')
  if (dotIdx === -1) return { sql: 'TRUE', values: [] }
  const field = token.slice(0, dotIdx)
  const rest = token.slice(dotIdx + 1)

  const dotIdx2 = rest.indexOf('.')
  if (dotIdx2 === -1) return { sql: 'TRUE', values: [] }
  const op = rest.slice(0, dotIdx2)
  const rawValue = rest.slice(dotIdx2 + 1)

  const sqlOp = POSTGREST_OPS[op]
  if (!sqlOp) return { sql: 'TRUE', values: [] }

  if (op === 'is') {
    if (rawValue === 'null') return { sql: `"${field}" IS NULL`, values: [] }
    if (rawValue === 'true') return { sql: `"${field}" IS TRUE`, values: [] }
    if (rawValue === 'false') return { sql: `"${field}" IS FALSE`, values: [] }
    return { sql: 'TRUE', values: [] }
  }

  if (op === 'in') {
    // value like (a,b,c)
    const inner = rawValue.replace(/^\(/, '').replace(/\)$/, '')
    const items = inner.split(',')
    const placeholders = items.map((_, i) => `$${paramOffset + i}`)
    return {
      sql: `"${field}" IN (${placeholders.join(', ')})`,
      values: items,
    }
  }

  return {
    sql: `"${field}" ${sqlOp} $${paramOffset}`,
    values: [rawValue],
  }
}

/**
 * Parse a PostgREST compound expression like "a.eq.1,b.gt.2"
 * handling nested and(...) groups, joined with the given logical op.
 */
function parsePostgrestExpr(
  expr: string,
  paramOffset: number,
  joiner: 'OR' | 'AND'
): ParsedCondition {
  const tokens = splitPostgrestTokens(expr)
  const parts: string[] = []
  const allValues: any[] = []

  for (const token of tokens) {
    const parsed = parsePostgrestToken(token, paramOffset + allValues.length)
    parts.push(parsed.sql)
    allValues.push(...parsed.values)
  }

  return {
    sql: `(${parts.join(` ${joiner} `)})`,
    values: allValues,
  }
}

/**
 * Split "a.eq.1,and(b.eq.2,c.lt.3),d.gt.4" respecting parentheses.
 */
function splitPostgrestTokens(expr: string): string[] {
  const tokens: string[] = []
  let depth = 0
  let current = ''

  for (const ch of expr) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      if (current) tokens.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current) tokens.push(current)
  return tokens
}

// ── Query Builder ───────────────────────────────────────────────────

type Operation = 'select' | 'insert' | 'update' | 'delete' | 'upsert'

interface WhereClause {
  sql: string
  values: any[]
}

interface OrderClause {
  column: string
  ascending: boolean
}

export class QueryBuilder {
  private pool: Pool
  private tableName = ''
  private operation: Operation = 'select'
  private columns = '*'
  private whereClauses: WhereClause[] = []
  private orderClauses: OrderClause[] = []
  private limitValue: number | null = null
  private offsetValue: number | null = null
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private insertData: any = null
  private updateData: any = null
  private returnSingle = false
  private returnMaybeSingle = false
  private countMode: 'exact' | null = null
  private headOnly = false
  private selectAfterMutation = false
  private selectColumns = '*'
  private upsertConflictColumns = 'id'
  private upsertIgnoreDuplicates = false

  constructor(pool: Pool) {
    this.pool = pool
  }

  from(table: string): QueryBuilder {
    const qb = new QueryBuilder(this.pool)
    qb.tableName = table
    return qb
  }

  select(
    columns?: string,
    options?: { count?: 'exact'; head?: boolean }
  ): QueryBuilder {
    // When called after insert/update/delete, it means RETURNING
    if (
      this.operation === 'insert' ||
      this.operation === 'update' ||
      this.operation === 'delete' ||
      this.operation === 'upsert'
    ) {
      this.selectAfterMutation = true
      if (columns) this.selectColumns = columns
      return this
    }

    this.operation = 'select'
    if (columns !== undefined) this.columns = columns

    if (options?.count === 'exact') this.countMode = 'exact'
    if (options?.head) this.headOnly = true
    return this
  }

  insert(data: any | any[]): QueryBuilder {
    this.operation = 'insert'
    this.insertData = Array.isArray(data) ? data : [data]
    return this
  }

  update(data: any): QueryBuilder {
    this.operation = 'update'
    this.updateData = data
    return this
  }

  delete(): QueryBuilder {
    this.operation = 'delete'
    return this
  }

  upsert(data: any | any[], options?: { onConflict?: string; ignoreDuplicates?: boolean }): QueryBuilder {
    this.operation = 'upsert'
    this.insertData = Array.isArray(data) ? data : [data]
    this.upsertConflictColumns = options?.onConflict || 'id'
    this.upsertIgnoreDuplicates = options?.ignoreDuplicates || false
    return this
  }

  // ── Filters ─────────────────────────────────────────────────────

  eq(column: string, value: any): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" = ?`, values: [value] })
    return this
  }

  neq(column: string, value: any): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" != ?`, values: [value] })
    return this
  }

  gt(column: string, value: any): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" > ?`, values: [value] })
    return this
  }

  gte(column: string, value: any): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" >= ?`, values: [value] })
    return this
  }

  lt(column: string, value: any): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" < ?`, values: [value] })
    return this
  }

  lte(column: string, value: any): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" <= ?`, values: [value] })
    return this
  }

  like(column: string, pattern: string): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" LIKE ?`, values: [pattern] })
    return this
  }

  ilike(column: string, pattern: string): QueryBuilder {
    this.whereClauses.push({ sql: `"${column}" ILIKE ?`, values: [pattern] })
    return this
  }

  in(column: string, values: any[]): QueryBuilder {
    if (values.length === 0) {
      this.whereClauses.push({ sql: 'FALSE', values: [] })
    } else {
      const placeholders = values.map(() => '?').join(', ')
      this.whereClauses.push({
        sql: `"${column}" IN (${placeholders})`,
        values,
      })
    }
    return this
  }

  is(column: string, value: null | boolean): QueryBuilder {
    if (value === null) {
      this.whereClauses.push({ sql: `"${column}" IS NULL`, values: [] })
    } else {
      this.whereClauses.push({
        sql: `"${column}" IS ${value ? 'TRUE' : 'FALSE'}`,
        values: [],
      })
    }
    return this
  }

  not(column: string, op: string, value: any): QueryBuilder {
    if (op === 'is') {
      if (value === null) {
        this.whereClauses.push({ sql: `"${column}" IS NOT NULL`, values: [] })
      } else {
        this.whereClauses.push({
          sql: `"${column}" IS NOT ${value ? 'TRUE' : 'FALSE'}`,
          values: [],
        })
      }
    } else {
      const sqlOp = POSTGREST_OPS[op] || '='
      this.whereClauses.push({
        sql: `NOT ("${column}" ${sqlOp} ?)`,
        values: [value],
      })
    }
    return this
  }

  contains(column: string, value: any): QueryBuilder {
    this.whereClauses.push({
      sql: `"${column}" @> ?::jsonb`,
      values: [JSON.stringify(value)],
    })
    return this
  }

  or(filterString: string): QueryBuilder {
    // Defer parsing — store raw string, parse during build when we know param offset
    this.whereClauses.push({ sql: `__OR__${filterString}`, values: [] })
    return this
  }

  // ── Modifiers ───────────────────────────────────────────────────

  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ): QueryBuilder {
    this.orderClauses.push({
      column,
      ascending: options?.ascending ?? true,
    })
    return this
  }

  limit(n: number): QueryBuilder {
    this.limitValue = n
    return this
  }

  range(from: number, to: number): QueryBuilder {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  single(): QueryBuilder {
    this.returnSingle = true
    return this
  }

  maybeSingle(): QueryBuilder {
    this.returnMaybeSingle = true
    return this
  }

  // ── Build & Execute ─────────────────────────────────────────────

  /**
   * Thenable — allows `await db.from('t').select('*')`
   */
  then<TResult1 = DbResponse, TResult2 = never>(
    onfulfilled?: (value: DbResponse) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<DbResponse> {
    try {
      switch (this.operation) {
        case 'select':
          return await this.execSelect()
        case 'insert':
          return await this.execInsert()
        case 'update':
          return await this.execUpdate()
        case 'delete':
          return await this.execDelete()
        case 'upsert':
          return await this.execUpsert()
        default:
          return this.err('Unknown operation')
      }
    } catch (e: any) {
      return this.err(e.message, e.code)
    }
  }

  // ── SELECT ──────────────────────────────────────────────────────

  private async execSelect(): Promise<DbResponse> {
    const params: any[] = []

    // Parse columns — strip nested relation syntax for now
    const cols = this.parseSelectColumns(this.columns)

    let sql: string
    if (this.headOnly && this.countMode) {
      sql = `SELECT COUNT(*) AS __count FROM "${this.tableName}"`
    } else if (this.countMode) {
      // We need both data and count — use window function
      sql = `SELECT ${cols}, COUNT(*) OVER() AS __total_count FROM "${this.tableName}"`
    } else {
      sql = `SELECT ${cols} FROM "${this.tableName}"`
    }

    // WHERE
    const where = this.buildWhere(params)
    if (where) sql += ` WHERE ${where}`

    // ORDER BY
    if (this.orderClauses.length > 0 && !this.headOnly) {
      const orders = this.orderClauses.map(
        (o) => `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`
      )
      sql += ` ORDER BY ${orders.join(', ')}`
    }

    // LIMIT / OFFSET
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      const limit = this.rangeTo - this.rangeFrom + 1
      sql += ` LIMIT ${limit} OFFSET ${this.rangeFrom}`
    } else if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`
    }

    const result = await this.pool.query(sql, params)

    if (this.headOnly && this.countMode) {
      const count = parseInt(result.rows[0]?.__count ?? '0', 10)
      return this.ok(null, count)
    }

    let count: number | null = null
    let rows = result.rows
    if (this.countMode && rows.length > 0 && '__total_count' in rows[0]) {
      count = parseInt(rows[0].__total_count, 10)
      rows = rows.map(({ __total_count, ...rest }) => rest)
    }

    if (this.returnSingle) {
      if (rows.length === 0) return this.err('No rows returned', 'PGRST116')
      return this.ok(rows[0], count)
    }
    if (this.returnMaybeSingle) {
      return this.ok(rows[0] ?? null, count)
    }
    return this.ok(rows, count)
  }

  // ── INSERT ──────────────────────────────────────────────────────

  private async execInsert(): Promise<DbResponse> {
    const rows = this.insertData
    if (!rows || rows.length === 0) return this.err('No data to insert')

    const keys = Object.keys(rows[0])
    const params: any[] = []
    const valueSets: string[] = []

    for (const row of rows) {
      const placeholders: string[] = []
      for (const key of keys) {
        params.push(row[key] ?? null)
        placeholders.push(`$${params.length}`)
      }
      valueSets.push(`(${placeholders.join(', ')})`)
    }

    const cols = keys.map((k) => `"${k}"`).join(', ')
    let sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES ${valueSets.join(', ')}`

    if (this.selectAfterMutation) {
      sql += ' RETURNING *'
    }

    const result = await this.pool.query(sql, params)
    const data = this.selectAfterMutation ? result.rows : null

    if (this.returnSingle) {
      return this.ok(data ? data[0] : null)
    }
    return this.ok(data)
  }

  // ── UPDATE ──────────────────────────────────────────────────────

  private async execUpdate(): Promise<DbResponse> {
    if (!this.updateData) return this.err('No data to update')

    const params: any[] = []
    const sets: string[] = []

    for (const [key, value] of Object.entries(this.updateData)) {
      params.push(value ?? null)
      sets.push(`"${key}" = $${params.length}`)
    }

    let sql = `UPDATE "${this.tableName}" SET ${sets.join(', ')}`

    const where = this.buildWhere(params)
    if (where) sql += ` WHERE ${where}`

    if (this.selectAfterMutation) {
      sql += ' RETURNING *'
    }

    const result = await this.pool.query(sql, params)
    const data = this.selectAfterMutation ? result.rows : null

    if (this.returnSingle) {
      return this.ok(data ? data[0] : null)
    }
    return this.ok(data)
  }

  // ── DELETE ──────────────────────────────────────────────────────

  private async execDelete(): Promise<DbResponse> {
    const params: any[] = []
    let sql = `DELETE FROM "${this.tableName}"`

    const where = this.buildWhere(params)
    if (where) sql += ` WHERE ${where}`

    if (this.selectAfterMutation) {
      sql += ' RETURNING *'
    }

    const result = await this.pool.query(sql, params)
    const data = this.selectAfterMutation ? result.rows : null

    if (this.returnSingle) {
      return this.ok(data ? data[0] : null)
    }
    return this.ok(data)
  }

  // ── UPSERT ──────────────────────────────────────────────────────

  private async execUpsert(): Promise<DbResponse> {
    const rows = this.insertData
    if (!rows || rows.length === 0) return this.err('No data to upsert')

    const keys = Object.keys(rows[0])
    const params: any[] = []
    const valueSets: string[] = []

    for (const row of rows) {
      const placeholders: string[] = []
      for (const key of keys) {
        params.push(row[key] ?? null)
        placeholders.push(`$${params.length}`)
      }
      valueSets.push(`(${placeholders.join(', ')})`)
    }

    const cols = keys.map((k) => `"${k}"`).join(', ')
    const conflictCols = this.upsertConflictColumns
      .split(',')
      .map((c) => `"${c.trim()}"`)
      .join(', ')

    let sql: string
    if (this.upsertIgnoreDuplicates) {
      sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES ${valueSets.join(', ')} ON CONFLICT (${conflictCols}) DO NOTHING`
    } else {
      const updates = keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(', ')
      sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES ${valueSets.join(', ')} ON CONFLICT (${conflictCols}) DO UPDATE SET ${updates}`
    }

    if (this.selectAfterMutation) {
      sql += ' RETURNING *'
    }

    const result = await this.pool.query(sql, params)
    const data = this.selectAfterMutation ? result.rows : null

    if (this.returnSingle) {
      return this.ok(data ? data[0] : null)
    }
    return this.ok(data)
  }

  // ── Helpers ─────────────────────────────────────────────────────

  /**
   * Parse select columns, stripping nested relation syntax.
   * "*, relation(col1, col2)" → "*"  (relations handled separately later)
   * "id, name, price" → "\"id\", \"name\", \"price\""
   */
  private parseSelectColumns(raw: string): string {
    if (raw.trim() === '*') return '*'

    // Strip nested relation selects like "relation_name (...)"
    const cleaned = raw.replace(/\w+\s*\([^)]*\)/g, '').trim()
    if (!cleaned || cleaned === ',') return '*'

    const cols = cleaned
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => (c === '*' ? '*' : `"${c}"`))

    return cols.join(', ')
  }

  /**
   * Build WHERE clause from accumulated filters.
   * Replaces `?` placeholders with `$N` for pg parameterized queries.
   * Handles deferred `.or()` parsing.
   */
  private buildWhere(params: any[]): string {
    if (this.whereClauses.length === 0) return ''

    const parts: string[] = []

    for (const clause of this.whereClauses) {
      if (clause.sql.startsWith('__OR__')) {
        // Deferred OR — parse PostgREST expression now
        const expr = clause.sql.slice(6)
        const parsed = parsePostgrestExpr(expr, params.length + 1, 'OR')
        parts.push(parsed.sql)
        params.push(...parsed.values)
      } else {
        // Regular clause — replace ? with $N
        let sql = clause.sql
        for (const val of clause.values) {
          params.push(val)
          sql = sql.replace('?', `$${params.length}`)
        }
        parts.push(sql)
      }
    }

    return parts.join(' AND ')
  }

  private ok(data: any, count: number | null = null): DbResponse {
    return { data, error: null, count, status: 200, statusText: 'OK' }
  }

  private err(message: string, code?: string): DbResponse {
    return {
      data: null,
      error: { message, code },
      count: null,
      status: 500,
      statusText: 'Error',
    }
  }
}

// ── RPC helper ────────────────────────────────────────────────────

export async function rpc(
  pool: Pool,
  fnName: string,
  args?: Record<string, any>
): Promise<DbResponse> {
  try {
    const params: any[] = []
    const argEntries = args ? Object.entries(args) : []
    const argNames = argEntries.map(([key], i) => {
      params.push(argEntries[i][1])
      return `${key} := $${i + 1}`
    })

    const sql = `SELECT * FROM "${fnName}"(${argNames.join(', ')})`
    const result = await pool.query(sql, params)
    return { data: result.rows, error: null, count: null, status: 200, statusText: 'OK' }
  } catch (e: any) {
    return {
      data: null,
      error: { message: e.message, code: e.code },
      count: null,
      status: 500,
      statusText: 'Error',
    }
  }
}
