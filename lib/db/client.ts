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
          return {
            data: { publicUrl: `/api/storage/${bucket}/${path}` },
          }
        },

        async remove(paths: string[]) {
          return { data: null, error: null }
        },

        async list(path?: string, options?: any) {
          return { data: [], error: null }
        },
      }
    },

    async listBuckets() {
      return { data: [], error: null }
    },
  },
}
