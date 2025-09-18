"use client"

import React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import PresentationViewer from "./presentation-viewer"

interface CubeProps {
  title: string
  description: string
  image: string
  presentationId: number
  isMain?: boolean
}

export default function PresentationCube({ title, description, image, presentationId, isMain = false }: CubeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      <motion.div
        className="relative aspect-square w-full cursor-pointer perspective-1000"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(true)}
      >
        {/* 3D Cube Effect */}
        <motion.div
          className="relative w-full h-full preserve-3d transition-transform duration-700"
          animate={{
            transform: isHovered ? "rotateX(10deg) rotateY(10deg)" : "rotateX(0deg) rotateY(0deg)",
          }}
        >
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden">
            <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
              <img
                src={image || "/placeholder.svg"}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <motion.h3
                  className="text-xl font-bold text-white mb-2"
                  animate={{ y: isHovered ? -5 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {title}
                </motion.h3>
                <motion.p
                  className="text-sm text-gray-300"
                  animate={{
                    opacity: isHovered ? 1 : 0.7,
                    y: isHovered ? 0 : 5,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {description}
                </motion.p>
              </div>

              {/* Premium Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                animate={{
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: isHovered ? ["-100%", "200%"] : "-100%",
                }}
                transition={{
                  duration: 1.5,
                  repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                  repeatDelay: 1,
                }}
              />
            </div>
          </div>

          {/* Reflection */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent transform translate-y-full rotateX-90 opacity-50" />
        </motion.div>
      </motion.div>

      {/* Presentation Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <motion.button
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setIsOpen(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full max-w-7xl max-h-[90vh] overflow-hidden"
            >
              <PresentationViewer presentationId={presentationId} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
