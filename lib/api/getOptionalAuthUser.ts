import { db } from "@/lib/db"
import { NextRequest } from 'next/server'
// User type removed

/**
 * Extracts user from Bearer token. Returns null for anonymous users.
 * Does NOT block unauthenticated requests — use for optional auth.
 */
export async function getOptionalAuthUser(request: NextRequest): Promise<{ id: string; email: string; name?: string; role?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    const { data: { user }, error } = await db.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}
