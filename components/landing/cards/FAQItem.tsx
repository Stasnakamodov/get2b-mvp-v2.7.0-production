import React from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { FAQItemType } from '@/types/landing'

interface FAQItemProps {
  item: FAQItemType
  index: number
  isOpen: boolean
  onToggle: (index: number) => void
}

/**
 * Аккордеон элемент для FAQ секции
 * Анимированное открытие/закрытие с chevron индикатором
 */
export function FAQItem({ item, index, isOpen, onToggle }: FAQItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-zinc-200 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => onToggle(index)}
        className="flex items-center justify-between w-full p-6 text-left hover:bg-zinc-50 transition-all"
      >
        <h3 className="text-base font-normal pr-4">{item.question}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="px-6 pb-6"
        >
          <p className="text-sm text-gray-600 font-light leading-relaxed">{item.answer}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
