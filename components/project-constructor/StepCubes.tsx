'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

interface ConstructorStep {
  id: number
  name: string
  description: string
  sources: string[]
}

interface StepCubesProps {
  constructorSteps: ConstructorStep[]
  currentStage: number
  stepConfigs: Record<number, string>
  manualData: any
  receiptApprovalStatus: string | null
  hasManagerReceipt: boolean
  clientReceiptUrl: string | null
  isStepEnabled: (stepId: number) => boolean
  getCurrentStage: () => number
  handleStepHover: (stepId: number) => void
  handleStepClick: (stepId: number) => void
  stepIcons: Record<number, any>
  dataSources: Record<string, { name: string }>
}

export function StepCubes({
  constructorSteps,
  currentStage,
  stepConfigs,
  manualData,
  receiptApprovalStatus,
  hasManagerReceipt,
  clientReceiptUrl,
  isStepEnabled,
  getCurrentStage,
  handleStepHover,
  handleStepClick,
  stepIcons,
  dataSources
}: StepCubesProps) {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Шаги конструктора</h2>
            <p className="text-gray-600">Выберите источники данных для каждого шага</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">Этап {currentStage}: </span>
              <span className="text-gray-600">
                {currentStage === 1 ? 'Подготовка данных' :
                 currentStage === 2 ? 'Подготовка инфраструктуры' :
                 'Анимация сделки'}
              </span>
            </div>
          </div>
        </div>

        {/* Все 7 кубиков в одной горизонтальной линии */}
        <div className="grid grid-cols-7 gap-4">
          {constructorSteps.map((step) => {
            const isEnabled = isStepEnabled(step.id)

            return (
            <div
              key={step.id}
                className={`relative transition-all duration-300 ${
                  isEnabled ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'
                }`}
              onMouseEnter={() => isEnabled ? handleStepHover(step.id) : null}
                onClick={() => isEnabled ? handleStepClick(step.id) : null}
            >

              <div className={`
                  aspect-square rounded-lg border-2 p-4 flex flex-col items-center justify-center relative group
                ${(stepConfigs[step.id] && manualData[step.id]?.user_choice) ||
                  (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                  (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                  (step.id === 3 && receiptApprovalStatus === 'approved') ||
                  (step.id === 6 && hasManagerReceipt) ||
                  (step.id === 7 && clientReceiptUrl)
                                        ? 'border-blue-500 border-dashed bg-blue-50'
                                        : isEnabled
                                            ? 'border-gray-300 hover:border-blue-400'
                                            : 'border-gray-200 bg-gray-50'
                                      }
                `}>
                             {/* Индикатор заблокированного шага с tooltip */}
           {!isEnabled && (
             <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex items-center justify-center group">
               <div className="text-center">
                 <Lock className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                 <p className="text-xs text-gray-500">Этап {getCurrentStage() === 1 ? '2' : '1'}</p>
               </div>

               {/* Tooltip при наведении */}
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                 <div className="text-center">
                   <p className="font-medium">
                     {step.id === 3 ? 'Документы проекта' :
                      step.id === 6 ? 'Финансовые условия' :
                      step.id === 7 ? 'Запуск проекта' : 'Откроется в следующем этапе'}
                   </p>
                   <p className="text-gray-300">
                     {step.id === 3 ? 'Загрузка документов и спецификаций' :
                      step.id === 6 ? 'Настройка условий оплаты и доставки' :
                      step.id === 7 ? 'Финальная проверка и запуск сделки' : 'Заполните шаги 1, 2, 4, 5 для продолжения'}
                   </p>
                 </div>
                 {/* Стрелка вниз */}
                 <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
               </div>
             </div>
           )}
                  {/* Иконка замка для заблокированных шагов */}
                  {!isEnabled && (
                    <div className="absolute top-2 left-2">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}




                {/* Римская цифра в правом верхнем углу */}
                <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isEnabled
                      ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) ||
                         (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                         (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                         (step.id === 3 && receiptApprovalStatus === 'approved') ||
                         (step.id === 6 && hasManagerReceipt) ||
                         (step.id === 7 && clientReceiptUrl)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-400 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                  {step.id === 1 ? 'I' : step.id === 2 ? 'II' : step.id === 3 ? 'III' :
                   step.id === 4 ? 'IV' : step.id === 5 ? 'V' : step.id === 6 ? 'VI' : 'VII'}
                </div>

                {/* Иконка шага в центре */}
                <div className="mb-2">
                  {stepIcons[step.id] && React.createElement(stepIcons[step.id] as React.ComponentType<any>, {
                      className: `h-6 w-6 ${
                        isEnabled
                          ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) ||
                             (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                             (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                             (step.id === 3 && receiptApprovalStatus === 'approved')
                            ? 'text-blue-600'
                            : 'text-gray-600'
                          : 'text-gray-400'
                      }`
                  })}
                </div>

                {/* Название и описание */}
                  <div className={`text-sm font-medium text-center ${
                    isEnabled
                      ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) ||
                         (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                         (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                         (step.id === 3 && receiptApprovalStatus === 'approved')
                        ? 'text-gray-800'
                        : 'text-gray-600'
                      : 'text-gray-500'
                  }`}>
                    {step.name}
                  </div>
                  <div className={`text-xs text-center mt-1 ${
                    isEnabled
                      ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) ||
                         (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                         (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                         (step.id === 3 && receiptApprovalStatus === 'approved')
                        ? 'text-gray-500'
                        : 'text-gray-400'
                      : 'text-gray-400'
                  }`}>
                    {step.description}
                  </div>

                {/* Бейдж с источником данных */}
                {stepConfigs[step.id] && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {dataSources[stepConfigs[step.id] as keyof typeof dataSources]?.name}
                    </Badge>
                  </div>
                )}

              </div>
            </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
