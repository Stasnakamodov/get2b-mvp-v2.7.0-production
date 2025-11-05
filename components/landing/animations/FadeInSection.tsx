import React from 'react'
import { motion } from 'framer-motion'
import type { FadeInSectionProps } from '@/types/landing'

/**
 * Универсальный wrapper для анимации появления секций
 * Использует framer-motion для плавного fade-in при скролле
 */
export function FadeInSection({
  children,
  delay = 0,
  duration = 0.8,
  className = ''
}: FadeInSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
