import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeInSection } from '@/components/landing/animations/FadeInSection'
import { StepCard } from '@/components/landing/cards/StepCard'
import { processSteps } from '@/data/landing/steps'

/**
 * Анимация печатания текста
 */
function TypewriterText() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const texts = [
    '7 простых шагов',
    'Проект готов'
  ]

  useEffect(() => {
    const currentFullText = texts[currentTextIndex]
    const speed = isDeleting ? 50 : 100

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Печатаем
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.slice(0, displayText.length + 1))
        } else {
          // Текст напечатан полностью, ждем и начинаем удалять
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        // Удаляем
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1))
        } else {
          // Текст удален, переходим к следующему
          setIsDeleting(false)
          setCurrentTextIndex((currentTextIndex + 1) % texts.length)
        }
      }
    }, speed)

    return () => clearTimeout(timer)
  }, [displayText, isDeleting, currentTextIndex])

  return (
    <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6 min-h-[100px]">
      {displayText}
      <span className="animate-pulse">|</span>
    </h2>
  )
}

/**
 * Секция "Как это работает" - 7 шагов процесса
 * Отображает процесс закупки в grid формате
 */
export function ProcessSection() {
  return (
    <section id="how-it-works" className="relative py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16">
        <FadeInSection className="max-w-4xl mb-16">
          <TypewriterText />
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
