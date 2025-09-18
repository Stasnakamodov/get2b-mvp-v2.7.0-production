import { NextRequest, NextResponse } from 'next/server'

// Simple rate limiter в memory (для бета-теста)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limiting: 100 requests per minute per IP
const RATE_LIMIT_MAX_REQUESTS = 100
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  userLimit.count++
  return false
}

export function middleware(request: NextRequest) {
  const ip = (request as any).ip ?? request.headers.get('X-Forwarded-For') ?? request.headers.get('X-Real-IP') ?? 'unknown'

  // Apply rate limiting только на API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const isRateLimited = rateLimit(ip)

    if (isRateLimited) {
      console.warn(`Rate limited IP: ${ip}`)
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '60',
        },
      })
    }
  }

  const response = NextResponse.next()

  // Security headers для всех запросов
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CSP только для development (в production нужно настроить точнее)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' https: data: blob:;"
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}