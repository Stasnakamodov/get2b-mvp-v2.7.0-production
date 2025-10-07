'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X, FileText, ArrowRight } from 'lucide-react'

interface Template {
  id: string
  name: string
  description?: string
  lastUsed?: string
}

interface TemplateSelectionModeProps {
  templates: Template[]
  templatesLoading: boolean
  templatesError: string | null
  onTemplateSelect: (templateId: string) => void
  onRefresh: () => void
  onClose: () => void
  onCheckTable?: () => void
  onCreateTable?: () => void
  onAnalyzeDB?: () => void
}

/**
 * MODE 1: Template Selection
 * Component for displaying and selecting project templates
 * Extracted from monolithic page.tsx (lines 2131-2254)
 */
export function TemplateSelectionMode({
  templates,
  templatesLoading,
  templatesError,
  onTemplateSelect,
  onRefresh,
  onClose,
  onCheckTable,
  onCreateTable,
  onAnalyzeDB
}: TemplateSelectionModeProps) {
  return (
    <div>
      {/* Header with refresh and close buttons */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-gray-800">Выберите шаблон</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={templatesLoading}
          >
            {templatesLoading ? 'Загрузка...' : 'Обновить'}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Templates grid */}
      <div className="grid gap-4">
        {templatesLoading ? (
          // Loading state
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">Загрузка шаблонов...</span>
          </div>
        ) : templatesError ? (
          // Error state with debug buttons
          <div className="text-center py-8 text-red-500">
            <p>Ошибка загрузки шаблонов: {templatesError}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <Button
                onClick={onRefresh}
                variant="outline"
              >
                Попробовать снова
              </Button>
              {onCheckTable && (
                <Button
                  onClick={onCheckTable}
                  variant="outline"
                >
                  Проверить таблицу
                </Button>
              )}
              {onCreateTable && (
                <Button
                  onClick={onCreateTable}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100"
                >
                  Создать таблицу
                </Button>
              )}
              {onAnalyzeDB && (
                <Button
                  onClick={onAnalyzeDB}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  Анализ БД
                </Button>
              )}
            </div>
          </div>
        ) : templates.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>У вас пока нет сохраненных шаблонов</p>
            <p className="text-sm mt-2">Создайте шаблон в разделе "Создать проект"</p>
          </div>
        ) : (
          // Templates list
          templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={() => onTemplateSelect(template.id)}
            >
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-800 mb-1">{template.name}</div>
                {template.description && (
                  <div className="text-sm text-gray-600 leading-relaxed">{template.description}</div>
                )}
                {template.lastUsed && (
                  <div className="text-xs text-gray-500 mt-1">Использован: {template.lastUsed}</div>
                )}
              </div>
              <div className="text-blue-500">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}