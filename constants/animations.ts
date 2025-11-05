import type { Variants } from 'framer-motion'

/**
 * Предустановленные варианты анимаций для framer-motion
 */

export const ANIMATION_DURATION = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  verySlow: 1,
} as const

export const EASING = {
  smooth: [0.16, 1, 0.3, 1],
  spring: [0.175, 0.885, 0.32, 1.275],
} as const

export const FADE_IN_UP: Variants = {
  initial: {
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: 30
  },
}

export const FADE_IN: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1
  },
  exit: {
    opacity: 0
  },
}

export const SLIDE_IN_RIGHT: Variants = {
  initial: {
    opacity: 0,
    x: 20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: 20
  },
}

export const SLIDE_IN_LEFT: Variants = {
  initial: {
    opacity: 0,
    x: -20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: -20
  },
}

export const SCALE_IN: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    scale: 1
  },
  exit: {
    opacity: 0,
    scale: 0.95
  },
}

export const STAGGER_CONTAINER: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const STAGGER_ITEM: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.smooth,
    },
  },
}

/**
 * Генератор задержки для анимаций
 */
export function getStaggerDelay(index: number, baseDelay: number = 0.05): number {
  return index * baseDelay
}

/**
 * Генератор transition для анимаций
 */
export function getTransition(duration: number = ANIMATION_DURATION.normal, delay: number = 0) {
  return {
    duration,
    delay,
    ease: EASING.smooth,
  }
}
