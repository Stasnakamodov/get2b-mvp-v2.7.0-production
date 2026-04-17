'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { db } from '@/lib/db/client'

interface PositionImageUploaderProps {
  imageUrl: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  compact?: boolean
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function cleanFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').substring(0, 60)
}

export function PositionImageUploader({
  imageUrl,
  onChange,
  disabled = false,
  compact = false,
}: PositionImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Файл больше 10MB. Сожмите и попробуйте ещё раз.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Нужно изображение (JPG/PNG/WebP).')
      return
    }
    setUploading(true)
    try {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const timestamp = Date.now()
      const pathKey = `listings/images/${date}_${timestamp}_${cleanFileName(file.name)}`

      const { data, error: uploadErr } = await db.storage
        .from('project-files')
        .upload(pathKey, file)
      if (uploadErr || !data?.fullPath) {
        throw new Error(uploadErr?.message || 'Ошибка загрузки')
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      onChange(`${origin}${data.fullPath}`)
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить файл')
    } finally {
      setUploading(false)
    }
  }

  const boxClass = compact ? 'w-20 h-20' : 'w-24 h-24'

  if (imageUrl) {
    return (
      <div className="space-y-1">
        <div className={`relative ${boxClass} shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-muted`}>
          <img src={imageUrl} alt="Фото товара" className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
              aria-label="Удалить фото"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className={`${boxClass} shrink-0 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ImagePlus className="h-5 w-5" />
            <span>Фото</span>
          </>
        )}
      </button>
      {error && <p className="text-[11px] text-destructive max-w-[10rem]">{error}</p>}
    </div>
  )
}
