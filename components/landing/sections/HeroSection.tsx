"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { DashboardPreview } from "../preview/DashboardPreview"
import { useTutorial } from "@/hooks/landing/useTutorial"

// Список стран для анимации
const countries = ["Китая", "Турции", "ЕАЭС"]

export function HeroSection() {
  const { isOpen, type, openTutorial, closeTutorial } = useTutorial()
  const [countryIndex, setCountryIndex] = useState(0)

  // Автоматическая смена стран каждые 3 секунды
  useEffect(() => {
    const interval = setInterval(() => {
      setCountryIndex((prev) => (prev + 1) % countries.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden z-10">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      {/* Gradient orbs - subtle, not pulsating */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]"></div>

      <div className="relative max-w-[1400px] mx-auto px-8 md:px-16 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-6xl mb-16"
        >
          <h1 className="text-[64px] md:text-[96px] leading-[0.92] font-light tracking-tight text-white mb-8">
            Закупки из{" "}
            <span className="inline-block min-w-[280px] md:min-w-[420px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={countryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="inline-block"
                >
                  {countries[countryIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="block mt-2 font-normal bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              под ключ
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed font-light mb-12">
            Каталог 4,800+ товаров · Собственная B2B сеть · CRM система · Заградительные документы на всех этапах проекта
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link href="/dashboard/catalog">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base px-8 py-6 h-auto rounded-full font-normal">
                Открыть каталог
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black text-base px-8 py-6 h-auto rounded-full font-light transition-all">
                Создать закупку
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Dashboard preview with tutorial modal */}
        <DashboardPreview
          onTutorialOpen={openTutorial}
          tutorialIsOpen={isOpen}
          tutorialType={type}
          onTutorialClose={closeTutorial}
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-white/40 rounded-full"></div>
        </motion.div>
      </motion.div>
    </section>
  )
}
