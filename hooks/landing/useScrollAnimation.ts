import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { UseScrollAnimationReturn } from '@/types/landing'

/**
 * Хук для анимаций при скролле
 * Используется в landing page для триггера анимаций при появлении элемента в viewport
 */
export function useScrollAnimation(): UseScrollAnimationReturn {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return { ref, isInView }
}
