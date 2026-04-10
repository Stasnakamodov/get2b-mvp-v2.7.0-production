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
import { writeFile, mkdir, unlink, readdir, stat } from 'fs/promises'
import nodePath from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'

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

// ── Storage (server-side, filesystem) ────────────────────────────

function storageFrom(bucket: string) {
  // Build absolute URL when possible — Telegram Bot API requires absolute https URLs.
  // Order: STORAGE_URL (explicit) → NEXT_PUBLIC_BASE_URL+/api/storage → relative fallback.
  // TelegramService.normalizeUrl provides last-resort safety net for relative URLs.
  const baseUrl = process.env.STORAGE_URL
    || (process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/storage` : '/api/storage')
  const safeBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '')

  return {
    async upload(
      path: string,
      file: any,
      options?: any
    ): Promise<{ data: { path: string } | null; error: any }> {
      try {
        const safePath = path.replace(/\.\./g, '').replace(/^\//, '')
        const fullDir = nodePath.join(UPLOAD_DIR, safeBucket, nodePath.dirname(safePath))
        await mkdir(fullDir, { recursive: true })

        const fullPath = nodePath.join(UPLOAD_DIR, safeBucket, safePath)
        let buffer: Buffer
        if (Buffer.isBuffer(file)) {
          buffer = file
        } else if (file instanceof Uint8Array) {
          buffer = Buffer.from(file)
        } else if (file instanceof ArrayBuffer) {
          buffer = Buffer.from(file)
        } else if (file && typeof file.arrayBuffer === 'function') {
          buffer = Buffer.from(await file.arrayBuffer())
        } else if (typeof file === 'string') {
          buffer = Buffer.from(file)
        } else {
          return { data: null, error: { message: 'Unsupported file type' } }
        }

        await writeFile(fullPath, buffer)
        return { data: { path: `${safeBucket}/${safePath}` }, error: null }
      } catch (e: any) {
        return { data: null, error: { message: e.message } }
      }
    },

    getPublicUrl(path: string): { data: { publicUrl: string } } {
      return {
        data: { publicUrl: `${baseUrl}/${safeBucket}/${path}` },
      }
    },

    async download(path: string): Promise<{ data: Blob | null; error: any }> {
      try {
        const safePath = path.replace(/\.\./g, '').replace(/^\//, '')
        const fullPath = nodePath.join(UPLOAD_DIR, safeBucket, safePath)
        const { readFile } = await import('fs/promises')
        const buffer = await readFile(fullPath)
        return { data: new Blob([new Uint8Array(buffer)]), error: null }
      } catch (e: any) {
        return { data: null, error: { message: e.message } }
      }
    },

    async remove(paths: string[]): Promise<{ data: any; error: any }> {
      try {
        for (const p of paths) {
          const safePath = p.replace(/\.\./g, '').replace(/^\//, '')
          const fullPath = nodePath.join(UPLOAD_DIR, safeBucket, safePath)
          await unlink(fullPath).catch(() => {})
        }
        return { data: null, error: null }
      } catch (e: any) {
        return { data: null, error: { message: e.message } }
      }
    },

    async list(
      path?: string,
      options?: any
    ): Promise<{ data: any[]; error: any }> {
      try {
        const dirPath = nodePath.join(UPLOAD_DIR, safeBucket, path || '')
        const entries = await readdir(dirPath, { withFileTypes: true })
        const items = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = nodePath.join(dirPath, entry.name)
            const info = await stat(fullPath).catch(() => null)
            return {
              name: entry.name,
              id: entry.name,
              metadata: info ? { size: info.size, lastModified: info.mtime.toISOString() } : {},
            }
          })
        )
        return { data: items, error: null }
      } catch (e: any) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
          return { data: [], error: null }
        }
        return { data: [], error: { message: e.message } }
      }
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
