"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, ArrowLeft, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PresentationViewer from "./presentation-viewer"

const presentations = [
  {
    id: 1,
    title: "Кто мы",
    description: "Ваш надежный партнер в B2B",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.55.29-T01sZe4t0K494jKOXqCtpCvOnJwtaX.png",
    size: "large",
  },
  {
    id: 2,
    title: "Международные платежи",
    description: "Безопасные и быстрые переводы для бизнеса",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.01-iKnhMdHSbIZR4MiEOQgOXbLKvnzFLp.png",
    size: "medium",
  },
  {
    id: 3,
    title: "Работа с поставщиками",
    description: "Прямое взаимодействие с производителями",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.21-EOjN4nLinFTPDuyqmaYP7CLE6s3kxF.png",
    size: "large",
  },
  {
    id: 4,
    title: "Логистика",
    description: "Оптимизация поставок и маршрутов",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.45-uiwOoCBxWvBI7HkOqjVtYj2f4r2Wa1.png",
    size: "medium",
  },
  {
    id: 5,
    title: "Аналитика",
    description: "Детальные отчеты и статистика",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.57.19-BbSstkk0Ge7os0LW1OW1hfmgjNoxdW.png",
    size: "small",
  },
]

export default function PresentationGrid() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [activePresentation, setActivePresentation] = useState<number | null>(null)

  // Avoid hydration mismatch and detect theme
  useEffect(() => {
    setMounted(true)

    // Check if document has 'dark' class
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)

    // Set up a mutation observer to watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  const handleBack = () => {
    router.back()
  }

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
    }
    setIsDarkMode(!isDarkMode)
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-black dark:text-white transition-colors duration-300">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-6 left-6 z-30 p-2 rounded-full bg-gray-800/20 dark:bg-white/10 backdrop-blur-md hover:bg-gray-800/30 dark:hover:bg-white/20 text-gray-900 dark:text-white"
          onClick={handleBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        {/* Login/Register Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-6 right-6 z-30"
        >
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
            >
              <LogIn className="w-4 h-4" />
              <span>Войти / Регистрация</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Left Column */}
        <div className="w-[400px] flex-shrink-0 p-12 border-r border-gray-200/20 dark:border-white/10">
          <div className="sticky top-12 space-y-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-6xl font-light italic tracking-tight leading-[1.1] mb-6"
                style={{ fontFamily: "Times New Roman, serif" }}
              >
                Get2B
                <br />
                <span className="text-4xl">
                  Ваш надежный
                  <br />
                  партнер в B2B
                </span>
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 text-gray-600 dark:text-gray-400"
            >
              <p>
                Get2B – это профессиональный B2B-дропшиппер и платежный агент, специализирующийся на работе с китайскими
                поставщиками. Мы помогаем компаниям эффективно вести международный бизнес и оптимизировать платежные
                процессы.
              </p>

              <p>
                Наша миссия – сделать международную торговлю доступной и безопасной для бизнеса любого масштаба. Мы
                предоставляем комплексные решения, включающие:
              </p>

              <ul className="space-y-2 list-inside">
                <li>• Организацию безопасных международных платежей</li>
                <li>• Проверку и подбор надежных поставщиков</li>
                <li>• Оптимизацию логистических процессов</li>
                <li>• Аналитику и финансовую отчетность</li>
                <li>• Юридическое сопровождение сделок</li>
              </ul>

              <p>
                Справа представлены основные направления нашей деятельности и ключевые преимущества работы с Get2B.
                Изучите каждый раздел, чтобы узнать больше о том, как мы можем помочь вашему бизнесу.
              </p>
            </motion.div>

            {mounted && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full bg-gray-800/20 dark:bg-white/10 backdrop-blur-md hover:bg-gray-800/30 dark:hover:bg-white/20 text-gray-900 dark:text-white"
                onClick={toggleTheme}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1">
          {/* Grid Layout */}
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {presentations.map((presentation, index) => (
                <motion.div
                  key={presentation.id}
                  className={`relative rounded-lg overflow-hidden cursor-pointer
                ${
                  presentation.size === "large"
                    ? "col-span-2 row-span-2"
                    : presentation.size === "medium"
                      ? "col-span-1 row-span-2"
                      : "col-span-1 row-span-1"
                }
              `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActivePresentation(presentation.id)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 dark:from-black/60 to-transparent z-10" />
                  <img
                    src={presentation.image || "/placeholder.svg"}
                    alt={presentation.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-xl font-bold mb-2 text-white">{presentation.title}</h3>
                    <p className="text-sm text-gray-200">{presentation.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Viewer */}
      <AnimatePresence>
        {activePresentation !== null && (
          <PresentationViewer presentationId={activePresentation} onClose={() => setActivePresentation(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
