"use client"

import React from "react"
import { motion } from "framer-motion"

interface AnimatedBackgroundProps {
  className?: string
  lineCount?: number
  lineOpacity?: number
  speed?: number
  color?: string
}

export function AnimatedBackground({
  className = "",
  lineCount = 15,
  lineOpacity = 0.2,
  speed = 20,
  color = "rgba(255,255,255,0.2)",
}: AnimatedBackgroundProps) {
  // Generate paths with different heights and offsets
  const generatePaths = () => {
    const paths = []

    for (let i = 0; i < lineCount; i++) {
      // Create varying heights and positions
      const yPos = 150 + i * 15
      const controlY1 = 100 + i * 5
      const controlY2 = 200 + i * 8
      const endY = 120 + i * 6

      paths.push({
        d: `M-100 ${yPos} C300 ${controlY1} 600 ${controlY2} 1600 ${endY}`,
        opacity: lineOpacity - i * 0.005,
        delay: i * 0.2,
        duration: speed + i * 2,
      })
    }

    return paths
  }

  const paths = generatePaths()

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
        {paths.map((path, index) => (
          <motion.path
            key={index}
            d={path.d}
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={path.opacity}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: path.opacity,
              pathOffset: [0, 1],
            }}
            transition={{
              pathLength: {
                duration: 2,
                delay: path.delay,
              },
              opacity: {
                duration: 1,
                delay: path.delay,
              },
              pathOffset: {
                duration: path.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              },
            }}
          />
        ))}
      </svg>
    </div>
  )
}
