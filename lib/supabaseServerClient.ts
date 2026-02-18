import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Creates a Supabase client authenticated with the user's JWT token.
 * This ensures auth.uid() returns the correct user ID for RLS policies.
 *
 * Returns { user, supabase } or null if the request is not authenticated.
 */
export async function createAuthenticatedClient(
  request: NextRequest
): Promise<{ user: { id: string; email?: string }; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  // Create a per-request Supabase client with the user's JWT.
  // PostgREST uses this token to evaluate auth.uid() in RLS policies.
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Validate the token and get the user
  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) {
    return null
  }

  return { user, supabase: userClient }
}
