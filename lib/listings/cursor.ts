import { z } from 'zod'

const CursorDataSchema = z.object({
  lastId: z.string().uuid(),
  lastCreatedAt: z.string(),
})

export type ListingCursor = z.infer<typeof CursorDataSchema>

export function encodeCursor(data: ListingCursor): string {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

export function decodeCursor(cursor: string): ListingCursor | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
    const result = CursorDataSchema.safeParse(decoded)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/**
 * Keyset filter for "ORDER BY created_at DESC, id DESC".
 * Returns a PostgREST-compatible .or(...) string compatible with the local
 * queryBuilder's .or() implementation.
 */
export function buildCursorFilter(cursor: ListingCursor): string {
  const { lastId, lastCreatedAt } = cursor
  return `created_at.lt.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.lt.${lastId})`
}
