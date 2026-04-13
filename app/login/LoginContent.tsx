"use client"

import * as React from "react"
import { GalleryVerticalEnd, MessageCircle, Share2, FileText, ArrowUpRight, X } from "lucide-react"
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

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gray-100 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <div className="flex h-full w-full items-center justify-center p-6">
        <motion.button
          type="button"
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="group relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200/80 bg-white text-left shadow-xl shadow-blue-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-gray-900/80 dark:shadow-black/40"
          aria-label="Открыть презентацию Get2B"
        >
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
            <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_20%,white_0%,transparent_55%)]" />
            <div className="absolute left-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-sm">
              PDF
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-white/15 shadow-lg ring-1 ring-white/30 backdrop-blur-sm">
                <FileText className="h-9 w-9 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Презентация Get2B
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Фичлист платформы: каталог, проекты, оплаты и чеки — всё в одном месте.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-white/5">
                <FileText className="h-3 w-3" />
                PDF
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-white/5">
                257 KB
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-white/5">
                ~3 мин чтения
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                Открыть презентацию
              </span>
              <ArrowUpRight className="h-4 w-4 text-blue-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-blue-400" />
            </div>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="pdf-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Презентация Get2B"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="relative z-10 flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-950"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Презентация Get2B
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label="Закрыть презентацию"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-900">
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
