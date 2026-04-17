'use client'

import { useState } from 'react'
import { Trash2, Sparkles, Loader2, AlertCircle, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LISTING_UNITS } from '@/lib/listings/schemas'
import { PositionImageUploader } from './PositionImageUploader'
import { CatalogImageSearchDialog } from './CatalogImageSearchDialog'

export interface PositionRow {
  localId: string
  selected: boolean
  title: string
  description: string
  quantity: string
  unit: string
  category_id?: string
  image_url?: string | null
  category_suggestion?: { id: string; name: string; confidence: number } | null
  classifying?: boolean
  serverErrors?: Record<string, string[]>
}

interface PositionsTableProps {
  rows: PositionRow[]
  onChange: (rows: PositionRow[]) => void
  onRemove: (localId: string) => void
  categories: { id: string; label: string }[]
  onRequestClassify?: (localId: string) => void
}

const FIELDS_THAT_CLEAR_ERRORS = new Set<keyof PositionRow>([
  'title',
  'description',
  'quantity',
  'unit',
  'category_id',
  'image_url',
])

const FIELD_LABELS: Record<string, string> = {
  title: 'Название',
  description: 'Описание',
  quantity: 'Количество',
  unit: 'Единица',
  category_id: 'Категория',
}

export function PositionsTable({
  rows,
  onChange,
  onRemove,
  categories,
  onRequestClassify,
}: PositionsTableProps) {
  const [searchDialogFor, setSearchDialogFor] = useState<string | null>(null)

  const update = (localId: string, patch: Partial<PositionRow>) => {
    const shouldClearErrors = Object.keys(patch).some((k) =>
      FIELDS_THAT_CLEAR_ERRORS.has(k as keyof PositionRow)
    )
    onChange(
      rows.map((r) =>
        r.localId === localId
          ? { ...r, ...patch, ...(shouldClearErrors ? { serverErrors: undefined } : {}) }
          : r
      )
    )
  }

  return (
    <div className="space-y-3">
      <CatalogImageSearchDialog
        open={searchDialogFor !== null}
        onClose={() => setSearchDialogFor(null)}
        onApply={(payload) => {
          if (!searchDialogFor) return
          const patch: Partial<PositionRow> = {
            title: payload.title.length >= 10 ? payload.title : payload.title,
            image_url: payload.image_url,
          }
          if (payload.description.length >= 20) {
            patch.description = payload.description
          }
          update(searchDialogFor, patch)
          setSearchDialogFor(null)
        }}
      />
      {rows.map((r, idx) => {
        const titleInvalid = r.title.length > 0 && r.title.length < 10
        const descInvalid = r.description.length > 0 && r.description.length < 20
        const qtyInvalid = r.quantity !== '' && !(Number(r.quantity) > 0)
        const hasServerErrors =
          r.serverErrors && Object.keys(r.serverErrors).length > 0
        const borderClass = hasServerErrors
          ? 'border-destructive bg-destructive/5'
          : r.selected
          ? 'border-orange-200 bg-orange-50/30 dark:border-orange-900/40 dark:bg-orange-900/10'
          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
        return (
          <div
            key={r.localId}
            className={`rounded-xl border p-4 space-y-3 transition-colors ${borderClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="pt-2">
                <Checkbox
                  checked={r.selected}
                  onCheckedChange={(v) => update(r.localId, { selected: v === true })}
                />
              </div>
              <PositionImageUploader
                imageUrl={r.image_url ?? null}
                onChange={(url) => update(r.localId, { image_url: url })}
                compact
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Позиция {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchDialogFor(r.localId)}
                      className="text-xs text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      <Camera className="h-3.5 w-3.5" /> Найти в каталоге
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(r.localId)}
                      className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Удалить
                    </button>
                  </div>
                </div>
                <div>
                  <Input
                    value={r.title}
                    onChange={(e) => update(r.localId, { title: e.target.value })}
                    placeholder="Название товара (10–150 символов)"
                    className={
                      r.serverErrors?.title
                        ? 'border-destructive'
                        : titleInvalid
                        ? 'border-amber-400'
                        : ''
                    }
                  />
                  {titleInvalid && !r.serverErrors?.title && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      нужно минимум 10 символов
                    </p>
                  )}
                </div>
                <Textarea
                  value={r.description}
                  onChange={(e) => update(r.localId, { description: e.target.value })}
                  placeholder="Описание (материал/ГОСТ/требования). Минимум 20 символов."
                  rows={2}
                  className={
                    r.serverErrors?.description
                      ? 'border-destructive'
                      : descInvalid
                      ? 'border-amber-400'
                      : ''
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    type="number"
                    step="any"
                    min="0.001"
                    value={r.quantity}
                    onChange={(e) => update(r.localId, { quantity: e.target.value })}
                    placeholder="Кол-во"
                    className={
                      r.serverErrors?.quantity
                        ? 'border-destructive'
                        : qtyInvalid
                        ? 'border-amber-400'
                        : ''
                    }
                  />
                  <Select
                    value={r.unit}
                    onValueChange={(v) => update(r.localId, { unit: v })}
                  >
                    <SelectTrigger
                      className={r.serverErrors?.unit ? 'border-destructive' : ''}
                    >
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
                  <Select
                    value={r.category_id ?? '__none'}
                    onValueChange={(v) =>
                      update(r.localId, {
                        category_id: v === '__none' ? undefined : v,
                      })
                    }
                  >
                    <SelectTrigger
                      className={r.serverErrors?.category_id ? 'border-destructive' : ''}
                    >
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
                {hasServerErrors && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      {Object.entries(r.serverErrors!).map(([field, messages]) => (
                        <div key={field}>
                          <span className="font-medium">
                            {FIELD_LABELS[field] ?? field}:
                          </span>{' '}
                          {messages.join(', ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(r.category_suggestion || r.classifying) && (
                  <div className="flex items-center gap-2 text-xs">
                    {r.classifying ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> GPT подбирает категорию…
                      </span>
                    ) : r.category_suggestion ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        <Sparkles className="h-3 w-3" /> GPT: {r.category_suggestion.name}{' '}
                        ({Math.round(r.category_suggestion.confidence * 100)}%)
                        {r.category_id !== r.category_suggestion.id && (
                          <button
                            type="button"
                            className="underline underline-offset-2"
                            onClick={() =>
                              update(r.localId, { category_id: r.category_suggestion!.id })
                            }
                          >
                            применить
                          </button>
                        )}
                      </span>
                    ) : null}
                    {!r.classifying && onRequestClassify && (
                      <button
                        type="button"
                        onClick={() => onRequestClassify(r.localId)}
                        className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        обновить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
