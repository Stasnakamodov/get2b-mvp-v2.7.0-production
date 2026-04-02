import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = request.headers.get('authorization')?.substring(7)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string
    const filePath = formData.get('path') as string

    if (!file || !bucket || !filePath) {
      return NextResponse.json(
        { error: 'file, bucket, and path are required' },
        { status: 400 }
      )
    }

    // Sanitize path to prevent directory traversal
    const safeBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '')
    const safePath = filePath.replace(/\.\./g, '').replace(/^\//, '')

    const fullDir = path.join(UPLOAD_DIR, safeBucket, path.dirname(safePath))
    await mkdir(fullDir, { recursive: true })

    const fullPath = path.join(UPLOAD_DIR, safeBucket, safePath)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(fullPath, buffer)

    return NextResponse.json({
      data: {
        path: `${safeBucket}/${safePath}`,
        fullPath: `/api/storage/${safeBucket}/${safePath}`,
      },
      error: null,
    })
  } catch (e: any) {
    console.error('[Storage] Upload error:', e)
    return NextResponse.json(
      { data: null, error: { message: e.message } },
      { status: 500 }
    )
  }
}
