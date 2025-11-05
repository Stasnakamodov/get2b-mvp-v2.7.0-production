import { useState } from 'react'
import type { TutorialType, UseTutorialReturn } from '@/types/landing'

/**
 * Хук для управления tutorial модалками
 * Используется в landing page для интерактивных туториалов
 */
export function useTutorial(): UseTutorialReturn {
  const [tutorialState, setTutorialState] = useState<{
    isOpen: boolean
    type: TutorialType | null
  }>({ isOpen: false, type: null })

  const openTutorial = (type: TutorialType) => {
    setTutorialState({ isOpen: true, type })
  }

  const closeTutorial = () => {
    setTutorialState({ isOpen: false, type: null })
  }

  return {
    ...tutorialState,
    openTutorial,
    closeTutorial,
  }
}
