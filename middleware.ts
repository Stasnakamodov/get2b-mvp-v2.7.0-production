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
  // CVE-2025-29927 defense in depth: block middleware bypass header.
  // Next.js 15.2.3+ already fixes this, and nginx strips the header,
  // but keep this as a belt-and-suspenders check in case of version downgrade
  // or a similar class of bug in the future.
  if (request.headers.get('x-middleware-subrequest')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = (request as any).ip ?? request.headers.get('X-Forwarded-For') ?? request.headers.get('X-Real-IP') ?? 'unknown'

  // Apply rate limiting только на API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const isRateLimited = rateLimit(ip)

    if (isRateLimited) {
      console.warn(`Rate limited IP: ${ip}`)
      return NextResponse.json(
        { error: 'Too Many Requests', retryAfter: 60 },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      )
    }
  }

  const response = NextResponse.next()

  // PDF из public/ должен встраиваться в same-origin iframe (например, презентация на /login).
  // Глобальный DENY/frame-ancestors 'none' ниже ломает это, поэтому для .pdf отдаём SAMEORIGIN.
  if (/\.pdf$/i.test(request.nextUrl.pathname)) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; frame-ancestors 'self'"
    )
    return response
  }

  // Security headers для всех запросов
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://bothub.chat https://api.telegram.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

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