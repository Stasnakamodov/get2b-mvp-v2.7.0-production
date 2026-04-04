import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { unlink } from 'fs/promises'
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

    const { bucket, paths } = await request.json()
    if (!bucket || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'bucket and paths[] are required' },
        { status: 400 }
      )
    }

    const safeBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '')
    for (const p of paths) {
      const safePath = p.replace(/\.\./g, '').replace(/^\//, '')
      const fullPath = path.join(UPLOAD_DIR, safeBucket, safePath)
      await unlink(fullPath).catch(() => {})
    }

    return NextResponse.json({ data: null, error: null })
  } catch (e: any) {
    return NextResponse.json(
      { data: null, error: { message: e.message } },
      { status: 500 }
    )
  }
}
