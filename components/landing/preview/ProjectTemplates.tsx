"use client"

import { Plus } from "lucide-react"
import { mockTemplates } from "@/data/landing/mockData"

export function ProjectTemplates() {
  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-white">Шаблоны проектов</h3>
        <div className="flex gap-2">
          <button className="px-2 py-1 bg-blue-500 rounded text-xs text-white">
            Клиенты
          </button>
          <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-all">
            <Plus size={12} className="inline mr-1" />
            Создать
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mockTemplates.map((template) => (
          <div key={template.id} className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm hover:bg-white/10 transition-all h-full flex flex-col">
            <h4 className="text-lg font-semibold text-white mb-2">{template.name}</h4>
            <p className="text-sm text-gray-400 mb-6 flex-grow">{template.description}</p>
            <div className="flex justify-between gap-2">
              <button className="px-3 py-1.5 border border-white/20 rounded text-sm text-white hover:border-white/40 transition-all">
                Удалить
              </button>
              <button className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded text-sm text-white shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-1">
                <Plus size={14} />
                Создать проект
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
