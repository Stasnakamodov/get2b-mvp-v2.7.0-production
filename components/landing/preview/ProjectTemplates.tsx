"use client"

import { useState } from "react"
import { Plus, Sparkles } from "lucide-react"
import { mockTemplates } from "@/data/landing/mockData"
import { TemplateInfoModal } from "./TemplateInfoModal"

export function ProjectTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDemoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  return (
    <div className="mt-6 mb-4 relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-white">Шаблоны проектов</h3>
        <div className="relative group">
          <button
            onClick={handleDemoClick}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-all flex items-center gap-1.5"
          >
            <Plus size={14} />
            Создать
          </button>
          {/* Тултип */}
          <div className="absolute bottom-full right-0 mb-2 w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs rounded-lg p-3 shadow-xl border border-white/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-300" />
                <div>
                  <div className="font-semibold mb-1">Автоматизация сделок</div>
                  <div className="text-white/90">
                    Создавайте шаблоны с сохранёнными данными компании и реквизитами.
                    Новые сделки будут заполняться автоматически!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mockTemplates.map((template) => (
          <div key={template.id} className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm hover:bg-white/10 transition-all h-full flex flex-col">
            <h4 className="text-lg font-semibold text-white mb-2">{template.name}</h4>
            <p className="text-sm text-gray-400 mb-6 flex-grow">{template.description}</p>
            <div className="flex justify-between gap-2">
              <button
                onClick={handleDemoClick}
                className="px-3 py-1.5 border border-white/20 rounded text-sm text-white hover:border-red-400/40 hover:text-red-400 transition-all"
              >
                Удалить
              </button>
              <button
                onClick={handleDemoClick}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded text-sm text-white shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-1"
              >
                <Plus size={14} />
                Создать проект
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модалка с информацией о системе шаблонов */}
      <TemplateInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
