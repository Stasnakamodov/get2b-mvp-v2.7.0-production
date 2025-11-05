import React from 'react'
import { FadeInSection } from '@/components/landing/animations/FadeInSection'
import { BenefitCard } from '@/components/landing/cards/BenefitCard'
import { benefits } from '@/data/landing/benefits'

/**
 * Секция "Почему Get2B?" - преимущества платформы
 * Отображает 6 ключевых преимуществ в bento grid
 */
export function BenefitsSection() {
  return (
    <section id="benefits" className="relative py-32 bg-zinc-50">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16">
        <FadeInSection className="max-w-3xl mb-16">
          <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
            Почему{" "}
            <span className="font-normal">Get2B?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
            Всё для закупок из Китая — в одной платформе
          </p>
        </FadeInSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
