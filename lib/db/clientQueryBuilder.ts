'use client'

/**
 * Client-side query builder that mirrors the server-side API but
 * sends queries through /api/db/query instead of hitting PostgreSQL directly.
 */

import type { DbResponse } from './queryBuilder'

interface SerializedQuery {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  columns?: string
  filters: Array<{ type: string; column?: string; value?: any; expr?: string }>
  orders: Array<{ column: string; ascending: boolean }>
  limitValue?: number
  rangeFrom?: number
  rangeTo?: number
  single?: boolean
  maybeSingle?: boolean
  countMode?: 'exact'
  headOnly?: boolean
  data?: any
  selectAfterMutation?: boolean
}

const TOKEN_KEY = 'auth-token'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

async function executeQuery(query: SerializedQuery): Promise<DbResponse> {
  try {
    const token = getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch('/api/db/query', {
      method: 'POST',
      headers,
      body: JSON.stringify(query),
    })

    return await res.json()
  } catch (e: any) {
    return {
      data: null,
      error: { message: e.message },
      count: null,
      status: 500,
      statusText: 'Error',
    }
  }
}

export class ClientQueryBuilder {
  private query: SerializedQuery

  constructor() {
    this.query = {
      table: '',
      operation: 'select',
      filters: [],
      orders: [],
    }
  }

  from(table: string): ClientQueryBuilder {
    const qb = new ClientQueryBuilder()
    qb.query.table = table
    return qb
  }

  select(columns?: string, options?: { count?: 'exact'; head?: boolean }): ClientQueryBuilder {
    if (
      this.query.operation === 'insert' ||
      this.query.operation === 'update' ||
      this.query.operation === 'delete' ||
      this.query.operation === 'upsert'
    ) {
      this.query.selectAfterMutation = true
      return this
    }

    this.query.operation = 'select'
    if (columns) this.query.columns = columns
    if (options?.count === 'exact') this.query.countMode = 'exact'
    if (options?.head) this.query.headOnly = true
    return this
  }

  insert(data: any): ClientQueryBuilder {
    this.query.operation = 'insert'
    this.query.data = Array.isArray(data) ? data : [data]
    return this
  }

  update(data: any): ClientQueryBuilder {
    this.query.operation = 'update'
    this.query.data = data
    return this
  }

  delete(): ClientQueryBuilder {
    this.query.operation = 'delete'
    return this
  }

  upsert(data: any): ClientQueryBuilder {
    this.query.operation = 'upsert'
    this.query.data = Array.isArray(data) ? data : [data]
    return this
  }

  eq(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'neq', column, value })
    return this
  }

  gt(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'gt', column, value })
    return this
  }

  gte(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'gte', column, value })
    return this
  }

  lt(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'lt', column, value })
    return this
  }

  lte(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'lte', column, value })
    return this
  }

  like(column: string, pattern: string): ClientQueryBuilder {
    this.query.filters.push({ type: 'like', column, value: pattern })
    return this
  }

  ilike(column: string, pattern: string): ClientQueryBuilder {
    this.query.filters.push({ type: 'ilike', column, value: pattern })
    return this
  }

  in(column: string, values: any[]): ClientQueryBuilder {
    this.query.filters.push({ type: 'in', column, value: values })
    return this
  }

  is(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'is', column, value })
    return this
  }

  or(expr: string): ClientQueryBuilder {
    this.query.filters.push({ type: 'or', expr })
    return this
  }

  contains(column: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'contains', column, value })
    return this
  }

  not(column: string, op: string, value: any): ClientQueryBuilder {
    this.query.filters.push({ type: 'not', column, value: { op, value } })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): ClientQueryBuilder {
    this.query.orders.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  limit(n: number): ClientQueryBuilder {
    this.query.limitValue = n
    return this
  }

  range(from: number, to: number): ClientQueryBuilder {
    this.query.rangeFrom = from
    this.query.rangeTo = to
    return this
  }

  single(): ClientQueryBuilder {
    this.query.single = true
    return this
  }

  maybeSingle(): ClientQueryBuilder {
    this.query.maybeSingle = true
    return this
  }

  then<TResult1 = DbResponse, TResult2 = never>(
    onfulfilled?: (value: DbResponse) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return executeQuery(this.query).then(onfulfilled, onrejected)
  }
}

// ── Client-side RPC ──────────────────────────────────────────────

export async function clientRpc(
  fnName: string,
  args?: Record<string, any>
): Promise<DbResponse> {
  try {
    const token = getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch('/api/db/query', {
      method: 'POST',
      headers,
      body: JSON.stringify({ rpc: fnName, args }),
    })

    return await res.json()
  } catch (e: any) {
    return {
      data: null,
      error: { message: e.message },
      count: null,
      status: 500,
      statusText: 'Error',
    }
  }
}
