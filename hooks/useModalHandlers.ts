import { Dispatch, SetStateAction } from 'react'

// Хук для управления простыми модальными обработчиками
export const useModalHandlers = (
  setShowStageTransitionModal: Dispatch<SetStateAction<boolean>>,
  setStageTransitionShown: Dispatch<SetStateAction<boolean>>,
  setSelectedSource: Dispatch<SetStateAction<string | null>>,
  setEditingType: Dispatch<SetStateAction<string>>
) => {
  const openStageTransitionModal = () => {
    setShowStageTransitionModal(true)
    setStageTransitionShown(true)
  }

  const handleCancelSource = () => {
    setSelectedSource(null)
    setEditingType('')
  }

  return {
    openStageTransitionModal,
    handleCancelSource
  }
}