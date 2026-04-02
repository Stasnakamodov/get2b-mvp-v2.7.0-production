/**
 * Drop-in replacement for Supabase client.
 *
 * Usage (same as before, just change the import):
 *   import { db } from '@/lib/db'
 *   const { data, error } = await db.from('table').select('*').eq('id', val)
 *   const { data, error } = await db.rpc('fn_name', { arg: 1 })
 *
 * For admin operations (bypass RLS-like checks):
 *   import { dbAdmin } from '@/lib/db'
 *
 * For auth:
 *   db.auth.getUser(token)  — verifies JWT, returns user
 *   db.auth.signIn(...)     — handled via /api/auth/* routes on client
 */

import { pool } from './pool'
import { QueryBuilder, rpc as rpcFn, DbResponse } from './queryBuilder'
import { verifyToken } from '../auth'

// ── Auth stub (server-side) ──────────────────────────────────────

interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthResponse {
  data: { user: AuthUser | null; session?: any }
  error: { message: string; status?: number } | null
}

const authMethods = {
  /**
   * Get user from JWT token.
   * Compatible with: supabase.auth.getUser() and supabase.auth.getUser(token)
   */
  async getUser(token?: string): Promise<AuthResponse> {
    if (!token) {
      return {
        data: { user: null },
        error: { message: 'No token provided', status: 401 },
      }
    }

    try {
      const payload = await verifyToken(token)
      if (!payload) {
        return {
          data: { user: null },
          error: { message: 'Invalid token', status: 401 },
        }
      }

      return {
        data: {
          user: {
            id: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string | undefined,
            role: payload.role as string | undefined,
          },
        },
        error: null,
      }
    } catch {
      return {
        data: { user: null },
        error: { message: 'Token verification failed', status: 401 },
      }
    }
  },

  /**
   * Get session — for server-side, just returns null (sessions are client-side).
   */
  async getSession(): Promise<{ data: { session: any }; error: any }> {
    return { data: { session: null }, error: null }
  },
}

// ── Storage stub (server-side) ───────────────────────────────────

function storageFrom(bucket: string) {
  const baseUrl = process.env.STORAGE_URL || '/api/storage'

  return {
    async upload(
      path: string,
      file: any,
      options?: any
    ): Promise<{ data: { path: string } | null; error: any }> {
      // Server-side upload — write to filesystem directly
      // This will be implemented in Phase 3
      return { data: { path: `${bucket}/${path}` }, error: null }
    },

    getPublicUrl(path: string): { data: { publicUrl: string } } {
      return {
        data: { publicUrl: `${baseUrl}/${bucket}/${path}` },
      }
    },

    async download(path: string): Promise<{ data: Blob | null; error: any }> {
      try {
        const res = await fetch(`${baseUrl}/${bucket}/${path}`)
        if (!res.ok) return { data: null, error: { message: 'Download failed' } }
        const blob = await res.blob()
        return { data: blob, error: null }
      } catch (e: any) {
        return { data: null, error: { message: e.message } }
      }
    },

    async remove(paths: string[]): Promise<{ data: any; error: any }> {
      return { data: null, error: null }
    },

    async list(
      path?: string,
      options?: any
    ): Promise<{ data: any[]; error: any }> {
      return { data: [], error: null }
    },
  }
}

// ── Main DB interface ────────────────────────────────────────────

export const db = {
  from(table: string) {
    return new QueryBuilder(pool).from(table)
  },

  async rpc(fnName: string, args?: Record<string, any>): Promise<DbResponse> {
    return rpcFn(pool, fnName, args)
  },

  auth: authMethods,

  storage: {
    from: storageFrom,
    async listBuckets() {
      return { data: [], error: null }
    },
    async createBucket(name: string, options?: any) {
      return { data: { name }, error: null }
    },
  },
}

// ── Admin DB (same pool, no RLS distinction needed with plain PG) ──

export const dbAdmin = db

// ── Backward compat aliases ──────────────────────────────────────

/** @deprecated Use `db` instead */
export const supabase = db

/** @deprecated Use `dbAdmin` instead */
export const supabaseAdmin = db

/** @deprecated Use `dbAdmin` instead */
export const supabaseService = db

// ── Authenticated client replacement ─────────────────────────────

import type { NextRequest } from 'next/server'

/**
 * Replacement for createAuthenticatedClient.
 * Verifies the Bearer token and returns { user, db }.
 */
export async function createAuthenticatedClient(
  request: NextRequest
): Promise<{ user: AuthUser; db: typeof db } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const { data, error } = await authMethods.getUser(token)
  if (error || !data.user) return null

  return { user: data.user, db }
}

// ── Health check ─────────────────────────────────────────────────

export async function checkSupabaseHealth() {
  try {
    await pool.query('SELECT 1')
    return { available: true, error: null }
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : 'Database connection failed',
    }
  }
}

export async function checkSupabaseServiceHealth() {
  return checkSupabaseHealth()
}
