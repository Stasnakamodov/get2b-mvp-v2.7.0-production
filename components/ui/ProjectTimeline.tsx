import React from "react"

interface Step {
  id: number
  title: string
  description: string
  icon: React.ElementType
}

interface ProjectTimelineProps {
  steps: Step[]
  currentStep: number
  maxStepReached: number
  onStepClick?: (stepIndex: number) => void
  showStepTitles?: boolean
}

// Вспомогательная функция для римских цифр
function toRoman(num: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return romans[num - 1] || String(num);
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = React.memo(({ steps, currentStep, maxStepReached, onStepClick, showStepTitles = true }) => {
  return (
    <div className="relative my-8">
      {/* Базовая линия (фон) */}
      <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-300 dark:bg-gray-700 rounded-full" />
      {/* Линия прогресса до текущего шага */}
      <div
        className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-blue-500 rounded-full transition-all duration-500"
        style={{
          width: steps.length === 1
            ? '100%'
            : `${((currentStep - 1) / (steps.length - 1)) * 100}%`
        }}
      />
      {/* Кружки */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isCompletedOrCurrent = index + 1 <= currentStep
          const isClickable = index + 1 <= maxStepReached && !!onStepClick
          return (
            <div
              key={step.id}
              className={`flex flex-col items-center group ${isClickable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
              onClick={isClickable ? () => onStepClick && onStepClick(index + 1) : undefined}
              style={index + 1 > currentStep ? { opacity: 0.6 } : { opacity: 1 }}
            >
              {/* Tooltip для кликабельных шагов */}
              {isClickable && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap">
                    Нажмите для возврата
                  </div>
                </div>
              )}
              <div
                className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-300
                  ${
                    isCompletedOrCurrent
                      ? `bg-blue-700 border-blue-700${index + 1 === currentStep ? ' ring-2 ring-blue-200 dark:ring-blue-900/40' : ''}`
                        : "bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600"
                  }
                  ${isClickable ? 'shadow-md shadow-blue-200 dark:shadow-blue-900/30' : ''}
                `}
              >
                <span className={`text-lg font-bold ${isCompletedOrCurrent ? "text-white" : "text-gray-400 dark:text-gray-500"}`}>{toRoman(index + 1)}</span>
              </div>
              {showStepTitles && (
                <div className="mt-2 text-center">
                  <span className={`text-xs font-medium ${isCompletedOrCurrent ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{step.title}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Оптимизация: перерисовываем только если изменились важные пропсы
  return (
    prevProps.currentStep === nextProps.currentStep &&
    prevProps.maxStepReached === nextProps.maxStepReached &&
    prevProps.showStepTitles === nextProps.showStepTitles &&
    prevProps.steps.length === nextProps.steps.length
  );
});

export default ProjectTimeline 