"use client"

import * as React from "react"
import { GalleryVerticalEnd, MessageCircle, Share2, ArrowRight, X } from "lucide-react"
import { LoginFormSimple } from "../../components/login-form-simple"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, AnimatePresence } from "framer-motion"

function PresentationTab() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-[120px]" />

      <div className="relative flex h-full w-full items-center justify-center px-8 py-10 md:px-14">
        <div className="w-full max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.05 }}
            className="mb-7 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500"
          >
            Презентация платформы · PDF
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.12 }}
            className="mb-7 text-[40px] font-light leading-[0.95] tracking-tight text-white md:text-5xl lg:text-[64px]"
          >
            Get2B{" "}
            <span className="block font-normal bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              в деталях
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.22 }}
            className="mb-10 max-w-lg text-base font-light leading-relaxed text-gray-400 md:text-lg"
          >
            Каталог поставщиков, конструктор проектов, оплаты и закрывающие
            документы — всё, что умеет платформа, в одном фичлисте.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.3 }}
            className="mb-10 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-gray-500"
          >
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm">
              PDF
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm">
              257 KB
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm">
              ~3 мин чтения
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.38 }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-all hover:bg-gray-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Открыть презентацию
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="pdf-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Презентация Get2B"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="relative z-10 flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/10"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400" />
                  <h2 className="text-sm font-semibold tracking-tight text-gray-900">
                    Презентация Get2B
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Закрыть презентацию"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 bg-gray-100">
                <iframe
                  src="/Get2B_FichList.pdf#view=FitH&toolbar=1&navpanes=0"
                  title="Презентация Get2B"
                  className="h-full w-full border-0"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LoginContent() {
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
                  <PresentationTab />
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
