import { useState, useCallback } from 'react'
import type { ManualData } from '@/types/project-constructor.types'

interface UseTouchHandlersProps {
  lastHoveredStep: number | null
  manualData: ManualData
  onItemIndexChange: (index: number | ((prev: number) => number)) => void
}

export function useTouchHandlers({ lastHoveredStep, manualData, onItemIndexChange }: UseTouchHandlersProps) {
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || !lastHoveredStep) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    const items = manualData[lastHoveredStep]?.items

    if (isLeftSwipe && items && items.length > 3) {
      // Свайп влево - следующий набор
      onItemIndexChange(prev =>
        prev < Math.max(0, items.length - 3) ? prev + 1 : prev
      )
    }

    if (isRightSwipe && items && items.length > 3) {
      // Свайп вправо - предыдущий набор
      onItemIndexChange(prev => prev > 0 ? prev - 1 : prev)
    }

    // Сброс значений
    setTouchStart(0)
    setTouchEnd(0)
  }, [touchStart, touchEnd, lastHoveredStep, manualData, onItemIndexChange])

  return {
    touchStart,
    touchEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}