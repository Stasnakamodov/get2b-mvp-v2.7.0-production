import { useState } from 'react'
import type { TutorialType, UseTutorialReturn } from '@/types/landing'

/**
 * Хук для управления tutorial модалками
 * TODO: Реализовать в Фазе 4
 */
export function useTutorial(): UseTutorialReturn {
  const [tutorialState, setTutorialState] = useState<{
    isOpen: boolean
    type: TutorialType | null
  }>({ isOpen: false, type: null })

  const openTutorial = (type: TutorialType) => {
    // TODO: Реализовать
    setTutorialState({ isOpen: true, type })
  }

  const closeTutorial = () => {
    // TODO: Реализовать
    setTutorialState({ isOpen: false, type: null })
  }

  return {
    ...tutorialState,
    openTutorial,
    closeTutorial,
  }
}
