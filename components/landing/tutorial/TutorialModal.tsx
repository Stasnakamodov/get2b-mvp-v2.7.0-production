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
    // ТЕМНАЯ ТЕМА: fixed inset-0 + overlay + centered modal
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - ТЕМНАЯ ТЕМА */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${content.color}`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{content.title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{content.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - ТЕМНАЯ ТЕМА */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="space-y-3">
            {content.features.map((feature, index) => {
              const isRequestFeature = feature.includes('Не нашли товар')

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                    isRequestFeature
                      ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
                      : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isRequestFeature ? 'text-orange-500' : 'text-green-500'
                  }`} />
                  <span className={`text-sm ${isRequestFeature ? 'text-orange-400 font-semibold' : 'text-gray-300'}`}>
                    {feature}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Footer - ТЕМНАЯ ТЕМА */}
        <div className="p-6 border-t border-white/10 bg-zinc-900/50">
          <div className="flex gap-3">
            <Link href="/dashboard/catalog" className="flex-1">
              <Button className={`w-full bg-gradient-to-r ${content.color} hover:opacity-90 text-white h-12`}>
                Попробовать сейчас
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <button
              onClick={onClose}
              className="h-12 px-6 border border-white/20 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white rounded-md font-medium transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
