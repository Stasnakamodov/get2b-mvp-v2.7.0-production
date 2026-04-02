import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params
    const filePath = segments.join('/')

    // Prevent directory traversal
    if (filePath.includes('..')) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const fullPath = path.join(UPLOAD_DIR, filePath)

    try {
      await stat(fullPath)
    } catch {
      return new NextResponse('Not Found', { status: 404 })
    }

    const buffer = await readFile(fullPath)
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (e: any) {
    console.error('[Storage] Serve error:', e)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
