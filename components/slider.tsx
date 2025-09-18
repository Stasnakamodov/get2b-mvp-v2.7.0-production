"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Slide {
  title: string
  description: string
  image: string
  color: string
}

export function Slider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)

  // Обновим массив slides, добавив четвертый слайд "Автоматизация процессов"
  const slides: Slide[] = [
    {
      title: "Международные платежи",
      description: "Безопасные и быстрые переводы для бизнеса с оптимальными курсами обмена и минимальными комиссиями.",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/aitubo.jpg-LuKVaVe99ZfXRb9mQZhzEoung9fqgh.jpeg",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Работа с поставщиками",
      description: "Прямое взаимодействие с производителями из Китая, проверка надежности и репутацию партнеров.",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cafda8dd-26e2-412c-ba4d-e372c86d1cfe%20%281%29-tYnTIkAuBPAgVWNka6PH18Wp4fNQPz.png",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Легальное оформление",
      description:
        "Полное юридическое сопровождение и подготовка всех необходимых документов для международных сделок.",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/977e59c3-8df7-43fd-81b7-c3c19cab8691%20%281%29-3Q2HfXFuSFd4vvit7ECClcjQR8Jik7.png",
      color: "from-blue-600 to-orange-500",
    },
    {
      title: "Автоматизация процессов",
      description:
        "Интуитивно понятное приложение Get2B автоматизирует все этапы международных сделок: от выбора поставщика до получения товара.",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202025-03-19%20%D0%B2%2014.10.54-MOcCpd0qfO4SHBgNzC1KvN9WA4tnlH.png",
      color: "from-purple-500 to-blue-500",
    },
  ]

  const nextSlide = () => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Auto-advance slides
  useEffect(() => {
    const timer = setTimeout(() => {
      nextSlide()
    }, 5000)
    return () => clearTimeout(timer)
  }, [currentSlide])

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      <div className="absolute inset-0 z-10 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white"
          onClick={nextSlide}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50"
            }`}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1)
              setCurrentSlide(index)
            }}
          />
        ))}
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].color} opacity-20`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <img
            src={slides[currentSlide].image || "/placeholder.svg"}
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">{slides[currentSlide].title}</h2>
            <p className="text-white/80 max-w-lg">{slides[currentSlide].description}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
