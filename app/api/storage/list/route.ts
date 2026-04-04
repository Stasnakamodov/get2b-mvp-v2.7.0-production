import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { readdir, stat } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.substring(7)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { bucket, path: dirPath, search } = await request.json()
    if (!bucket) {
      return NextResponse.json({ error: 'bucket is required' }, { status: 400 })
    }

    const safeBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '')
    const safePath = (dirPath || '').replace(/\.\./g, '').replace(/^\//, '')
    const fullDir = path.join(UPLOAD_DIR, safeBucket, safePath)

    try {
      const entries = await readdir(fullDir, { withFileTypes: true })
      let items = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(fullDir, entry.name)
          const info = await stat(fullPath).catch(() => null)
          return {
            name: entry.name,
            id: entry.name,
            metadata: info
              ? { size: info.size, lastModified: info.mtime.toISOString() }
              : {},
          }
        })
      )

      if (search) {
        items = items.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        )
      }

      return NextResponse.json({ data: items, error: null })
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return NextResponse.json({ data: [], error: null })
      }
      throw e
    }
  } catch (e: any) {
    return NextResponse.json(
      { data: [], error: { message: e.message } },
      { status: 500 }
    )
  }
}
