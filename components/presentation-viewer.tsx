"use client"

import React from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { useState, useEffect } from "react"

export function PresentationViewer({ presentationId, onClose }: { presentationId: number; onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState("payments")
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Check for dark mode on component mount
  useEffect(() => {
    // Function to check if dark mode is active
    const checkDarkMode = () => {
      // Check if document has 'dark' class
      const isDark = document.documentElement.classList.contains("dark")
      setIsDarkMode(isDark)
    }

    // Initial check
    checkDarkMode()

    // Set up a mutation observer to watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkDarkMode()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  // Tab content data
  const tabs = [
    { id: "payments", label: "Международные платежи" },
    { id: "suppliers", label: "Работа с поставщиками" },
    { id: "logistics", label: "Логистика" },
    { id: "analytics", label: "Аналитика" },
  ]

  // Section content data
  const sections = {
    payments: [
      {
        title: "Безопасные переводы",
        description: "Защищенные международные транзакции",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.01-iKnhMdHSbIZR4MiEOQgOXbLKvnzFLp.png",
      },
      {
        title: "Быстрые платежи",
        description: "Ускоренные переводы в любую точку мира",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.21-EOjN4nLinFTPDuyqmaYP7CLE6s3kxF.png",
      },
    ],
    suppliers: [
      {
        title: "Проверка поставщиков",
        description: "Комплексная оценка надежности партнеров",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.21-EOjN4nLinFTPDuyqmaYP7CLE6s3kxF.png",
      },
      {
        title: "Прямые контакты",
        description: "Работа напрямую с производителями",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.45-uiwOoCBxWvBI7HkOqjVtYj2f4r2Wa1.png",
      },
    ],
    logistics: [
      {
        title: "Оптимизация маршрутов",
        description: "Эффективное планирование доставки",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.56.45-uiwOoCBxWvBI7HkOqjVtYj2f4r2Wa1.png",
      },
      {
        title: "Таможенное оформление",
        description: "Полное сопровождение документации",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.57.19-BbSstkk0Ge7os0LW1OW1hfmgjNoxdW.png",
      },
    ],
    analytics: [
      {
        title: "Детальные отчеты",
        description: "Статистика и анализ операций",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.57.19-BbSstkk0Ge7os0LW1OW1hfmgjNoxdW.png",
      },
      {
        title: "Рекомендации",
        description: "Оптимизация бизнес-процессов",
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Снимок%20экрана%202025-03-04%20в%2011.55.29-T01sZe4t0K494jKOXqCtpCvOnJwtaX.png",
      },
    ],
  }

  // Render cards for the active tab
  const renderCards = (cards: any[]) => (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className="relative rounded-lg overflow-hidden cursor-pointer h-40"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10" />
          <img src={card.image || "/placeholder.svg"} alt={card.title} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <h3 className="text-lg font-bold mb-1 text-white">{card.title}</h3>
            <p className="text-xs text-gray-200">{card.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
    >
      <motion.button
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-6 h-6" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full h-full flex items-center justify-center p-8"
      >
        <div
          className={`w-full max-w-7xl rounded-xl overflow-hidden ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
        >
          <div className="flex flex-col md:flex-row min-h-[80vh]">
            {/* Left Column - Fixed Company Info */}
            <div
              className={`w-full md:w-[400px] flex-shrink-0 p-8 md:p-12 border-b md:border-b-0 md:border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <div>
                <h1 className="text-4xl font-bold mb-2">Get2B</h1>
                <p className="text-2xl font-light italic">{tabs.find((tab) => tab.id === activeTab)?.label}</p>
              </div>

              <div className="mt-8 space-y-4 text-gray-600 dark:text-gray-400">
                <p>
                  {activeTab === "payments" &&
                    "Мы предлагаем безопасные и быстрые международные платежи для вашего бизнеса, с оптимальными курсами обмена и минимальными комиссиями."}
                  {activeTab === "suppliers" &&
                    "Прямое взаимодействие с производителями и поставщиками из Китая, проверка надежности и репутации партнеров."}
                  {activeTab === "logistics" &&
                    "Оптимизация маршрутов доставки, контроль сроков и качества перевозки грузов, таможенное оформление."}
                  {activeTab === "analytics" &&
                    "Детальные отчеты и статистика по всем операциям, анализ эффективности и рекомендации по оптимизации процессов."}
                </p>

                <p>Выберите интересующий вас раздел, чтобы узнать больше о наших услугах и возможностях.</p>
              </div>
            </div>

            {/* Right Column - Tabbed Content */}
            <div className="flex-1 flex flex-col">
              {/* Tabs Navigation */}
              <div className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                          : `${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold mb-6">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>

                  {/* Dynamic content based on active tab */}
                  {activeTab === "payments" && (
                    <div className="space-y-6">
                      <p className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Мы предлагаем безопасные и быстрые международные платежи для вашего бизнеса, с оптимальными
                        курсами обмена и минимальными комиссиями.
                      </p>
                      {renderCards(sections.payments)}
                    </div>
                  )}

                  {activeTab === "suppliers" && (
                    <div className="space-y-6">
                      <p className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Прямое взаимодействие с производителями и поставщиками из Китая, проверка надежности и репутации
                        партнеров.
                      </p>
                      {renderCards(sections.suppliers)}
                    </div>
                  )}

                  {activeTab === "logistics" && (
                    <div className="space-y-6">
                      <p className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Оптимизация маршрутов доставки, контроль сроков и качества перевозки грузов, таможенное
                        оформление.
                      </p>
                      {renderCards(sections.logistics)}
                    </div>
                  )}

                  {activeTab === "analytics" && (
                    <div className="space-y-6">
                      <p className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Детальные отчеты и статистика по всем операциям, анализ эффективности и рекомендации по
                        оптимизации процессов.
                      </p>
                      {renderCards(sections.analytics)}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PresentationViewer
