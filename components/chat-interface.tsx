"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, ThumbsUp, ThumbsDown, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Message {
  role: "agent" | "user"
  content: string
  timestamp: string
}

export default function ChatInterface() {
  const [input, setInput] = useState("")
  const [messages] = useState<Message[]>([
    {
      role: "agent",
      content: "Здравствуйте! Я виртуальный ассистент Get2B. Чем могу помочь вам сегодня?",
      timestamp: "4:08:28 PM",
    },
    {
      role: "user",
      content: "Здравствуйте, расскажите о ваших услугах для работы с китайскими поставщиками.",
      timestamp: "4:08:37 PM",
    },
    {
      role: "agent",
      content:
        "С удовольствием расскажу о наших услугах!\n\nGet2B предлагает комплексное решение для работы с китайскими поставщиками:\n\n1. Переговоры с китайскими поставщиками - мы обсуждаем выгодные условия сотрудничества и оптимальные условия приобретения продукции.\n\n2. Анализ благонадежности поставщиков - проводим проверку статуса и надежности партнеров для минимизации рисков.\n\n3. Оперативная закупка и логистика - организуем быструю закупку и отправку товара.\n\n4. Контроль качества - проверяем продукцию перед отправкой.\n\n5. Обработка платежей - обеспечиваем удобные и безопасные финансовые операции.\n\nЧто именно вас интересует из этих услуг?",
      timestamp: "4:09:15 PM",
    },
    {
      role: "user",
      content: "Расскажите подробнее о контроле качества продукции.",
      timestamp: "4:10:05 PM",
    },
    {
      role: "agent",
      content:
        "Конечно! Наш контроль качества включает несколько важных этапов:\n\n1. Предварительная проверка - мы анализируем спецификации продукции и требования к качеству перед размещением заказа.\n\n2. Инспекция на производстве - наши специалисты посещают фабрики для проверки производственного процесса и соответствия продукции заявленным стандартам.\n\n3. Выборочный контроль - проводим выборочную проверку готовой продукции перед отгрузкой.\n\n4. Тестирование - при необходимости организуем лабораторные испытания для подтверждения качества и безопасности товаров.\n\n5. Фотоотчеты - предоставляем детальные фотоотчеты о состоянии товара перед отправкой.\n\nТакой комплексный подход позволяет минимизировать риски получения некачественной продукции и обеспечивает соответствие товаров заявленным характеристикам.",
      timestamp: "4:11:30 PM",
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn("flex gap-2 max-w-[80%]", message.role === "user" && "ml-auto")}
            >
              {message.role === "agent" && <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0" />}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{message.role === "agent" ? "Get2B Ассистент" : "Вы"}</span>
                  <span className="text-sm text-muted-foreground">{message.timestamp}</span>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "agent" ? "bg-muted/50 dark:bg-muted/30" : "bg-primary/10 dark:bg-primary/20"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "agent" && (
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 transition-colors duration-300"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 transition-colors duration-300"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 transition-colors duration-300"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 transition-colors duration-300"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-none border-t bg-white/50 backdrop-blur-sm p-4 dark:bg-gray-800/50">
        <div className="flex gap-2">
          <Textarea
            placeholder="Введите ваше сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[44px] max-h-32 bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all duration-300"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300">
              <Send className="h-4 w-4 mr-2" />
              Отправить
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
