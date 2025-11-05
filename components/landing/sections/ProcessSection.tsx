import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeInSection } from '@/components/landing/animations/FadeInSection'
import { StepCard } from '@/components/landing/cards/StepCard'
import { processSteps } from '@/data/landing/steps'

/**
 * Секция "Как это работает" - 7 шагов процесса
 * Отображает процесс закупки в grid формате
 */
export function ProcessSection() {
  return (
    <section id="how-it-works" className="relative py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16">
        <FadeInSection className="max-w-4xl mb-16">
          <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
            7 простых{" "}
            <span className="font-normal">шагов</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
            От заявки до получения. Весь процесс — онлайн.
          </p>
        </FadeInSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {processSteps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/dashboard/create-project">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white text-base px-8 py-6 h-auto rounded-full">
              Попробовать сейчас
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
