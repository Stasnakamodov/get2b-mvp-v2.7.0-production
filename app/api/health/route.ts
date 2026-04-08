import { db } from "@/lib/db"
import { NextResponse } from 'next/server'
import { logger } from "@/src/shared/lib/logger";

// Minimal health endpoint for Docker healthcheck and deploy script.
// Returns only binary healthy/unhealthy status without leaking internal state.
// Do NOT add env var names, memory stats, service lists, version info, or
// error details — they are a fingerprinting aid for attackers.
export async function GET() {
  try {
    const startTime = Date.now()
    const { error } = await db.from('projects').select('id').limit(1)

    if (error) {
      logger.error('Health check - Database error:', error)
      return NextResponse.json(
        { status: 'unhealthy' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
    })
  } catch (error) {
    logger.error('Health check error:', error)
    return NextResponse.json(
      { status: 'error' },
      { status: 500 }
    )
  }
}
