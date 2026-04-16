'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Megaphone } from 'lucide-react'
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
import { db } from '@/lib/db/client'
import { useAuth } from '@/hooks/useAuth'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import { LISTING_UNITS } from '@/lib/listings/schemas'
import ProfileSelectorModal from '@/app/dashboard/project-constructor/components/modals/ProfileSelectorModal'

interface ClientProfile {
  id: string
  name: string
  legal_name?: string | null
  is_default?: boolean
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth-token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

function defaultExpiresInput(): string {
  const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

function maxExpiresInput(): string {
  const d = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

export default function NewListingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { categories } = useCatalogCategories()

  const [profiles, setProfiles] = useState<ClientProfile[] | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<string>('шт')
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [deadlineDate, setDeadlineDate] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [expiresDate, setExpiresDate] = useState(defaultExpiresInput())

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    async function load() {
      const { data } = await db
        .from('client_profiles')
        .select('id, name, legal_name, is_default')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
      if (cancelled) return
      const list = (data as ClientProfile[]) || []
      setProfiles(list)
      if (list.length === 1) {
        setSelectedProfileId(list[0].id)
      } else if (list.length > 1) {
        setProfileModalOpen(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

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
    if (!selectedProfileId) {
      setError('Выберите профиль клиента')
      setProfileModalOpen(true)
      return
    }
    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setError('Укажите положительное количество')
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
          author_client_profile_id: selectedProfileId,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Ошибка создания')
      }
      router.push(`/dashboard/listings/${json.listing.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return <div className="p-6">Загрузка…</div>
  }

  if (profiles && profiles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard/listings">
            <ArrowLeft className="h-4 w-4 mr-2" /> Назад
          </Link>
        </Button>
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">Нужен профиль клиента</h2>
            <p className="text-muted-foreground text-sm">
              Чтобы публиковать заявки на покупку, создайте профиль клиента — он будет указан как заказчик в объявлении.
            </p>
            <Button asChild>
              <Link href="/dashboard/profile">Создать профиль клиента</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Button asChild variant="ghost">
        <Link href="/dashboard/listings">
          <ArrowLeft className="h-4 w-4 mr-2" /> К каталогу
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-orange-500" />
          Новое объявление
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Опишите, что хотите купить — поставщики свяжутся с вами через ЧатХаб
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Название*</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Клапан PN16 DN50, углеродистая сталь"
                minLength={10}
                maxLength={150}
                required
              />
              <p className="text-xs text-muted-foreground">10–150 символов</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Описание*</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите требования: материал, ГОСТ, сроки, особенности доставки"
                minLength={20}
                maxLength={2000}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">20–2000 символов</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
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
              <div className="space-y-1.5 sm:col-span-1">
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
              <div className="space-y-1.5 sm:col-span-1">
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
                  max={maxExpiresInput()}
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
              <Label htmlFor="urgent" className="cursor-pointer">
                🚨 Срочное объявление
              </Label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setProfileModalOpen(true)}
            disabled={!profiles || profiles.length <= 1}
          >
            {selectedProfileId
              ? `Профиль: ${profiles?.find((p) => p.id === selectedProfileId)?.name}`
              : 'Выбрать профиль'}
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            <Megaphone className="h-4 w-4" />
            {submitting ? 'Публикация…' : 'Опубликовать'}
          </Button>
        </div>
      </form>

      {profiles && profiles.length > 1 && (
        <ProfileSelectorModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          profiles={profiles}
          profileType="client"
          selectedProfileId={selectedProfileId}
          onSelectProfile={setSelectedProfileId}
          onApplyProfile={async () => setProfileModalOpen(false)}
          applyLabel="Использовать профиль"
        />
      )}
    </div>
  )
}
