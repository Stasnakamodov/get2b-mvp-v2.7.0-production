"use client"

import { Search, Plus, Globe, Camera, ShoppingCart } from "lucide-react"
import type { TutorialType } from "@/types/landing"

interface CatalogSearchBarProps {
  onTutorialOpen: (type: TutorialType) => void
}

export function CatalogSearchBar({ onTutorialOpen }: CatalogSearchBarProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={() => onTutorialOpen('new-project')}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white text-sm font-medium flex items-center gap-2 shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer"
      >
        <Plus size={16} />
        Новый проект
      </button>
      <div className="flex-1 relative">
        <div className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Каталог Get2b"
            className="w-full pl-10 pr-32 py-2 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
            readOnly
          />
          {/* Кнопка глобуса - поиск по ссылке */}
          <button
            onClick={() => onTutorialOpen('globe')}
            className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-md hover:from-purple-600 hover:to-blue-600 transition-all cursor-pointer"
            title="Поиск по ссылке из интернета"
          >
            <Globe className="w-4 h-4 text-white" />
          </button>
          {/* Кнопка камеры - поиск по изображению */}
          <button
            onClick={() => onTutorialOpen('camera')}
            className="absolute right-11 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Поиск по изображению"
          >
            <Camera className="w-4 h-4 text-blue-400" />
          </button>
          {/* Кнопка корзины */}
          <button
            onClick={() => onTutorialOpen('cart')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Корзина"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                3
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
