import React from 'react'
import { motion } from 'framer-motion'
import type { ProcessStep } from '@/types/landing'

interface StepCardProps {
  step: ProcessStep
  index: number
}

/**
 * Карточка шага процесса для секции "Как это работает"
 * Отображается в grid с анимацией появления
 */
export function StepCard({ step, index }: StepCardProps) {
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-light text-zinc-300">{step.number}</div>
        <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-zinc-700" />
        </div>
      </div>
      <h3 className="text-base font-normal mb-2">{step.title}</h3>
      <p className="text-sm text-gray-600 mb-3 font-light">{step.description}</p>
      <div className="text-xs text-gray-500 font-light">⏱ {step.time}</div>
    </motion.div>
  )
}
