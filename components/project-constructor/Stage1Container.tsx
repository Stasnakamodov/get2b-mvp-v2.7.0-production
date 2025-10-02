'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, FileText, Plus, Blocks, ArrowRight } from 'lucide-react'
import { StepConfig, ManualData, SupplierData, ProjectDetails } from '@/types/project-constructor.types'

// ========================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ========================================

interface ConstructorStep {
  id: number
  name: string
  description: string
}

interface Template {
  id: string
  name: string
  step_type: number
  data: any
  created_at: string
}

interface SourceInfo {
  name: string
  color: string
  icon: any
}

interface Stage1ContainerProps {
  // Основные данные
  stepConfigs: Record<number, StepConfig>
  manualData: ManualData
  lastHoveredStep: number | null
  constructorSteps: ConstructorStep[]

  // Шаблоны
  templateSelection: boolean
  setTemplateSelection: React.Dispatch<React.SetStateAction<boolean>>
  templates: Template[]
  templatesLoading: boolean
  fetchTemplates: () => void

  // Детали проекта
  projectDetailsDialogOpen: boolean
  setProjectDetailsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  projectDetails: ProjectDetails | null

  // Обработчики
  handleRemoveSource: (stepId: number) => void
  handleEditData: (type: string) => void
  handleAddProductsFromCatalog: () => void
  handleSourceSelect: (source: StepConfig) => void
  handleTemplateSelect: (templateId: string) => void
  isStepEnabled: (stepId: number) => boolean

  // Источники данных
  availableSources: StepConfig[]
  getSourceInfo: (source: StepConfig) => SourceInfo
  getSourceIcon: (source: StepConfig) => any
}

// ========================================
// КОМПОНЕНТ
// ========================================

export const Stage1Container: React.FC<Stage1ContainerProps> = ({
  stepConfigs,
  manualData,
  lastHoveredStep,
  constructorSteps,
  templateSelection,
  setTemplateSelection,
  templates,
  templatesLoading,
  fetchTemplates,
  projectDetailsDialogOpen,
  setProjectDetailsDialogOpen,
  projectDetails,
  handleRemoveSource,
  handleEditData,
  handleAddProductsFromCatalog,
  handleSourceSelect,
  handleTemplateSelect,
  isStepEnabled,
  availableSources,
  getSourceInfo,
  getSourceIcon
}) => {
  return (
    <>
      {/* Stage 1: Step configuration area */}
      <div className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
        {/* Кнопки действий в правом верхнем углу внутри контейнера */}
        {lastHoveredStep && stepConfigs[lastHoveredStep] && (
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            {/* Кнопка удаления */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveSource(lastHoveredStep)}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-3 w-3 text-red-500" />
                </div>
                <span className="font-medium">Удалить данные</span>
              </div>
            </Button>

            {/* Кнопка просмотра всех данных */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditData('company')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-3 w-3 text-blue-600" />
                </div>
                <span className="font-medium">Посмотреть все данные</span>
              </div>
            </Button>

            {/* Кнопка добавления товаров из каталога (только для шага 2) */}
            {lastHoveredStep === 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddProductsFromCatalog()}
                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <Plus className="h-3 w-3 text-orange-600" />
                  </div>
                  <span className="font-medium">Добавить товары</span>
                </div>
              </Button>
            )}
          </div>
        )}


        <AnimatePresence>
          {lastHoveredStep && isStepEnabled(lastHoveredStep) ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ height: '100%' }}
            >
              {/* Заголовок выбранного шага */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    {lastHoveredStep === 1 ? 'I' : lastHoveredStep === 2 ? 'II' : lastHoveredStep === 3 ? 'III' :
                     lastHoveredStep === 4 ? 'IV' : lastHoveredStep === 5 ? 'V' : lastHoveredStep === 6 ? 'VI' : 'VII'}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {constructorSteps.find(s => s.id === lastHoveredStep)?.name}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {constructorSteps.find(s => s.id === lastHoveredStep)?.description}
                </p>
              </div>

              {/* Показываем выбор шаблонов пользователя */}
              {templateSelection ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-800">Выберите шаблон</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTemplates()}
                        disabled={templatesLoading}
                      >
                        {templatesLoading ? 'Загрузка...' : 'Обновить'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setTemplateSelection(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {templatesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-gray-600">Загрузка шаблонов...</p>
                    </div>
                  ) : templates.length > 0 ? (
                    <div className="grid gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-lg font-semibold text-gray-800 mb-1">{template.name}</div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {(template as any).description || 'Шаблон проекта'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Создан: {new Date(template.created_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                          <div className="text-blue-500">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>У вас пока нет сохраненных шаблонов</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Источники данных */}
                  <div className="grid grid-cols-1 gap-4">
                    {availableSources.map((source) => {
                      const sourceInfo = getSourceInfo(source)
                      const SourceIcon = getSourceIcon(source)

                      return (
                        <div
                          key={source}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3"
                          onClick={() => handleSourceSelect(source)}
                        >
                          <div className={`w-12 h-12 rounded-full ${sourceInfo?.color} flex items-center justify-center shadow-sm`}>
                            <SourceIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-lg font-semibold text-gray-800 mb-1">{sourceInfo?.name}</div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {source === "profile" && (lastHoveredStep === 1 ? "Использовать данные из профиля клиента" : "Использовать данные из профиля поставщика")}
                              {source === "template" && "Выбрать из сохраненных шаблонов"}
                              {source === "catalog" && "Из синей и оранжевой комнат каталога (включая эхо карточки)"}
                              {source === "manual" && "Заполнить самостоятельно"}
                              {source === "upload" && "Загрузить файл (Yandex Vision OCR)"}
                              {source === "automatic" && "Автоматическая обработка"}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ) : lastHoveredStep && !isStepEnabled(lastHoveredStep) ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Blocks className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-500">Сначала настройте основные шаги (I и II)</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Blocks className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Наведите на кубик для выбора источника данных</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Диалог деталей проекта */}
      {projectDetailsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Детали проекта</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectDetailsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {projectDetails && (
              <div className="space-y-6">
                {/* Основная информация */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Основная информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ID проекта</p>
                      <p className="font-medium">{projectDetails.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Статус</p>
                      <p className="font-medium">{projectDetails.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Текущий этап</p>
                      <p className="font-medium">{projectDetails.currentStage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Создан</p>
                      <p className="font-medium">
                        {new Date(projectDetails.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Обновлен</p>
                      <p className="font-medium">
                        {new Date(projectDetails.updated_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Данные шагов */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Данные шагов</h3>
                  <div className="space-y-4">
                    {Object.entries(projectDetails.manualData || {}).map(([stepId, data]: [string, any]) => (
                      <div key={stepId} className="border border-gray-200 rounded p-3">
                        <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                        <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Конфигурации шагов */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Конфигурации шагов</h3>
                  <div className="space-y-4">
                    {Object.entries(projectDetails.stepConfigs || {}).map(([stepId, config]: [string, any]) => (
                      <div key={stepId} className="border border-gray-200 rounded p-3">
                        <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                        <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(config, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Дополнительные данные проекта */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Дополнительные данные</h3>
                  <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(projectDetails, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
