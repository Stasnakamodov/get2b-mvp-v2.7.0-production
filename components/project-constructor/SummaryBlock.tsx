'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Blocks, ChevronRight } from 'lucide-react'

interface ConfiguredStepSummary {
  stepId: number
  stepName: string
  source: string
  sourceName: string
}

interface ConstructorStep {
  id: number
  name: string
  description: string
  sources: string[]
}

interface SummaryBlockProps {
  constructorSteps: ConstructorStep[]
  stepConfigs: Record<number, string> | { [index: number]: string | undefined }
  configuredStepsSummary: ConfiguredStepSummary[]
  progress: number
  onStepCardClick: (item: ConfiguredStepSummary) => void
}

export function SummaryBlock({
  constructorSteps,
  stepConfigs,
  configuredStepsSummary,
  progress,
  onStepCardClick
}: SummaryBlockProps) {
  return (
    <Card className="sticky top-24 shadow-lg">
      <CardContent className="p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Прогресс настройки</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Мини-кубики прогресса */}
          <div className="flex gap-2 mt-4">
            {constructorSteps.map((step) => (
              <div
                key={step.id}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
                  stepConfigs[step.id]
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 bg-gray-100 text-gray-400'
                }`}
              >
                {step.id}
              </div>
            ))}
          </div>
        </div>

        {/* Сводка настроенных шагов */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Настроенные шаги:</h3>
          {configuredStepsSummary.length > 0 ? (
            <div className="space-y-2">
              {configuredStepsSummary.map((item) => (
                <div
                  key={item.stepId}
                  className="flex items-center gap-3 p-3 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 border-2 relative z-10 bg-gray-50 hover:bg-gray-100 border-blue-400 hover:border-blue-500"
                  style={{ pointerEvents: 'auto' }}
                  onClick={() => onStepCardClick(item)}
                >
                  <div className="w-8 h-8 rounded text-white flex items-center justify-center text-sm font-bold bg-blue-500">
                    {item.stepId}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.stepName}</div>
                    <div className="text-sm text-gray-500">
                      Источник: {item.sourceName}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Blocks className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Настройте хотя бы один шаг для продолжения</p>
            </div>
          )}
        </div>

        {/* Кнопка запуска */}
        <div className="flex justify-end">
          <Button
            className="gap-2"
            disabled={configuredStepsSummary.length === 0}
          >
            Запустить атомарную сделку
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
