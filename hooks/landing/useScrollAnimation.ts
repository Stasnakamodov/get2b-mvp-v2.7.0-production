import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { UseScrollAnimationReturn } from '@/types/landing'

/**
 * Хук для анимаций при скролле
 * TODO: Реализовать в Фазе 4
 */
export function useScrollAnimation(): UseScrollAnimationReturn {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return { ref, isInView }
}
