import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

/**
 * Extracts user from Bearer token. Returns null for anonymous users.
 * Does NOT block unauthenticated requests — use for optional auth.
 */
export async function getOptionalAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}
