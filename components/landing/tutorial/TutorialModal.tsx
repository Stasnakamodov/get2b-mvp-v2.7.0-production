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
    // ТОЧНО КАК КОРЗИНА: fixed inset-0 + overlay + centered modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - КАК У КОРЗИНЫ */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${content.color}`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{content.title}</h2>
                <p className="text-sm text-gray-600 mt-0.5">{content.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - КАК СПИСОК ТОВАРОВ В КОРЗИНЕ */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="space-y-3">
            {content.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer - КАК У КОРЗИНЫ */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3">
            <Link href="/dashboard/catalog" className="flex-1">
              <Button className={`w-full bg-gradient-to-r ${content.color} hover:opacity-90 text-white h-12`}>
                Попробовать сейчас
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 h-12 px-6"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
