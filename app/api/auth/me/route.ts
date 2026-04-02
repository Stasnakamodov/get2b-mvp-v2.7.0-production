import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Try Bearer token first, then cookie
  const authHeader = request.headers.get('authorization')
  let token: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    token = request.cookies.get('auth-token')?.value || null
  }

  if (!token) {
    return NextResponse.json(
      { data: { user: null }, error: { message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { data: { user: null }, error: { message: 'Invalid token' } },
      { status: 401 }
    )
  }

  return NextResponse.json({
    data: {
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    },
    error: null,
  })
}
