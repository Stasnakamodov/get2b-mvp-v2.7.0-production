// DEPRECATED: Use @/lib/db/client instead
import { db } from './db/client'
export { db as supabase }
export const checkSupabaseHealth = async () => ({ available: true, error: null })
