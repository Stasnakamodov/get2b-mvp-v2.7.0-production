'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { db } from '@/lib/db/client'

interface CatalogProduct {
  id: string
  name: string
  description: string | null
  category?: string | null
  price?: number | null
  currency?: string | null
  images?: unknown
}

interface CatalogImageSearchDialogProps {
  open: boolean
  onClose: () => void
  onApply: (payload: { title: string; description: string; image_url: string | null }) => void
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function extractFirstImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0]
  if (typeof first === 'string') return first
  if (first && typeof first === 'object' && 'url' in first && typeof (first as any).url === 'string') {
    return (first as any).url
  }
  return null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error)
  })
}

export function CatalogImageSearchDialog({
  open,
  onClose,
  onApply,
}: CatalogImageSearchDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null)
      setProducts([])
      setSelectedId(null)
      setError(null)
      setSearching(false)
    }
  }, [open])

  async function handleFile(file: File) {
    setError(null)
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Файл больше 10MB. Сожмите картинку и попробуйте ещё раз.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Нужно изображение (JPG/PNG/WebP).')
      return
    }
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setProducts([])
    setSelectedId(null)
    setSearching(true)

    try {
      const base64 = await fileToBase64(file)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const session = await db.auth.getSession().catch(() => null)
      const token = session?.data?.session?.access_token
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/catalog/search-by-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64 }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Не удалось выполнить поиск')
      }
      setProducts(Array.isArray(json.products) ? json.products : [])
    } catch (e: any) {
      setError(e?.message || 'Ошибка при поиске по картинке')
      setProducts([])
    } finally {
      setSearching(false)
    }
  }

  function applySelected() {
    const product = products.find((p) => p.id === selectedId)
    if (!product) return
    const imageUrl = extractFirstImageUrl(product.images)
    const title = product.name.slice(0, 150)
    const description = (product.description || '').trim()
    onApply({
      title,
      description: description.length >= 20 ? description.slice(0, 2000) : description,
      image_url: imageUrl,
    })
    onClose()
  }

  const selectedProduct = products.find((p) => p.id === selectedId)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-orange-500" /> Найти аналог в каталоге
          </DialogTitle>
          <DialogDescription>
            Загрузите фото товара — покажем похожие позиции от верифицированных поставщиков.
            Можно применить название, описание и картинку к вашей позиции.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {previewUrl ? (
              <div className="w-28 h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-muted shrink-0">
                <img src={previewUrl} alt="Превью" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-muted-foreground shrink-0">
                <Camera className="h-6 w-6" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={searching}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {previewUrl ? 'Другое фото' : 'Загрузить фото'}
              </Button>
              {searching && (
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Ищем похожие товары…
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          {!searching && products.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Найдено товаров: {products.length}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {products.map((p) => {
                  const thumb = extractFirstImageUrl(p.images)
                  const isSelected = selectedId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`text-left border rounded-lg overflow-hidden transition-all ${
                        isSelected
                          ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900/40'
                          : 'border-gray-200 dark:border-gray-800 hover:border-orange-300'
                      }`}
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Search className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-medium line-clamp-2">{p.name}</p>
                        {p.category && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {p.category}
                          </p>
                        )}
                        {p.price != null && (
                          <p className="text-xs font-semibold text-orange-600">
                            {p.price} {p.currency || ''}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!searching && previewUrl && products.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              По этому фото ничего не нашлось. Попробуйте другое изображение или заполните
              позицию вручную.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={applySelected}
            disabled={!selectedProduct}
            className="gap-2"
          >
            Применить
            {selectedProduct ? `: ${selectedProduct.name.slice(0, 24)}…` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
