'use client'

import * as React from 'react'
import { Snowflake, GitBranch, ArrowDown, Sparkles } from 'lucide-react'

export type StepHighlightType = 'changed' | 'inherited' | 'proposed' | 'frozen'

interface ScenarioStepHighlightProps {
  type: StepHighlightType | undefined
  scenarioMode: boolean
}

const highlightConfig: Record<StepHighlightType, {
  bgColor: string
  borderColor: string
  dotColor: string
  icon: React.ReactNode
  tooltip: string
}> = {
  changed: {
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    dotColor: 'bg-purple-500',
    icon: <GitBranch className="h-2.5 w-2.5 text-white" />,
    tooltip: 'Изменён в текущем сценарии',
  },
  inherited: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    dotColor: 'bg-blue-400',
    icon: <ArrowDown className="h-2.5 w-2.5 text-white" />,
    tooltip: 'Унаследован от родителя',
  },
  proposed: {
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-400',
    dotColor: 'bg-orange-400 animate-pulse',
    icon: <Sparkles className="h-2.5 w-2.5 text-white" />,
    tooltip: 'Предложение от участника',
  },
  frozen: {
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-400',
    dotColor: 'bg-gray-400',
    icon: <Snowflake className="h-2.5 w-2.5 text-white" />,
    tooltip: 'Сценарий заморожен',
  },
}

/**
 * Overlay-индикатор для кубика шага в режиме сценариев.
 * Рендерится как цветной кружок 3x3 в правом нижнем углу кубика.
 */
export function ScenarioStepHighlight({ type, scenarioMode }: ScenarioStepHighlightProps) {
  if (!scenarioMode || !type) return null

  const config = highlightConfig[type]

  return (
    <div
      className={`absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full ${config.dotColor} flex items-center justify-center z-10 shadow-sm`}
      title={config.tooltip}
    >
      {config.icon}
    </div>
  )
}

/**
 * Возвращает дополнительные CSS-классы для кубика шага на основе типа подсветки
 */
export function getScenarioStepClasses(
  type: StepHighlightType | undefined,
  scenarioMode: boolean
): string {
  if (!scenarioMode || !type) return ''

  const config = highlightConfig[type]
  return `${config.borderColor} ${config.bgColor}`
}
