'use client'

/**
 * Client-side db interface.
 * Same API as server-side `db`, but routes through /api/db/query.
 *
 * Usage in 'use client' components:
 *   import { db } from '@/lib/db/client'
 *   const { data, error } = await db.from('table').select('*')
 */

import { ClientQueryBuilder, clientRpc } from './clientQueryBuilder'
import { authClient } from '../auth/client'

export const db = {
  from(table: string) {
    return new ClientQueryBuilder().from(table)
  },

  async rpc(fnName: string, args?: Record<string, any>) {
    return clientRpc(fnName, args)
  },

  auth: authClient,

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File, options?: any) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('bucket', bucket)
          formData.append('path', path)

          const token = authClient.getToken()
          const headers: Record<string, string> = {}
          if (token) headers['Authorization'] = `Bearer ${token}`

          try {
            const res = await fetch('/api/storage/upload', {
              method: 'POST',
              headers,
              body: formData,
            })
            const json = await res.json()
            if (!res.ok) return { data: null, error: json.error || { message: 'Upload failed' } }
            return { data: json.data, error: null }
          } catch (e: any) {
            return { data: null, error: { message: e.message } }
          }
        },

        getPublicUrl(path: string) {
          // Use window.location.origin to build absolute URL.
          // Telegram Bot API requires absolute https URLs to fetch images.
          // SSR fallback: returns relative path (TelegramService normalizes it).
          const origin = typeof window !== 'undefined' ? window.location.origin : ''
          return {
            data: { publicUrl: `${origin}/api/storage/${bucket}/${path}` },
          }
        },

        async remove(paths: string[]) {
          const token = authClient.getToken()
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`
          try {
            const res = await fetch('/api/storage/remove', {
              method: 'POST',
              headers,
              body: JSON.stringify({ bucket, paths }),
            })
            return await res.json()
          } catch (e: any) {
            return { data: null, error: { message: e.message } }
          }
        },

        async list(path?: string, options?: any) {
          const token = authClient.getToken()
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`
          try {
            const res = await fetch('/api/storage/list', {
              method: 'POST',
              headers,
              body: JSON.stringify({ bucket, path, search: options?.search }),
            })
            return await res.json()
          } catch (e: any) {
            return { data: [], error: { message: e.message } }
          }
        },
      }
    },

    async listBuckets() {
      return { data: [], error: null }
    },
  },
}
