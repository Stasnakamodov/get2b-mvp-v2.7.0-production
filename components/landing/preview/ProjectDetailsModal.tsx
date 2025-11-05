"use client"

import { motion } from "framer-motion"
import { X, FileText, CheckCircle, Building2, DollarSign, FileCheck, ArrowRightLeft, Truck, Clock, Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Project } from "@/types/landing"

interface ProjectDetailsModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
}

// 7 шагов проекта с иконками
const projectSteps = [
  {
    id: 1,
    title: "Данные клиента",
    description: "Карточка компании",
    icon: Building2,
    documentType: "Карточка компании сохранена",
    hasExample: false
  },
  {
    id: 2,
    title: "Спецификация",
    description: "Товары и услуги",
    icon: FileText,
    documentType: "Спецификация сформирована",
    hasExample: false
  },
  {
    id: 3,
    title: "Пополнение",
    description: "Оплата агенту",
    icon: DollarSign,
    documentType: "Чек оплаты сохранён",
    hasExample: true,
    exampleUrl: "/examples/payment-receipt-example.pdf"
  },
  {
    id: 4,
    title: "Метод",
    description: "Способ оплаты",
    icon: FileCheck,
    documentType: "Метод выбран и сохранён",
    hasExample: false
  },
  {
    id: 5,
    title: "Реквизиты",
    description: "Банковские данные",
    icon: ArrowRightLeft,
    documentType: "Реквизиты сохранены",
    hasExample: false
  },
  {
    id: 6,
    title: "Получение",
    description: "Отправка средств",
    icon: Truck,
    documentType: "Чек отправки сохранён",
    hasExample: true,
    exampleUrl: "/examples/transfer-receipt-example.pdf"
  },
  {
    id: 7,
    title: "Подтверждение",
    description: "Завершение сделки",
    icon: CheckCircle,
    documentType: "Подтверждение получено",
    hasExample: true,
    exampleUrl: "/examples/confirmation-example.pdf"
  },
]

export function ProjectDetailsModal({ isOpen, project, onClose }: ProjectDetailsModalProps) {
  if (!isOpen || !project) return null

  const currentStep = project.current_step || 1

  return (
    // ТЕМНАЯ ТЕМА: overlay + centered modal
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 rounded-lg max-w-5xl w-full max-h-[85vh] overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">{project.name}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {project.company_data?.name} • {project.amount?.toLocaleString()} {project.currency} • Шаг {currentStep} из 7
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-6 pb-4">
          <div className="relative">
            {/* Background line */}
            <div className="absolute top-7 left-0 right-0 h-1 bg-gray-700 rounded-full" />
            {/* Progress line */}
            <div
              className="absolute top-7 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / 6) * 100}%`
              }}
            />
            {/* Steps */}
            <div className="relative flex justify-between">
              {projectSteps.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = step.id <= currentStep
                const isCurrent = step.id === currentStep

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05, type: "spring" }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all ${
                        isCompleted
                          ? `bg-blue-600 border-blue-600 ${isCurrent ? 'ring-4 ring-blue-400/30' : ''}`
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    >
                      <StepIcon className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </motion.div>
                    <p className={`text-xs mt-2 text-center max-w-[80px] ${
                      isCompleted ? 'text-white font-medium' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content - 7 кубиков документов */}
        <div className="px-6 pb-6 max-h-[45vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Документы проекта</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projectSteps.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = step.id <= currentStep
              const isCurrent = step.id === currentStep

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border transition-all ${
                    isCompleted
                      ? isCurrent
                        ? 'bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20'
                        : 'bg-green-500/10 border-green-500/30'
                      : 'bg-zinc-800/50 border-white/10'
                  }`}
                >
                  {/* Иконка и статус */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${
                      isCompleted
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gray-700'
                    }`}>
                      <StepIcon className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    {isCompleted ? (
                      <CheckCircle className={`w-5 h-5 ${isCurrent ? 'text-blue-400' : 'text-green-400'}`} />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-500" />
                    )}
                  </div>

                  {/* Информация */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400">Шаг {step.id}</span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                          Текущий
                        </span>
                      )}
                    </div>
                    <h4 className={`font-semibold mb-1 ${isCompleted ? 'text-white' : 'text-gray-400'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{step.description}</p>

                    {/* Статус документа */}
                    <div className={`text-xs p-2 rounded mb-2 ${
                      isCompleted
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700/50 text-gray-500'
                    }`}>
                      <FileText className="w-3 h-3 inline mr-1" />
                      {isCompleted ? step.documentType : 'Ожидает выполнения'}
                    </div>

                    {/* Кнопка скачать пример (только для шагов с документами) */}
                    {step.hasExample && (
                      <button
                        onClick={() => {
                          // В реальности здесь будет скачивание файла
                          window.open(step.exampleUrl, '_blank')
                        }}
                        className="w-full text-xs px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded transition-all flex items-center justify-center gap-2 text-gray-300 hover:text-white"
                      >
                        <Download className="w-3 h-3" />
                        Скачать пример
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Пояснение преимущества */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-semibold mb-1">Автоматическое сохранение на каждом шаге</h4>
                <p className="text-sm text-gray-400">
                  Все документы и данные автоматически сохраняются на каждом этапе.
                  Вы можете вернуться к любому шагу и продолжить работу с сохранёнными данными.
                </p>
              </div>
            </div>
          </motion.div>
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
            <div className="flex-1 relative group">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12">
                Начать свой проект
              </Button>
              {/* Тултип */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs rounded-lg p-3 shadow-xl border border-white/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-300" />
                    <div>
                      <div className="font-semibold mb-1">Работайте в удобном темпе</div>
                      <div className="text-white/90">
                        Проходите все этапы проекта когда удобно — закрывайте и возвращайтесь в любое время.
                        Мы уведомим вас, когда начнётся новый этап или потребуется ваше участие.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
