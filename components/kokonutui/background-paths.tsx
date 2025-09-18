"use client"

import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { Info } from "lucide-react"
import { useRouter } from "next/navigation"

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(255,255,255,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full text-white" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export default function BackgroundPaths() {
  const router = useRouter()
  // Общее состояние для синхронизации анимаций
  const [isAnyHovered, setIsAnyHovered] = useState(false)
  const [isGetHovered, setIsGetHovered] = useState(false)
  const [isWhoWeAreHovered, setIsWhoWeAreHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  // Обработчики для синхронизации эффектов наведения
  const handleGetMouseEnter = () => {
    setIsGetHovered(true)
    setIsAnyHovered(true)
    setIsWhoWeAreHovered(true)
    setIsFlipped(true)
  }

  const handleGetMouseLeave = () => {
    setIsGetHovered(false)
    setIsAnyHovered(false)
    setIsWhoWeAreHovered(false)
    setIsFlipped(false)
  }

  const handleWhoWeAreMouseEnter = () => {
    setIsWhoWeAreHovered(true)
    setIsFlipped(true)
    setIsAnyHovered(true)
    setIsGetHovered(true)
  }

  const handleWhoWeAreMouseLeave = () => {
    setIsWhoWeAreHovered(false)
    setIsFlipped(false)
    setIsAnyHovered(false)
    setIsGetHovered(false)
  }

  const handleWhoWeAreClick = () => {
    router.push("/who-we-are")
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 to-black dark:bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Who We Are Button with Flip Effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
        className="absolute top-6 right-6 z-20"
      >
        <div
          className="relative group perspective-1000"
          onMouseEnter={handleWhoWeAreMouseEnter}
          onMouseLeave={handleWhoWeAreMouseLeave}
        >
          <div className={`relative transition-all duration-500 preserve-3d ${isFlipped ? "my-rotate-y-180" : ""}`}>
            {/* Front of the card */}
            <motion.button
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-white/10 hover:border-blue-400/30 transition-all duration-300 backface-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                scale: isAnyHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
              onClick={handleWhoWeAreClick}
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/20 opacity-0 transition-opacity duration-300 rounded-full"
                animate={{ opacity: isAnyHovered ? 1 : 0 }}
              />
              <Info
                className={`h-4 w-4 ${isAnyHovered ? "text-blue-400" : "text-gray-400"} transition-colors duration-300`}
              />
              <span
                className="text-lg font-bold tracking-tight text-white transition-colors duration-300"
                style={{
                  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                  letterSpacing: "-0.025em",
                  textShadow: isAnyHovered ? "0 0 15px rgba(96, 165, 250, 0.5)" : "0 0 15px rgba(255, 255, 255, 0.3)",
                  color: isAnyHovered ? "#60a5fa" : "#ffffff",
                }}
              >
                Кто мы
              </span>
            </motion.button>

            {/* Back of the card */}
            <div className="absolute inset-0 my-rotate-y-180 backface-hidden">
              <motion.button
                className="w-full h-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600/90 to-blue-400/90 backdrop-blur-md border border-blue-300/30 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhoWeAreClick}
              >
                <span
                  className="text-lg font-bold tracking-tight text-white"
                  style={{
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    letterSpacing: "-0.025em",
                    textShadow: "0 0 15px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  Get2B
                </span>
              </motion.button>
            </div>
          </div>

          {/* Dropdown panel */}
          <motion.div
            className="absolute right-0 top-full mt-3 w-72 p-5 rounded-xl overflow-hidden"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{
              opacity: isWhoWeAreHovered ? 1 : 0,
              height: isWhoWeAreHovered ? "auto" : 0,
              scale: isWhoWeAreHovered ? 1 : 0.95,
              pointerEvents: isWhoWeAreHovered ? "auto" : "none",
            }}
            transition={{ duration: 0.3 }}
            style={{
              background: "rgba(17, 24, 39, 0.85)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Get2B
              </h3>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                Профессиональный B2B-дропшиппер и платежный агент для работы с китайскими поставщиками.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Мы помогаем компаниям эффективно вести международный бизнес и оптимизировать платежные процессы.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10">
                <Link href="/who-we-are" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Узнать больше →
                </Link>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex justify-center items-center mb-8 space-x-1">
            <motion.button
              className="relative group flex items-center justify-center transition-all duration-300 cursor-pointer"
              onMouseEnter={handleGetMouseEnter}
              onMouseLeave={handleGetMouseLeave}
              onClick={handleWhoWeAreClick}
              whileHover={{ scale: 1.05 }}
              animate={{
                color: isAnyHovered ? "#60a5fa" : "#ffffff",
                textShadow: isAnyHovered ? "0 0 20px rgba(96, 165, 250, 0.7)" : "0 0 20px rgba(255, 255, 255, 0.3)",
                scale: isAnyHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter">Get</span>
            </motion.button>
            <motion.span
              className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-orange-500"
              style={{
                textShadow: "0 0 20px rgba(249, 115, 22, 0.5)",
              }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 150,
                damping: 25,
              }}
            >
              2B
            </motion.span>
          </div>

          <div
            className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 
                  dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                  overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Link href="/login">
              <Button
                variant="ghost"
                className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                        bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 
                        text-black dark:text-white transition-all duration-300 
                        group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10
                        hover:shadow-md dark:hover:shadow-neutral-800/50"
              >
                <span className="opacity-90 group-hover:opacity-100 transition-opacity">Зайти в личный кабинет</span>
                <span
                  className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                            transition-all duration-300"
                >
                  →
                </span>
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
