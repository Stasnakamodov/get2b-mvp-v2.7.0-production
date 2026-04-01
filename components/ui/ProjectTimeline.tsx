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
    <div className="relative my-6">
      {/* Базовая линия (фон) */}
      <div className="absolute top-5 left-0 right-0 h-1.5 -translate-y-px bg-gray-300 dark:bg-gray-700 rounded-full" />
      {/* Линия прогресса до текущего шага */}
      <div
        className="absolute top-5 left-0 h-1.5 -translate-y-px bg-blue-500 rounded-full transition-all duration-500"
        style={{
          width: steps.length === 1
            ? '100%'
            : `${((currentStep - 1) / (steps.length - 1)) * 100}%`
        }}
      />
      {/* Кружки */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompletedOrCurrent = index + 1 <= currentStep
          const isClickable = index + 1 <= maxStepReached && !!onStepClick
          return (
            <div
              key={step.id}
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
              onClick={isClickable ? () => onStepClick && onStepClick(index + 1) : undefined}
            >
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${isCompletedOrCurrent
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                    : 'bg-gray-300 border-gray-400 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <span className="text-sm font-bold">{toRoman(index + 1)}</span>
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
  return (
    prevProps.currentStep === nextProps.currentStep &&
    prevProps.maxStepReached === nextProps.maxStepReached &&
    prevProps.showStepTitles === nextProps.showStepTitles &&
    prevProps.steps.length === nextProps.steps.length
  );
});

export default ProjectTimeline
