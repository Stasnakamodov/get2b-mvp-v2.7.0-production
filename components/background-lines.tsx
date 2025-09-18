"use client"
import React from "react"
import { useState, useEffect } from "react"

interface BackgroundLinesProps {
  className?: string
}

export function BackgroundLines({ className = "" }: BackgroundLinesProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Обработчик скролла
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Обработчик движения мыши
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Нормализуем координаты мыши от -1 до 1
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1

      setMousePosition({
        x: x * 30, // Умножаем на 30 для усиления эффекта
        y: y * 30,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Вычисляем позиции для каждой группы линий
  const topGroupStyle = {
    transform: `translate(${scrollPosition * 0.05 + mousePosition.x}px, ${-scrollPosition * 0.15 + mousePosition.y}px) rotate(${scrollPosition * 0.002}deg)`,
  }

  const middleGroupStyle = {
    transform: `translate(${-scrollPosition * 0.07 - mousePosition.x * 0.5}px, ${-scrollPosition * 0.25 - mousePosition.y * 0.5}px)`,
  }

  const bottomGroupStyle = {
    transform: `translate(${scrollPosition * 0.09 + mousePosition.x * 0.7}px, ${-scrollPosition * 0.35 + mousePosition.y * 0.7}px) rotate(${-scrollPosition * 0.002}deg)`,
  }

  const deepBottomGroupStyle = {
    transform: `translate(${-scrollPosition * 0.11 - mousePosition.x * 0.9}px, ${-scrollPosition * 0.45 - mousePosition.y * 0.9}px)`,
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Группа 1: Верхние линии */}
        <g style={topGroupStyle}>
          <path
            d="M-100 100 C 200 50, 400 150, 1600 50"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 130 C 250 80, 450 180, 1600 80"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 160 C 300 110, 500 210, 1600 110"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 190 C 350 140, 550 240, 1600 140"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 220 C 400 170, 600 270, 1600 170"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
        </g>

        {/* Группа 2: Средние линии */}
        <g style={middleGroupStyle}>
          <path
            d="M-100 250 C 200 300, 600 200, 1600 300"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 280 C 250 330, 650 230, 1600 330"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 310 C 300 360, 700 260, 1600 360"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 340 C 350 390, 750 290, 1600 390"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 370 C 200 420, 600 320, 1600 420"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 400 C 250 450, 650 350, 1600 450"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
        </g>

        {/* Группа 3: Нижние линии с большим изгибом */}
        <g style={bottomGroupStyle}>
          <path
            d="M-100 450 C 400 250, 800 650, 1600 450"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 480 C 450 280, 850 680, 1600 480"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 510 C 500 310, 900 710, 1600 510"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 540 C 550 340, 950 740, 1600 540"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 570 C 600 370, 1000 770, 1600 570"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 600 C 250 400, 850 800, 1600 600"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 630 C 275 425, 875 825, 1600 630"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
        </g>

        {/* Группа 4: Самые нижние линии с еще большим изгибом */}
        <g style={deepBottomGroupStyle}>
          <path
            d="M-100 650 C 300 350, 900 950, 1600 650"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 680 C 350 380, 950 980, 1600 680"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 710 C 400 410, 1000 1010, 1600 710"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 740 C 450 440, 1050 1040, 1600 740"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 770 C 500 470, 1100 1070, 1600 770"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 800 C 550 500, 1150 1100, 1600 800"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 830 C 600 530, 1200 1130, 1600 830"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 860 C 650 560, 1250 1160, 1600 860"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 890 C 700 590, 1300 1190, 1600 890"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
          <path
            d="M-100 920 C 750 620, 1350 1220, 1600 920"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200 dark:text-white/10"
          />
        </g>
      </svg>
    </div>
  )
}
