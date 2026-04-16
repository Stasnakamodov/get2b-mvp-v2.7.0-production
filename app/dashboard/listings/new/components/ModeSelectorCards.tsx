'use client'

import { FileText, PenLine, Sparkles } from 'lucide-react'

export type ListingNewMode = 'document' | 'manual'

interface ModeSelectorCardsProps {
  mode: ListingNewMode | null
  onSelect: (m: ListingNewMode) => void
}

export function ModeSelectorCards({ mode, onSelect }: ModeSelectorCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onSelect('document')}
        className={`group relative text-left p-5 rounded-2xl border transition-all duration-200 ${
          mode === 'document'
            ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-500/10 dark:from-orange-900/20 dark:to-amber-900/20'
            : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
              mode === 'document'
                ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-orange-50 text-orange-500 group-hover:bg-orange-100 dark:bg-orange-900/30'
            }`}
          >
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">Есть готовый документ</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              PDF, JPG, XLSX со спецификацией — распознаем позиции и опубликуем массово.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('manual')}
        className={`group relative text-left p-5 rounded-2xl border transition-all duration-200 ${
          mode === 'manual'
            ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-500/10 dark:from-orange-900/20 dark:to-amber-900/20'
            : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
              mode === 'manual'
                ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <PenLine className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base">Заполнить вручную</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Одно объявление на один товар. Ассистент подскажет похожие товары из каталога.
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}
