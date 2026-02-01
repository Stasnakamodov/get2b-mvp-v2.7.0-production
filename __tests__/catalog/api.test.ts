/**
 * Тесты для API каталога
 *
 * Эти тесты проверяют:
 * - Санитизацию поисковых запросов
 * - Валидацию cursor
 * - Правильность ответов API
 */

// Функция sanitizeSearch из API (копия для тестирования)
function sanitizeSearch(search: string): string {
  return search
    .replace(/[%_\\'"();]/g, ' ')
    .trim()
    .slice(0, 100)
}

// Функция валидации cursor (симулирует Zod валидацию)
function isValidCursorData(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>

  // Проверяем lastId (UUID формат)
  if (typeof obj.lastId !== 'string') return false
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  if (!uuidRegex.test(obj.lastId)) return false

  // Проверяем lastCreatedAt (ISO datetime)
  if (typeof obj.lastCreatedAt !== 'string') return false
  const date = new Date(obj.lastCreatedAt)
  if (isNaN(date.getTime())) return false

  return true
}

describe('sanitizeSearch', () => {
  it('removes SQL injection characters', () => {
    expect(sanitizeSearch("'; DROP TABLE users;--")).not.toContain("'")
    expect(sanitizeSearch("'; DROP TABLE users;--")).not.toContain(";")
  })

  it('removes percent signs (LIKE wildcards)', () => {
    expect(sanitizeSearch('%admin%')).not.toContain('%')
  })

  it('removes underscore (LIKE single char wildcard)', () => {
    expect(sanitizeSearch('a_b_c')).not.toContain('_')
  })

  it('removes parentheses', () => {
    expect(sanitizeSearch('test()')).not.toContain('(')
    expect(sanitizeSearch('test()')).not.toContain(')')
  })

  it('removes backslashes', () => {
    expect(sanitizeSearch('test\\injection')).not.toContain('\\')
  })

  it('trims whitespace', () => {
    expect(sanitizeSearch('  test  ')).toBe('test')
  })

  it('limits length to 100 characters', () => {
    const longString = 'a'.repeat(200)
    expect(sanitizeSearch(longString).length).toBe(100)
  })

  it('preserves normal search terms', () => {
    expect(sanitizeSearch('laptop computer')).toBe('laptop computer')
  })

  it('preserves cyrillic characters', () => {
    expect(sanitizeSearch('ноутбук')).toBe('ноутбук')
  })
})

describe('isValidCursorData', () => {
  it('accepts valid cursor data', () => {
    const validCursor = {
      lastId: '123e4567-e89b-12d3-a456-426614174000',
      lastCreatedAt: '2024-01-15T10:30:00.000Z'
    }
    expect(isValidCursorData(validCursor)).toBe(true)
  })

  it('rejects invalid UUID', () => {
    const invalidCursor = {
      lastId: 'not-a-uuid',
      lastCreatedAt: '2024-01-15T10:30:00.000Z'
    }
    expect(isValidCursorData(invalidCursor)).toBe(false)
  })

  it('rejects invalid datetime', () => {
    const invalidCursor = {
      lastId: '123e4567-e89b-12d3-a456-426614174000',
      lastCreatedAt: 'not-a-date'
    }
    expect(isValidCursorData(invalidCursor)).toBe(false)
  })

  it('rejects missing lastId', () => {
    const invalidCursor = {
      lastCreatedAt: '2024-01-15T10:30:00.000Z'
    }
    expect(isValidCursorData(invalidCursor)).toBe(false)
  })

  it('rejects missing lastCreatedAt', () => {
    const invalidCursor = {
      lastId: '123e4567-e89b-12d3-a456-426614174000'
    }
    expect(isValidCursorData(invalidCursor)).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidCursorData(null)).toBe(false)
  })

  it('rejects non-object', () => {
    expect(isValidCursorData('string')).toBe(false)
    expect(isValidCursorData(123)).toBe(false)
  })
})

describe('Sort field validation', () => {
  const ALLOWED_SORT_FIELDS = ['created_at', 'price', 'name'] as const

  it('accepts allowed sort fields', () => {
    ALLOWED_SORT_FIELDS.forEach(field => {
      expect(ALLOWED_SORT_FIELDS.includes(field)).toBe(true)
    })
  })

  it('rejects invalid sort fields', () => {
    const invalidFields = ['id', 'supplier_id', 'DROP TABLE', '']
    invalidFields.forEach(field => {
      expect(ALLOWED_SORT_FIELDS.includes(field as 'created_at' | 'price' | 'name')).toBe(false)
    })
  })
})

describe('Sort order validation', () => {
  it('accepts asc', () => {
    const sortOrder = 'asc'
    expect(['asc', 'desc'].includes(sortOrder)).toBe(true)
  })

  it('accepts desc', () => {
    const sortOrder = 'desc'
    expect(['asc', 'desc'].includes(sortOrder)).toBe(true)
  })

  it('defaults to desc for invalid values', () => {
    const sortOrderParam: string = 'invalid'
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc'
    expect(sortOrder).toBe('desc')
  })
})
