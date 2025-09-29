import React from 'react'
import { CheckCircle, X } from 'lucide-react'

interface AutoFillNotificationProps {
  show: boolean
  message: string
  supplierName: string
  filledSteps: number[]
  currentStage: number
  onDismiss: () => void
}

export const AutoFillNotification: React.FC<AutoFillNotificationProps> = ({
  show,
  message,
  supplierName,
  filledSteps,
  currentStage,
  onDismiss
}) => {
  if (!show || currentStage === 3) return null

  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        <div>
          <p className="text-green-700 font-medium">{message}</p>
          <p className="text-green-600 text-sm">
            Поставщик: {supplierName} |
            Заполнены шаги: {filledSteps.map(step =>
              step === 4 ? 'IV' : step === 5 ? 'V' : step
            ).join(', ')}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-auto text-green-400 hover:text-green-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}