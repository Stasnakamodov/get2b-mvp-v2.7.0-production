'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { db } from '@/lib/db/client'
import { fetchWithTimeout, FetchTimeoutError } from '@/src/shared/lib/fetchWithTimeout'
import type { BatchInvalidItem } from '@/lib/listings/schemas'
import { PositionsTable, type PositionRow } from './PositionsTable'

interface DocumentUploadPanelProps {
  profileId: string | null
  categories: { id: string; label: string }[]
  defaultExpires: string
  maxExpires: string
}

type UploadPhase =
  | { kind: 'idle' }
  | { kind: 'uploading'; startedAt: number }
  | { kind: 'analyzing'; startedAt: number }
  | { kind: 'error'; message: string }
  | { kind: 'done' }

const OCR_TIMEOUT_MS = 120_000

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json', ...(extra || {}) }
  const token = localStorage.getItem('auth-token')
  return {
    'Content-Type': 'application/json',
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function makeLocalId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function cleanFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').substring(0, 50)
}

export function DocumentUploadPanel({
  profileId,
  categories,
  defaultExpires,
  maxExpires,
}: DocumentUploadPanelProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [phase, setPhase] = useState<UploadPhase>({ kind: 'idle' })
  const [elapsedSec, setElapsedSec] = useState(0)
  const [positions, setPositions] = useState<PositionRow[]>([])

  const [deadlineDate, setDeadlineDate] = useState('')
  const [expiresDate, setExpiresDate] = useState(defaultExpires)
  const [isUrgent, setIsUrgent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [invalidBanner, setInvalidBanner] = useState<string | null>(null)

  const selectedCount = positions.filter((p) => p.selected).length

  const isActive = phase.kind === 'uploading' || phase.kind === 'analyzing'

  useEffect(() => {
    if (!isActive) {
      setElapsedSec(0)
      return
    }
    const startedAt =
      phase.kind === 'uploading' || phase.kind === 'analyzing' ? phase.startedAt : Date.now()
    setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [isActive, phase])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  async function handleFile(file: File) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setFileName(file.name)
    setPositions([])
    setSubmitError(null)
    setInvalidBanner(null)
    setPhase({ kind: 'uploading', startedAt: Date.now() })

    try {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const timestamp = Date.now()
      const pathKey = `listings/ocr/${date}_${timestamp}_${cleanFileName(file.name)}`

      const { data: uploadData, error: uploadErr } = await db.storage
        .from('project-files')
        .upload(pathKey, file)
      if (uploadErr) {
        throw new Error(uploadErr.message || 'Ошибка загрузки файла')
      }
      if (controller.signal.aborted) return

      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const fileUrl = uploadData?.fullPath
        ? `${origin}${uploadData.fullPath}`
        : `${origin}/api/storage/${uploadData?.path || pathKey}`

      setPhase({ kind: 'analyzing', startedAt: Date.now() })

      const ocrRes = await fetchWithTimeout(
        '/api/document-analysis',
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            fileUrl,
            fileType: file.type || 'application/octet-stream',
            documentType: 'invoice',
          }),
          signal: controller.signal,
        },
        OCR_TIMEOUT_MS
      )
      const ocrJson = await ocrRes.json()
      if (controller.signal.aborted) return

      if (!ocrRes.ok || !ocrJson.success) {
        throw new Error(ocrJson.error || 'OCR не справился с документом')
      }
      if (ocrJson.llmUnavailable) {
        setPhase({
          kind: 'error',
          message: 'AI-парсер временно недоступен. Попробуйте позже или заполните вручную.',
        })
        return
      }
      const items = ocrJson.suggestions?.items || []
      if (items.length === 0) {
        setPhase({
          kind: 'error',
          message: 'В документе не нашлось позиций. Проверьте файл или заполните вручную.',
        })
        return
      }
      const rows: PositionRow[] = items.map((it: any) => {
        const baseTitle = String(it.name || 'Товар').trim()
        const qty = Number(it.quantity)
        return {
          localId: makeLocalId(),
          selected: true,
          title: baseTitle.length >= 10 ? baseTitle : `${baseTitle} (уточните)`,
          description: [
            it.code ? `Артикул: ${it.code}` : '',
            it.description ? String(it.description).trim() : '',
            'Уточните требования перед публикацией.',
          ]
            .filter(Boolean)
            .join(' · '),
          quantity: qty > 0 ? String(qty) : '1',
          unit: it.unit && typeof it.unit === 'string' ? it.unit : 'шт',
          category_id: undefined,
          category_suggestion: null,
          classifying: false,
        }
      })
      setPositions(rows)
      setPhase({ kind: 'done' })
    } catch (e: any) {
      if (controller.signal.aborted && !(e instanceof FetchTimeoutError)) {
        return
      }
      if (e instanceof FetchTimeoutError) {
        setPhase({
          kind: 'error',
          message:
            'Распознавание заняло больше 2 минут. Файл слишком большой или сервер перегружен — попробуйте разбить документ.',
        })
        return
      }
      setPhase({ kind: 'error', message: e?.message || 'Неизвестная ошибка' })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
    }
  }

  async function classifyOne(localId: string) {
    const row = positions.find((p) => p.localId === localId)
    if (!row) return
    setPositions((prev) =>
      prev.map((p) =>
        p.localId === localId ? { ...p, classifying: true } : p
      )
    )
    try {
      const res = await fetch('/api/listings/classify-category', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: row.title,
          description: row.description,
        }),
      })
      const json = await res.json()
      if (json.success && json.category_id) {
        setPositions((prev) =>
          prev.map((p) =>
            p.localId === localId
              ? {
                  ...p,
                  classifying: false,
                  category_suggestion: {
                    id: json.category_id,
                    name: json.category_name,
                    confidence: json.confidence || 0,
                  },
                  category_id:
                    !p.category_id && json.confidence >= 0.7 ? json.category_id : p.category_id,
                }
              : p
          )
        )
      } else {
        setPositions((prev) =>
          prev.map((p) =>
            p.localId === localId ? { ...p, classifying: false } : p
          )
        )
      }
    } catch {
      setPositions((prev) =>
        prev.map((p) =>
          p.localId === localId ? { ...p, classifying: false } : p
        )
      )
    }
  }

  async function classifyAllMissing() {
    const ids = positions
      .filter((p) => p.selected && !p.category_id && !p.category_suggestion)
      .map((p) => p.localId)
    for (const id of ids) {
      await classifyOne(id)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setInvalidBanner(null)
    if (!profileId) {
      setSubmitError('Выберите профиль клиента наверху формы.')
      return
    }
    const selected = positions.filter((p) => p.selected)
    if (selected.length === 0) {
      setSubmitError('Отметьте хотя бы одну позицию чекбоксом.')
      return
    }
    for (const p of selected) {
      if (p.title.length < 10) {
        setSubmitError(`"${p.title || '(без названия)'}" — название должно быть 10–150 символов.`)
        return
      }
      if (p.description.length < 20) {
        setSubmitError(`"${p.title}" — описание должно быть 20–2000 символов.`)
        return
      }
      const qty = Number(p.quantity)
      if (!qty || qty <= 0) {
        setSubmitError(`"${p.title}" — укажите положительное количество.`)
        return
      }
    }
    setSubmitting(true)
    try {
      const expiresIso = new Date(`${expiresDate}T23:59:59Z`).toISOString()
      const sentLocalIds = selected.map((p) => p.localId)
      const res = await fetch('/api/listings/batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          items: selected.map((p) => ({
            title: p.title,
            description: p.description,
            quantity: Number(p.quantity),
            unit: p.unit,
            category_id: p.category_id || null,
            image_url: p.image_url ?? null,
          })),
          deadline_date: deadlineDate || null,
          is_urgent: isUrgent,
          expires_at: expiresIso,
          author_client_profile_id: profileId,
        }),
      })
      const json = await res.json()
      if (res.status === 422 && Array.isArray(json.invalidItems)) {
        applyServerErrors(json.invalidItems, sentLocalIds)
        setInvalidBanner(
          `Исправьте ${json.invalidItems.length} ${pluralizeRows(
            json.invalidItems.length
          )} и нажмите Опубликовать ещё раз.`
        )
        if (json.topLevelErrors) {
          const topMsg = Object.entries(json.topLevelErrors as Record<string, string[]>)
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join('; ')
          if (topMsg) setSubmitError(topMsg)
        }
        return
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Не удалось опубликовать объявления')
      }
      router.push('/dashboard/listings/my')
    } catch (e: any) {
      setSubmitError(e?.message || 'Неизвестная ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  function applyServerErrors(invalidItems: BatchInvalidItem[], sentLocalIds: string[]) {
    const byLocalId = new Map<string, Record<string, string[]>>()
    for (const item of invalidItems) {
      const localId = sentLocalIds[item.index]
      if (localId) byLocalId.set(localId, item.errors)
    }
    setPositions((prev) =>
      prev.map((p) => ({
        ...p,
        serverErrors: byLocalId.get(p.localId) ?? undefined,
      }))
    )
  }

  function pluralizeRows(n: number): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return 'строку'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'строки'
    return 'строк'
  }

  const phaseLabel =
    phase.kind === 'uploading'
      ? 'Загружаем файл в хранилище…'
      : phase.kind === 'analyzing'
      ? 'Распознаём и парсим документ… (до 2 минут)'
      : ''
  const progressValue = phase.kind === 'uploading' ? 30 : phase.kind === 'analyzing' ? 70 : 0

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/40 p-5 dark:border-orange-900/50 dark:bg-orange-900/10">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
            <Upload className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Загрузите спецификацию</h3>
            <p className="text-sm text-muted-foreground">
              Поддерживаем PDF, JPG, PNG, XLSX. Yandex Vision + YandexGPT распознают позиции.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isActive}
            className="gap-2"
          >
            {isActive ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Обработка…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" /> Выбрать файл
              </>
            )}
          </Button>
        </div>

        {isActive && (
          <div className="mt-4 space-y-2">
            <Progress value={progressValue} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> {phaseLabel}
              </span>
              <span>прошло {elapsedSec}с</span>
            </div>
            {fileName && (
              <p className="text-xs text-muted-foreground">
                Файл: <span className="font-medium text-foreground">{fileName}</span>
              </p>
            )}
          </div>
        )}

        {!isActive && fileName && phase.kind !== 'error' && (
          <p className="text-xs text-muted-foreground mt-3">
            Файл: <span className="font-medium text-foreground">{fileName}</span>
          </p>
        )}

        {phase.kind === 'error' && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{phase.message}</span>
          </div>
        )}
      </div>

      {positions.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-orange-500" /> Распознано {positions.length} позиций
              </span>
              <span className="text-muted-foreground ml-2">
                ({selectedCount} выбрано)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={classifyAllMissing}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" /> Подобрать категории AI
            </Button>
          </div>

          {invalidBanner && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{invalidBanner}</span>
            </div>
          )}

          <PositionsTable
            rows={positions}
            onChange={setPositions}
            onRemove={(id) =>
              setPositions((prev) => prev.filter((p) => p.localId !== id))
            }
            categories={categories}
            onRequestClassify={classifyOne}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-1.5">
              <Label htmlFor="d-deadline">Дедлайн (единый)</Label>
              <Input
                id="d-deadline"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-expires">Активно до*</Label>
              <Input
                id="d-expires"
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                max={maxExpires}
                required
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={isUrgent}
                  onCheckedChange={(v) => setIsUrgent(v === true)}
                />
                <Flame className="h-4 w-4 text-orange-500" />
                Все срочные
              </label>
            </div>
          </div>

          {submitError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              disabled={submitting || selectedCount === 0}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Публикация…
                </>
              ) : (
                <>
                  Опубликовать {selectedCount}{' '}
                  {selectedCount === 1 ? 'объявление' : 'объявления'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
