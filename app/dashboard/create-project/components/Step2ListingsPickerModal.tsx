'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  Calendar,
  Check,
  Megaphone,
  Package,
  Search,
  X,
} from 'lucide-react'
import {
  flattenListings,
  useInfiniteListings,
  type ListingItem,
} from '@/hooks/useInfiniteListings'

interface Step2ListingsPickerModalProps {
  open: boolean
  onClose: () => void
  onAddListings: (listings: ListingItem[]) => void
}

const SEARCH_DEBOUNCE_MS = 300

export default function Step2ListingsPickerModal({
  open,
  onClose,
  onAddListings,
}: Step2ListingsPickerModalProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [selected, setSelected] = useState<Map<string, ListingItem>>(new Map())

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    if (!open) {
      setSearchInput('')
      setSearch('')
      setUrgentOnly(false)
      setSelected(new Map())
    }
  }, [open])

  const query = useInfiniteListings({
    excludeOwn: true,
    search: search || undefined,
    urgent: urgentOnly ? true : undefined,
    sort: 'newest',
    enabled: open,
  })

  const listings = useMemo(() => flattenListings(query.data), [query.data])

  function toggle(listing: ListingItem) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(listing.id)) {
        next.delete(listing.id)
      } else {
        next.set(listing.id, listing)
      }
      return next
    })
  }

  function handleConfirm() {
    onAddListings(Array.from(selected.values()))
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-orange-500" />
            Каталог объявлений
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 py-3 border-b flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск по названию или описанию"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant={urgentOnly ? 'default' : 'outline'}
            onClick={() => setUrgentOnly((v) => !v)}
            className="gap-1"
          >
            🚨 Срочные
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {query.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[180px] rounded-lg" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Активных объявлений не найдено
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => {
                const isPicked = selected.has(l.id)
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggle(l)}
                    className="text-left focus:outline-none"
                  >
                    <Card
                      className={`h-full transition-all ${
                        isPicked
                          ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-50/30'
                          : 'border-border hover:border-orange-300'
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-snug line-clamp-2 text-foreground text-sm">
                            {l.title}
                          </h3>
                          {isPicked && (
                            <div className="bg-orange-500 text-white rounded-full p-1 shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        {l.is_urgent && (
                          <Badge variant="destructive" className="self-start gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" /> Срочно
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="pb-2 space-y-1">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {l.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium pt-1">
                          <Package className="h-3 w-3 text-orange-500" />
                          <span>
                            {l.quantity} {l.unit}
                          </span>
                        </div>
                      </CardContent>
                      {l.deadline_date && (
                        <CardFooter className="text-xs text-muted-foreground gap-1 pt-0">
                          <Calendar className="h-3 w-3" />
                          до{' '}
                          {new Date(l.deadline_date).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </CardFooter>
                      )}
                    </Card>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Выбрано: <span className="font-semibold text-foreground">{selected.size}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Добавить ({selected.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
