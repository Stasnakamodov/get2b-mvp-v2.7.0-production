'use client'

import Link from 'next/link'
import { AlertCircle, Calendar, Eye, MessageSquare, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { ListingItem } from '@/hooks/useInfiniteListings'

interface ListingCardProps {
  listing: ListingItem
  badgeStatus?: boolean
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days < 1) return 'сегодня'
  if (days < 2) return 'вчера'
  if (days < 7) return `${days} дн. назад`
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`
  return `${Math.floor(days / 30)} мес. назад`
}

function formatDeadline(date: string | null): string | null {
  if (!date) return null
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

const STATUS_LABEL: Record<ListingItem['status'], string> = {
  draft: 'Черновик',
  open: 'Активно',
  closed: 'Закрыто',
  expired: 'Истекло',
}

const STATUS_VARIANT: Record<ListingItem['status'], 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  open: 'default',
  closed: 'secondary',
  expired: 'outline',
}

export function ListingCard({ listing, badgeStatus = false }: ListingCardProps) {
  const deadline = formatDeadline(listing.deadline_date)

  return (
    <Link
      href={`/dashboard/listings/${listing.id}`}
      className="group block focus:outline-none"
    >
      <Card className="h-full transition-all border-border/60 hover:border-orange-300 hover:shadow-md group-focus-visible:border-orange-400">
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug line-clamp-2 text-foreground">
              {listing.title}
            </h3>
            {listing.is_urgent && (
              <Badge variant="destructive" className="shrink-0 gap-1">
                <AlertCircle className="h-3 w-3" /> Срочно
              </Badge>
            )}
          </div>
          {badgeStatus && (
            <Badge variant={STATUS_VARIANT[listing.status]} className="self-start">
              {STATUS_LABEL[listing.status]}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="pb-3 space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Package className="h-4 w-4 text-orange-500" />
            <span>
              {listing.quantity} {listing.unit}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-3">
            <span>{formatRelativeDate(listing.created_at)}</span>
            {deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> до {deadline}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {listing.views_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {listing.contacts_count}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
