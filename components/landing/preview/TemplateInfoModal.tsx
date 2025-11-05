"use client"

import { motion } from "framer-motion"
import { X, Sparkles, Plus, Trash2, Edit, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TemplateInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TemplateInfoModal({ isOpen, onClose }: TemplateInfoModalProps) {
  if (!isOpen) return null

  const features = [
    {
      icon: Plus,
      title: "Создавайте шаблоны",
      description: "Сохраняйте данные компаний, реквизиты и настройки один раз"
    },
    {
      icon: Edit,
      title: "Редактируйте легко",
      description: "Изменяйте шаблоны в любой момент - все проекты обновятся автоматически"
    },
    {
      icon: Trash2,
      title: "Удаляйте ненужное",
      description: "Очищайте список от устаревших шаблонов одним кликом"
    },
    {
      icon: Zap,
      title: "Автоматическое заполнение",
      description: "Новые сделки заполняются данными из шаблона - экономия времени до 90%"
    }
  ]

  return (
    // ТЕМНАЯ ТЕМА: overlay + centered modal
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Система шаблонов</h2>
                <p className="text-sm text-gray-400 mt-0.5">Автоматизируйте повторяющиеся сделки</p>
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

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Главное преимущество */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold mb-1">Работайте с постоянными клиентами эффективно</h3>
                <p className="text-sm text-gray-400">
                  Создайте шаблон для каждого клиента - все данные компании, реквизиты и настройки сохранятся.
                  При новой сделке просто выберите шаблон и все поля заполнятся автоматически!
                </p>
              </div>
            </div>
          </div>

          {/* Возможности */}
          <h3 className="text-lg font-semibold text-white mb-4">Возможности системы:</h3>
          <div className="space-y-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Пример использования */}
          <div className="mt-6 p-4 bg-zinc-800/50 border border-white/10 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Пример использования
            </h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">1.</span>
                <span>Создаёте шаблон для клиента "ООО ТехноПром" с его реквизитами</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">2.</span>
                <span>При новой сделке выбираете шаблон "ООО ТехноПром"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">3.</span>
                <span>Все данные заполняются автоматически - остаётся только выбрать товары!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-zinc-900/50">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="border-white/20 hover:border-white/30 text-white hover:bg-white/10 bg-transparent border h-12 px-6"
            >
              Закрыть
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12">
              Попробовать бесплатно
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
