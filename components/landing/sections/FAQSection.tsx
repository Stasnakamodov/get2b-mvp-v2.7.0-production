'use client'

import React, { useState } from 'react'
import { FadeInSection } from '@/components/landing/animations/FadeInSection'
import { FAQItem } from '@/components/landing/cards/FAQItem'
import { faqItems } from '@/data/landing/faq'

/**
 * Секция FAQ - частые вопросы
 * Аккордеон с анимацией открытия/закрытия
 */
export function FAQSection() {
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null)

  const toggleFaqItem = (index: number) => {
    setOpenFaqItem(openFaqItem === index ? null : index)
  }

  return (
    <section id="faq" className="relative py-32 bg-zinc-50">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16">
        <div className="max-w-3xl mx-auto">
          <FadeInSection className="mb-12">
            <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
              Частые{" "}
              <span className="font-normal">вопросы</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
              Всё что вы хотели знать о Get2B
            </p>
          </FadeInSection>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <FAQItem
                key={index}
                item={item}
                index={index}
                isOpen={openFaqItem === index}
                onToggle={toggleFaqItem}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
