'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Wrench, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CatalogSuggestion {
  id: string
  name: string
  description?: string
  category?: string
  supplier_name?: string
  price?: number
  currency?: string
  unit?: string
}

interface CatalogSuggestAssistantProps {
  title: string
  onApply: (suggestion: CatalogSuggestion) => void
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth-token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

function formatPrice(price?: number, currency?: string): string | null {
  if (!price || price <= 0) return null
  const cur = currency === 'RUB' || !currency ? '₽' : currency
  return `${price.toLocaleString('ru-RU')} ${cur}`
}

export function CatalogSuggestAssistant({ title, onApply }: CatalogSuggestAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<CatalogSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    const trimmed = title.trim()
    if (trimmed.length < 4) {
      setSuggestions([])
      setError(null)
      setLoading(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(null)

      fetch(
        `/api/catalog/products?search=${encodeURIComponent(trimmed)}&limit=5&supplier_type=verified`,
        {
          headers: getAuthHeaders(),
          signal: controller.signal,
        }
      )
        .then((r) => r.json())
        .then((json) => {
          const products = (json?.products || []) as any[]
          setSuggestions(
            products.slice(0, 5).map((p) => ({
              id: String(p.id),
              name: String(p.name || ''),
              description: p.description,
              category: p.category,
              supplier_name: p.supplier_name || p.supplier?.name,
              price: Number(p.price) || undefined,
              currency: p.currency || 'RUB',
              unit: p.unit,
            }))
          )
        })
        .catch((e) => {
          if (e?.name === 'AbortError') return
          setError('Не удалось загрузить подсказки')
        })
        .finally(() => setLoading(false))
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [title])

  if (title.trim().length < 4) return null
  if (!loading && suggestions.length === 0 && !error) return null

  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/60 to-amber-50/40 p-4 dark:border-orange-900/40 dark:from-orange-900/10 dark:to-amber-900/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="text-sm font-medium">
          {loading
            ? 'Ищем похожие товары…'
            : suggestions.length > 0
              ? `Похожее в каталоге Get2B (${suggestions.length})`
              : 'Ничего не нашлось'}
        </div>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!loading && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s) => {
            const priceStr = formatPrice(s.price, s.currency)
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-lg bg-white p-3 dark:bg-gray-900"
              >
                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-900/30">
                  <Wrench className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {priceStr && <span className="font-medium text-foreground">{priceStr}</span>}
                    {s.unit && <span>/ {s.unit}</span>}
                    {s.supplier_name && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {s.supplier_name}
                      </span>
                    )}
                    {s.category && <span>· {s.category}</span>}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onApply(s)}
                >
                  Взять параметры
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
