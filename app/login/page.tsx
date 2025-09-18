"use client"

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import { LoginFormSimple } from "../../components/login-form-simple"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Share2, ChevronUp, ChevronDown } from "lucide-react"
// import ChatInterface from "@/components/chat-interface"
// import ChatLayout from "@/components/chat-layout"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, AnimatePresence } from "framer-motion"

function ImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202025-03-04%20%D0%B2%2011.55.29-T01sZe4t0K494jKOXqCtpCvOnJwtaX.png",
      title: "Международные оплаты",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202025-03-04%20%D0%B2%2011.56.01-iKnhMdHSbIZR4MiEOQgOXbLKvnzFLp.png",
      title: "Наши услуги",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202025-03-04%20%D0%B2%2011.56.21-EOjN4nLinFTPDuyqmaYP7CLE6s3kxF.png",
      title: "Переводы денежных средств",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202025-03-04%20%D0%B2%2011.56.45-uiwOoCBxWvBI7HkOqjVtYj2f4r2Wa1.png",
      title: "Платежный агент",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202025-03-04%20%D0%B2%2011.57.19-BbSstkk0Ge7os0LW1OW1hfmgjNoxdW.png",
      title: "Наша миссия",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
      <div className="absolute inset-0">
        <img
          src={slides[currentSlide].url || "/placeholder.svg"}
          alt={slides[currentSlide].title}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all duration-300"
          onClick={prevSlide}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all duration-300"
          onClick={nextSlide}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [activePanel, setActivePanel] = useState<"slider" | "chat" | "about">("slider")
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: "0%",
    width: "33.333%",
    backgroundColor: "rgb(230, 238, 255)", // Light blue
  })

  useEffect(() => {
    switch (activePanel) {
      case "slider":
        setIndicatorStyle({
          left: "0%",
          width: "33.333%",
          backgroundColor: "rgb(230, 238, 255)", // Light blue
        })
        break
      case "chat":
        setIndicatorStyle({
          left: "33.333%",
          width: "33.333%",
          backgroundColor: "rgb(139, 92, 246)", // Purple
        })
        break
      case "about":
        setIndicatorStyle({
          left: "66.666%",
          width: "33.333%",
          backgroundColor: "rgb(220, 252, 231)", // Soft green
        })
        break
    }
  }, [activePanel])

  return (
    <div className="grid min-h-svh lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-10 overflow-auto bg-[#0f1117] text-white">
        <div className="flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Get2B
          </a>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginFormSimple />
          </div>
        </div>
      </div>
      <div className="relative bg-muted lg:block h-svh overflow-hidden">
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activePanel === "slider" && (
                <motion.div
                  key="slider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ImageSlider />
                </motion.div>
              )}
              {activePanel === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-hidden"
                >
                  <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="max-w-md text-center p-6">
                      <h2 className="mb-4 text-2xl font-bold">Демо чат</h2>
                      <p className="mb-6 text-gray-600 dark:text-gray-400">
                        Чат временно недоступен в демо режиме. Войдите в систему для доступа к полной функциональности.
                      </p>
                      <Button onClick={() => setActivePanel("slider")}>
                        Вернуться к презентации
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              {activePanel === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-auto"
                >
                  <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="max-w-md text-center p-6">
                      <h2 className="mb-4 text-2xl font-bold">О компании Get2B</h2>
                      <p className="mb-6 text-gray-600 dark:text-gray-400">
                        Get2B – это профессиональный B2B-дропшиппер, выступающий в роли агента, которому поставщики и
                        производители доверяют реализацию своей продукции. Наша ключевая миссия – содействовать
                        поставщикам из Китая в поиске покупателей на территории России и стран Евразийского
                        экономического союза.
                      </p>
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">Наши социальные сети</h3>
                        <div className="flex justify-center space-x-4">
                          <Button
                            variant="outline"
                            className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
                          >
                            Telegram
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-105"
                          >
                            WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105"
                          >
                            WeChat
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Контакты</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Email: info@get2b.com
                          <br />
                          Телефон: +7 (XXX) XXX-XX-XX
                          <br />
                          Адрес: г. Москва, ул. Примерная, д. 123
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-none p-2 bg-gray-900/95">
            <div className="relative flex mx-auto max-w-2xl rounded-full bg-gray-800/50">
              {/* Container for equal width distribution */}
              <div className="flex w-full justify-between p-1">
                {/* Sliding indicator */}
                <motion.div
                  className="absolute top-1 bottom-1 rounded-full z-0"
                  initial={false}
                  animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                    backgroundColor: indicatorStyle.backgroundColor,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                  style={{
                    border: "none",
                  }}
                />

                {/* Buttons with equal width */}
                <div className="flex-1 flex justify-center">
                  <button
                    onClick={() => setActivePanel("slider")}
                    className={`relative z-10 flex items-center justify-center gap-2 py-2 px-4 w-full max-w-[140px] rounded-full transition-colors duration-300 ${
                      activePanel === "slider" ? "text-blue-900 font-medium" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <GalleryVerticalEnd className="h-5 w-5" />
                    <span className="whitespace-nowrap">Презентация</span>
                  </button>
                </div>

                <div className="flex-1 flex justify-center">
                  <button
                    onClick={() => setActivePanel("chat")}
                    className={`relative z-10 flex items-center justify-center gap-2 py-2 px-4 w-full max-w-[140px] rounded-full transition-colors duration-300 ${
                      activePanel === "chat" ? "text-white font-medium" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="whitespace-nowrap">Чат</span>
                  </button>
                </div>

                <div className="flex-1 flex justify-center">
                  <button
                    onClick={() => setActivePanel("about")}
                    className={`relative z-10 flex items-center justify-center gap-2 py-2 px-4 w-full max-w-[140px] rounded-full transition-colors duration-300 outline-none focus:outline-none focus:ring-0 ${
                      activePanel === "about" ? "text-green-800 font-medium" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="whitespace-nowrap">О нас</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
