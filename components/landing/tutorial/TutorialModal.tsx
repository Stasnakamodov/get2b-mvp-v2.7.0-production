"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, ArrowRight } from "lucide-react"
import { tutorialContent } from "@/data/landing/tutorial"
import type { TutorialType } from "@/types/landing"

interface TutorialModalProps {
  isOpen: boolean
  type: TutorialType | null
  onClose: () => void
}

export function TutorialModal({ isOpen, type, onClose }: TutorialModalProps) {
  if (!isOpen || !type) return null

  const content = tutorialContent[type]
  const IconComponent = content.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-black/40 backdrop-blur-md z-50 p-8 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${content.color}`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-white mb-2">
              {content.title}
            </h3>
            <p className="text-gray-400 text-base">
              {content.description}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {content.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">{feature}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Link href="/dashboard/catalog" className="flex-1">
            <Button className={`w-full bg-gradient-to-r ${content.color} hover:opacity-90 text-white`}>
              Попробовать сейчас
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/5"
          >
            Закрыть
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
