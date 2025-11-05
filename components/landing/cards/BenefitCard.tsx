import React from 'react'
import { motion } from 'framer-motion'
import type { Benefit } from '@/types/landing'

interface BenefitCardProps {
  benefit: Benefit
  index: number
}

/**
 * Карточка преимущества для секции "Почему Get2B?"
 * Отображается в bento grid с анимацией
 */
export function BenefitCard({ benefit, index }: BenefitCardProps) {
  const Icon = benefit.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 transition-all"
    >
      <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-zinc-700" />
      </div>
      <h3 className="text-base font-normal mb-2">{benefit.title}</h3>
      <p className="text-sm text-gray-600 font-light leading-relaxed">{benefit.description}</p>
    </motion.div>
  )
}
