import { Dispatch, SetStateAction } from 'react'

// Хук для управления простыми модальными обработчиками
export const useModalHandlers = (
  setShowStageTransitionModal: Dispatch<SetStateAction<boolean>>,
  setStageTransitionShown: Dispatch<SetStateAction<boolean>>,
  setSelectedSource: Dispatch<SetStateAction<string | null>>,
  setEditingType: Dispatch<SetStateAction<string>>,
  setLastHoveredStep?: Dispatch<SetStateAction<number | null>>
) => {
  const openStageTransitionModal = () => {
    setShowStageTransitionModal(true)
    setStageTransitionShown(true)
  }

  const handleCancelSource = () => {
    setSelectedSource(null)
    setEditingType('')
    // Закрываем область настройки при отмене
    if (setLastHoveredStep) {
      setLastHoveredStep(null)
    }
  }

  return {
    openStageTransitionModal,
    handleCancelSource
  }
}