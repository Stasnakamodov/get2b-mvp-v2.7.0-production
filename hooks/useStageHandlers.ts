import { Dispatch, SetStateAction } from 'react'

// Хук для управления обработчиками этапов реквизитов
export const useStageHandlers = (
  setShowRequisitesConfirmationModal: Dispatch<SetStateAction<boolean>>,
  setShowStage2SummaryModal: Dispatch<SetStateAction<boolean>>,
  setCurrentStage: Dispatch<SetStateAction<number>>,
  setSelectedSource?: Dispatch<SetStateAction<string>>,
  setEditingType?: Dispatch<SetStateAction<string>>
) => {
  // Функция для подтверждения реквизитов
  const confirmRequisites = () => {
    setShowRequisitesConfirmationModal(false)
    setShowStage2SummaryModal(true)
  }

  // Функция для редактирования реквизитов
  const editRequisites = () => {
    setShowRequisitesConfirmationModal(false)
    // Открываем форму редактирования компании (полную форму)
    if (setSelectedSource && setEditingType) {
      setSelectedSource("manual")
      setEditingType('company')
    }
    setCurrentStage(1) // Возвращаемся к первому этапу для редактирования
  }

  return {
    confirmRequisites,
    editRequisites
  }
}