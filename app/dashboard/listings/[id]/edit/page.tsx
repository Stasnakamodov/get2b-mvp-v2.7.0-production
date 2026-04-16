'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import { LISTING_UNITS } from '@/lib/listings/schemas'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth-token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

function maxExpiresInput(): string {
  return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { categories } = useCatalogCategories()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<string>('шт')
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [deadlineDate, setDeadlineDate] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [expiresDate, setExpiresDate] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/listings/${id}`, {
          headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Не удалось загрузить')
        const json = await res.json()
        if (cancelled) return
        if (!json.is_owner) {
          router.replace(`/dashboard/listings/${id}`)
          return
        }
        const l = json.listing
        setTitle(l.title)
        setDescription(l.description)
        setQuantity(String(l.quantity))
        setUnit(l.unit)
        setCategoryId(l.category_id || undefined)
        setDeadlineDate(l.deadline_date ? l.deadline_date.slice(0, 10) : '')
        setIsUrgent(l.is_urgent)
        setExpiresDate(l.expires_at.slice(0, 10))
      } catch (e: any) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, router])

  const flatCategories = useMemo(() => {
    const flat: { id: string; label: string }[] = []
    for (const c of categories) {
      flat.push({ id: c.id, label: c.name })
      if (c.children) {
        for (const ch of c.children) {
          flat.push({ id: ch.id, label: `   ${c.name} → ${ch.name}` })
        }
      }
    }
    return flat
  }, [categories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const expiresIso = new Date(`${expiresDate}T23:59:59Z`).toISOString()
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          description,
          quantity: Number(quantity),
          unit,
          category_id: categoryId || null,
          deadline_date: deadlineDate || null,
          is_urgent: isUrgent,
          expires_at: expiresIso,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Ошибка сохранения')
      router.push(`/dashboard/listings/${id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Загрузка…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Button asChild variant="ghost">
        <Link href={`/dashboard/listings/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" /> К объявлению
        </Link>
      </Button>

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Pencil className="h-6 w-6 text-orange-500" />
        Редактирование объявления
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Название*</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={10}
                maxLength={150}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Описание*</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minLength={20}
                maxLength={2000}
                rows={6}
                required
              />
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
                  onValueChange={(v) =>
                    setCategoryId(v === '__none' ? undefined : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Без категории</SelectItem>
                    {flatCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Желательный срок</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expires">Активно до*</Label>
                <Input
                  id="expires"
                  type="date"
                  value={expiresDate}
                  onChange={(e) => setExpiresDate(e.target.value)}
                  max={maxExpiresInput()}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="urgent"
                checked={isUrgent}
                onCheckedChange={(v) => setIsUrgent(v === true)}
              />
              <Label htmlFor="urgent" className="cursor-pointer">
                🚨 Срочное
              </Label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </div>
  )
}
