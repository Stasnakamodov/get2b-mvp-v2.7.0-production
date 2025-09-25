import { Dispatch, SetStateAction } from 'react'

// Хук для управления обработчиками этапов реквизитов
export const useStageHandlers = (
  setShowRequisitesConfirmationModal: Dispatch<SetStateAction<boolean>>,
  setShowStage2SummaryModal: Dispatch<SetStateAction<boolean>>,
  setCurrentStage: Dispatch<SetStateAction<number>>
) => {
  // Функция для подтверждения реквизитов
  const confirmRequisites = () => {
    console.log('✅ Реквизиты подтверждены - показываем сводку этапа 2')
    setShowRequisitesConfirmationModal(false)
    setShowStage2SummaryModal(true)
  }

  // Функция для редактирования реквизитов
  const editRequisites = () => {
    console.log('✏️ Редактирование реквизитов')
    setShowRequisitesConfirmationModal(false)
    // Возвращаемся к редактированию шага 5 (реквизиты)
    setCurrentStage(1) // Возвращаемся к первому этапу для редактирования
  }

  return {
    confirmRequisites,
    editRequisites
  }
}