'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Megaphone, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LISTING_UNITS } from '@/lib/listings/schemas'
import { CatalogSuggestAssistant, type CatalogSuggestion } from './CatalogSuggestAssistant'

interface ManualListingFormProps {
  profileId: string | null
  categories: { id: string; label: string; name?: string }[]
  defaultExpires: string
  maxExpires: string
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth-token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export function ManualListingForm({
  profileId,
  categories,
  defaultExpires,
  maxExpires,
}: ManualListingFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<string>('шт')
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [deadlineDate, setDeadlineDate] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [expiresDate, setExpiresDate] = useState(defaultExpires)

  const [categorySuggestion, setCategorySuggestion] = useState<
    { id: string; name: string; confidence: number } | null
  >(null)
  const [classifying, setClassifying] = useState(false)
  const lastClassifiedRef = useRef<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function classify() {
    const payloadKey = `${title}||${description}`
    if (payloadKey === lastClassifiedRef.current) return
    if (title.length < 10 || description.length < 20) return
    lastClassifiedRef.current = payloadKey
    setClassifying(true)
    try {
      const res = await fetch('/api/listings/classify-category', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, description }),
      })
      const json = await res.json()
      if (json.success && json.category_id) {
        setCategorySuggestion({
          id: json.category_id,
          name: json.category_name,
          confidence: json.confidence || 0,
        })
        if (!categoryId && json.confidence >= 0.7) {
          setCategoryId(json.category_id)
        }
      } else {
        setCategorySuggestion(null)
      }
    } catch {
      setCategorySuggestion(null)
    } finally {
      setClassifying(false)
    }
  }

  useEffect(() => {
    if (title.length < 10 || description.length < 20) {
      setCategorySuggestion(null)
      lastClassifiedRef.current = ''
    }
  }, [title, description])

  function applyFromCatalog(s: CatalogSuggestion) {
    if (!title || title.length < 10) {
      setTitle(s.name.slice(0, 150))
    }
    if (!description || description.length < 20) {
      const parts = [s.description?.trim(), s.category ? `Категория: ${s.category}` : '']
        .filter(Boolean)
        .join(' · ')
      if (parts.length >= 20) setDescription(parts.slice(0, 2000))
    }
    if (s.unit && (LISTING_UNITS as readonly string[]).includes(s.unit)) {
      setUnit(s.unit)
    }
    if (s.category) {
      const match = categories.find(
        (c) => c.name?.toLowerCase() === s.category!.toLowerCase()
      )
      if (match) setCategoryId(match.id)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!profileId) {
      setError('Выберите профиль клиента наверху формы.')
      return
    }
    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setError('Укажите положительное количество.')
      return
    }
    setSubmitting(true)
    try {
      const expiresIso = new Date(`${expiresDate}T23:59:59Z`).toISOString()
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          description,
          quantity: qty,
          unit,
          category_id: categoryId || null,
          deadline_date: deadlineDate || null,
          is_urgent: isUrgent,
          expires_at: expiresIso,
          author_client_profile_id: profileId,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Ошибка создания')
      router.push(`/dashboard/listings/${json.listing.id}`)
    } catch (e: any) {
      setError(e?.message || 'Неизвестная ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-1.5">
          <Label htmlFor="title">Название*</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => classify()}
            placeholder="Клапан PN16 DN50, углеродистая сталь"
            minLength={10}
            maxLength={150}
            required
          />
          <p className="text-xs text-muted-foreground">10–150 символов</p>
        </div>

        <CatalogSuggestAssistant title={title} onApply={applyFromCatalog} />

        <div className="space-y-1.5">
          <Label htmlFor="description">Описание*</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => classify()}
            placeholder="Опишите требования: материал, ГОСТ, сроки, особенности доставки"
            minLength={20}
            maxLength={2000}
            rows={6}
            required
          />
          <p className="text-xs text-muted-foreground">20–2000 символов</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Количество*</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ед. измерения*</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LISTING_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Категория</Label>
            <Select
              value={categoryId ?? '__none'}
              onValueChange={(v) => setCategoryId(v === '__none' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Без категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Без категории</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(classifying || categorySuggestion) && (
          <div className="flex items-center gap-2 text-xs">
            {classifying ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> GPT подбирает категорию…
              </span>
            ) : categorySuggestion ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                <Sparkles className="h-3 w-3" />
                GPT: {categorySuggestion.name} ({Math.round(categorySuggestion.confidence * 100)}%)
                {categoryId !== categorySuggestion.id && (
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => setCategoryId(categorySuggestion.id)}
                  >
                    применить
                  </button>
                )}
              </span>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Желательный срок (дедлайн)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expires">Активно до*</Label>
            <Input
              id="expires"
              type="date"
              value={expiresDate}
              onChange={(e) => setExpiresDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              max={maxExpires}
              required
            />
            <p className="text-xs text-muted-foreground">
              Максимум 60 дней с сегодняшнего дня
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="urgent"
            checked={isUrgent}
            onCheckedChange={(v) => setIsUrgent(v === true)}
          />
          <Label htmlFor="urgent" className="cursor-pointer inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" /> Срочное объявление
          </Label>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={submitting} className="gap-2">
          <Megaphone className="h-4 w-4" />
          {submitting ? 'Публикация…' : 'Опубликовать'}
        </Button>
      </div>
    </form>
  )
}
