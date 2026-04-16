'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/lib/db/client'
import { useAuth } from '@/hooks/useAuth'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import ProfileSelectorModal from '@/app/dashboard/project-constructor/components/modals/ProfileSelectorModal'
import { ModeSelectorCards, type ListingNewMode } from './components/ModeSelectorCards'
import { ManualListingForm } from './components/ManualListingForm'
import { DocumentUploadPanel } from './components/DocumentUploadPanel'

interface ClientProfile {
  id: string
  name: string
  legal_name?: string | null
  is_default?: boolean
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
  const { user, loading: authLoading } = useAuth()
  const { categories } = useCatalogCategories()

  const [profiles, setProfiles] = useState<ClientProfile[] | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const [mode, setMode] = useState<ListingNewMode>('manual')

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
    const flat: { id: string; label: string; name: string }[] = []
    for (const c of categories) {
      flat.push({ id: c.id, label: c.name, name: c.name })
      if (c.children) {
        for (const ch of c.children) {
          flat.push({
            id: ch.id,
            label: `   ${c.name} → ${ch.name}`,
            name: ch.name,
          })
        }
      }
    }
    return flat
  }, [categories])

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

  const defaultExpires = defaultExpiresInput()
  const maxExpires = maxExpiresInput()
  const activeProfile = profiles?.find((p) => p.id === selectedProfileId)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/listings">
          <ArrowLeft className="h-4 w-4 mr-2" /> К каталогу
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/20">
            <Megaphone className="h-5 w-5 text-white" />
          </span>
          Новое объявление
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Опишите, что хотите купить — поставщики свяжутся с вами через ЧатХаб
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="text-sm text-muted-foreground">
          Профиль заказчика:
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setProfileModalOpen(true)}
          disabled={!profiles || profiles.length <= 1}
        >
          {activeProfile ? activeProfile.name : 'Выбрать профиль'}
        </Button>
      </div>

      <ModeSelectorCards mode={mode} onSelect={setMode} />

      {mode === 'document' ? (
        <DocumentUploadPanel
          profileId={selectedProfileId}
          categories={flatCategories}
          defaultExpires={defaultExpires}
          maxExpires={maxExpires}
        />
      ) : (
        <ManualListingForm
          profileId={selectedProfileId}
          categories={flatCategories}
          defaultExpires={defaultExpires}
          maxExpires={maxExpires}
        />
      )}

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
