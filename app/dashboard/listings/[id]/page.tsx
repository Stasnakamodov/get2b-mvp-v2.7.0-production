'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Package,
  Pencil,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/db/client'
import ProfileSelectorModal from '@/app/dashboard/project-constructor/components/modals/ProfileSelectorModal'
import { useAuth } from '@/hooks/useAuth'

interface ListingDetail {
  id: string
  author_id: string
  author_client_profile_id: string | null
  title: string
  description: string
  quantity: string | number
  unit: string
  category_id: string | null
  deadline_date: string | null
  is_urgent: boolean
  status: 'draft' | 'open' | 'closed' | 'expired'
  expires_at: string
  views_count: number
  contacts_count: number
  created_at: string
}

interface AuthorProfile {
  id: string
  name: string
  legal_name?: string | null
  inn?: string | null
}

interface CategoryInfo {
  id: string
  name: string
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('auth-token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null)
  const [category, setCategory] = useState<CategoryInfo | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [supplierProfiles, setSupplierProfiles] = useState<any[] | null>(null)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [contacting, setContacting] = useState(false)

  const [closing, setClosing] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/listings/${id}`, { headers: getAuthHeaders() })
        if (!res.ok) {
          throw new Error('Не удалось загрузить объявление')
        }
        const json = await res.json()
        if (cancelled) return
        setListing(json.listing)
        setAuthorProfile(json.author_profile || null)
        setCategory(json.category || null)
        setIsOwner(json.is_owner)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Ошибка')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function loadSupplierProfiles() {
    if (!user?.id) return
    const { data } = await db
      .from('supplier_profiles')
      .select('id, name, company_name, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    const list = (data as any[]) || []
    setSupplierProfiles(list)
    if (list.length > 0) {
      setSelectedSupplierId(list[0].id)
    }
  }

  async function handleContactClick() {
    if (supplierProfiles === null) {
      await loadSupplierProfiles()
    }
    setSupplierModalOpen(true)
  }

  async function handleApplyContact() {
    if (!selectedSupplierId) return
    setContacting(true)
    try {
      const res = await fetch(`/api/listings/${id}/contact`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ supplier_profile_id: selectedSupplierId }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Не удалось связаться с автором')
      }
      router.push(`/dashboard/ai-chat?room=${json.roomId}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setContacting(false)
      setSupplierModalOpen(false)
    }
  }

  async function handleClose() {
    if (!confirm('Закрыть объявление? Оно пропадёт из публичного каталога.')) return
    setClosing(true)
    try {
      const res = await fetch(`/api/listings/${id}/close`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Ошибка закрытия')
      }
      const json = await res.json()
      setListing((prev) => (prev ? { ...prev, status: json.listing.status } : prev))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard/listings">
            <ArrowLeft className="h-4 w-4 mr-2" /> К каталогу
          </Link>
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error || 'Объявление не найдено'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expiresAt = new Date(listing.expires_at)
  const expiresInDays = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  )

  const canContact = !isOwner && listing.status === 'open' && expiresInDays > 0
  const canEdit = isOwner && (listing.status === 'open' || listing.status === 'draft')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/dashboard/listings">
            <ArrowLeft className="h-4 w-4 mr-2" /> К каталогу
          </Link>
        </Button>
        {isOwner && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/listings/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" /> Редактировать
                </Link>
              </Button>
            )}
            {listing.status === 'open' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={closing}
              >
                <XCircle className="h-4 w-4 mr-2" /> Закрыть
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {listing.is_urgent && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> Срочно
                  </Badge>
                )}
                {listing.status !== 'open' && (
                  <Badge variant="secondary">
                    {listing.status === 'closed' && 'Закрыто'}
                    {listing.status === 'expired' && 'Истекло'}
                    {listing.status === 'draft' && 'Черновик'}
                  </Badge>
                )}
                {category && (
                  <Badge variant="outline">{category.name}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-muted-foreground text-xs">Объём</div>
                <div className="font-semibold">
                  {listing.quantity} {listing.unit}
                </div>
              </div>
            </div>
            {listing.deadline_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-muted-foreground text-xs">Дедлайн</div>
                  <div className="font-semibold">
                    {new Date(listing.deadline_date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-muted-foreground text-xs">Действует ещё</div>
                <div className="font-semibold">
                  {expiresInDays > 0 ? `${expiresInDays} дн.` : 'истекло'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {listing.views_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {listing.contacts_count}
              </span>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Описание</h2>
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {listing.description}
            </p>
          </div>

          {authorProfile && (
            <div className="border-t pt-4">
              <h2 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Заказчик
              </h2>
              <div className="text-sm">
                <div className="font-medium">
                  {authorProfile.legal_name || authorProfile.name}
                </div>
                {authorProfile.inn && (
                  <div className="text-muted-foreground text-xs">
                    ИНН {authorProfile.inn}
                  </div>
                )}
              </div>
            </div>
          )}

          {canContact && (
            <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Свяжитесь с заказчиком напрямую через ЧатХаб — обсудите цену, сроки и доставку.
              </p>
              <Button onClick={handleContactClick} className="gap-2">
                <MessageSquare className="h-4 w-4" /> Связаться
              </Button>
            </div>
          )}

          {!isOwner && !canContact && listing.status !== 'open' && (
            <div className="border-t pt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Объявление больше не активно
            </div>
          )}
        </CardContent>
      </Card>

      {supplierModalOpen && supplierProfiles && supplierProfiles.length === 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm">
              У вас пока нет профиля поставщика. Создайте его, чтобы связаться с заказчиком.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/profile">Создать профиль</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {supplierProfiles && supplierProfiles.length > 0 && (
        <ProfileSelectorModal
          isOpen={supplierModalOpen}
          onClose={() => setSupplierModalOpen(false)}
          profiles={supplierProfiles}
          profileType="supplier"
          selectedProfileId={selectedSupplierId}
          onSelectProfile={setSelectedSupplierId}
          onApplyProfile={handleApplyContact}
          applyLabel={contacting ? 'Создаём чат…' : 'Связаться'}
        />
      )}
    </div>
  )
}
