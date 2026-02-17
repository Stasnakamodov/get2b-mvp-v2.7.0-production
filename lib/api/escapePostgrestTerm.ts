/**
 * Escapes ALL PostgREST special characters from a search term.
 * Prevents injection via .or() filters.
 */
export function escapePostgrestTerm(term: string): string {
  return term
    .replace(/[%_\\'"();,.\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

/**
 * Builds a safe PostgREST .or() filter string from search terms.
 * Returns empty string if no valid terms remain after escaping.
 */
export function buildOrFilter(terms: string[], columns = ['name', 'description']): string {
  const escaped = terms.map(escapePostgrestTerm).filter(t => t.length >= 2)
  if (!escaped.length) return ''
  return escaped
    .flatMap(term => columns.map(col => `${col}.ilike.%${term}%`))
    .join(',')
}
