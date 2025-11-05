import React from 'react'
import type { Project } from '@/types/landing'
import { getCorrectStepForCard, getProjectStatusLabel, toRoman } from '@/lib/utils/projectHelpers'

const projectSteps = [
  { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }
]

interface ProjectCardProps {
  project: Project
}

/**
 * Карточка проекта для dashboard preview
 * Отображает название, сумму, статус и прогресс по 7 шагам
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const step = getCorrectStepForCard(project)
  const { color, text, Icon } = getProjectStatusLabel(step, String(project.status), project.receipts)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-xl">
      {/* Project Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-semibold text-white mb-1">
            {project.name}
          </div>
          <div className="text-sm text-gray-400">
            {project.company_data?.name || 'Компания не указана'} • {project.amount?.toLocaleString('ru-RU') || '0'} {project.currency || '₽'}
          </div>
        </div>
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: '16px', fontWeight: 'bold', color: '#fff', background: color, fontSize: 12
          }}>
            <Icon size={14} />
            {text} • Шаг {step}
          </span>
        </div>
      </div>

      {/* 7-Step Timeline with Roman Numerals */}
      <div className="relative my-4">
        {/* Базовая линия */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-gray-700 rounded-full" />
        {/* Линия прогресса */}
        <div
          className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 bg-blue-500 rounded-full transition-all"
          style={{
            width: `${((step - 1) / 6) * 100}%`
          }}
        />
        {/* Кружки с римскими цифрами */}
        <div className="relative flex justify-between">
          {projectSteps.map((s, idx) => {
            const isActive = idx + 1 <= step
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isActive
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}>
                  {toRoman(idx + 1)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-3">
        <div className="px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/20 transition-all">
          <span className="text-sm text-gray-300">Подробнее</span>
        </div>
        <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all">
          <span className="text-sm text-white font-medium">Следующий шаг</span>
        </div>
      </div>
    </div>
  )
}
