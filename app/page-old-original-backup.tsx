"use client"

import React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  CheckCircle,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { Slider } from "@/components/slider"

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false)
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null)

  const benefits = [
    "Экономия до 30% на международных платежах",
    "Проверенные поставщики из Китая",
    "Полное юридическое сопровождение сделок",
    "Подготовка всех необходимых документов",
    "Аналитика и отчетность в реальном времени",
    "Персональный менеджер для каждого клиента",
  ]

  const faqItems = [
    {
      question: "Как работает платформа Get2B?",
      answer:
        "Get2B выступает в качестве посредника между вашей компанией и китайскими поставщиками. Мы обеспечиваем безопасные международные платежи, проверяем надежность поставщиков и предоставляем все необходимые юридические документы для легального оформления сделок.",
    },
    {
      question: "Какие документы вы помогаете оформить?",
      answer:
        "Мы помогаем подготовить полный пакет документов, включая внешнеторговые контракты, инвойсы, спецификации, таможенные декларации и другие заградительные бумаги, необходимые для легального проведения международных сделок.",
    },
    {
      question: "Какие валюты поддерживаются для платежей?",
      answer:
        "Наша платформа поддерживает платежи в различных валютах, включая рубли (RUB), доллары США (USD), евро (EUR) и китайские юани (CNY). Мы предлагаем выгодные курсы обмена и минимальные комиссии.",
    },
    {
      question: "Как проверяются поставщики?",
      answer:
        "Мы проводим комплексную проверку поставщиков, включая анализ юридических документов, истории деятельности, репутации на рынке и отзывов других клиентов. Это позволяет минимизировать риски при работе с новыми партнерами.",
    },
    {
      question: "Сколько времени занимает проведение платежа?",
      answer:
        "Стандартное время проведения платежа составляет от 1 до 3 рабочих дней. В некоторых случаях, при наличии всех необходимых документов и прохождении всех проверок, платеж может быть проведен в течение 24 часов.",
    },
  ]

  const documents = [
    {
      title: "Внешнеторговый контракт",
      description: "Образец типового внешнеторгового контракта с китайским поставщиком",
      format: "PDF",
      size: "245 KB",
    },
    {
      title: "Инвойс",
      description: "Шаблон инвойса для международных платежей",
      format: "DOCX",
      size: "125 KB",
    },
    {
      title: "Спецификация товаров",
      description: "Форма для детального описания заказываемых товаров",
      format: "XLSX",
      size: "78 KB",
    },
    {
      title: "Таможенная декларация",
      description: "Образец заполнения таможенной декларации",
      format: "PDF",
      size: "320 KB",
    },
  ]

  const toggleFaqItem = (index: number) => {
    if (openFaqItem === index) {
      setOpenFaqItem(null)
    } else {
      setOpenFaqItem(index)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Статичные линии фона - удалены для исправления билда */}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Logo />

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex">
            <ul className="flex space-x-8">
              <li>
                <a
                  href="#main-section"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Международные платежи
                </a>
              </li>
              <li>
                <a
                  href="#features-section"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Наши преимущества
                </a>
              </li>
              <li>
                <a
                  href="#documents-section"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Образцы документов
                </a>
              </li>
              <li>
                <a
                  href="#faq-section"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Часто задаваемые вопросы
                </a>
              </li>
            </ul>
          </nav>

          <ThemeToggle />

          <Link href="/login">
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              Зайти в личный кабинет
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 pt-20 md:pt-32" id="main-section">
        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          <div className="space-y-10">
            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold leading-tight"
              >
                Международные <br />
                оплаты <br />
                <span className="text-blue-500">Китайским</span> <br />
                <span className="text-orange-500">поставщикам</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                  Get2B – профессиональный B2B-дропшиппер и платежный агент для работы с китайскими поставщиками. Мы
                  помогаем компаниям эффективно вести международный бизнес.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/background-demo">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <button className="relative flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full text-white font-medium text-lg">
                    Запустить приложение
                    <ExternalLink className="h-5 w-5" />
                  </button>
                </div>
              </Link>
              <Link href="/dashboard/ai-chat">
                <Button
                  variant="outline"
                  className="rounded-full border-orange-500/50 hover:border-orange-500 px-8 py-6 text-lg font-medium text-orange-500 hover:text-orange-400"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Связаться с ассистентом
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-3"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden lg:block h-[500px]"
          >
            <Slider />
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-6 md:px-12 py-24" id="features-section">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-16 text-center"
          >
            Наши <span className="text-blue-500">преимущества</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/aitubo.jpg-LuKVaVe99ZfXRb9mQZhzEoung9fqgh.jpeg"
                  alt="Международные платежи"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Безопасные платежи</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Защищенные международные транзакции с минимальными комиссиями и оптимальными курсами обмена.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cafda8dd-26e2-412c-ba4d-e372c86d1cfe%20%281%29-tYnTIkAuBPAgVWNka6PH18Wp4fNQPz.png"
                  alt="Работа с поставщиками"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Проверенные поставщики</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Тщательный отбор и проверка надежности китайских производителей и поставщиков.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-blue-600 to-orange-500"></div>
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/977e59c3-8df7-43fd-81b7-c3c19cab8691%20%281%29-3Q2HfXFuSFd4vvit7ECClcjQR8Jik7.png"
                  alt="Легальное оформление"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Легальное оформление</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Подготовка всех необходимых документов и заградительных бумаг для международных сделок.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="relative z-10 px-6 md:px-12 py-16" id="documents-section">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-12 text-center"
          >
            Образцы <span className="text-blue-500">документов</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {documents.map((doc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                      {doc.format}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">{doc.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{doc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{doc.size}</span>
                    <button className="flex items-center gap-1 text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                      <Download className="h-4 w-4" />
                      <span>Скачать</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 md:px-12 py-16" id="faq-section">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-12 text-center"
          >
            Часто задаваемые <span className="text-orange-500">вопросы</span>
          </motion.h2>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaqItem(index)}
                  className="flex items-center justify-between w-full p-6 text-left"
                >
                  <h3 className="text-lg font-medium">{item.question}</h3>
                  {openFaqItem === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {openFaqItem === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Готовы начать работу с Get2B?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Зарегистрируйтесь сейчас и получите доступ к полному функционалу платформы. Наши специалисты помогут вам
              на каждом этапе работы.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/background-demo">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <button className="relative flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full text-white font-medium text-lg">
                    Запустить приложение
                    <ExternalLink className="h-5 w-5" />
                  </button>
                </div>
              </Link>
              <Link href="/who-we-are">
                <Button
                  variant="outline"
                  className="rounded-full border-gray-500 hover:border-gray-900 dark:hover:border-white px-8 py-6 text-lg font-medium"
                >
                  Узнать больше
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pt-32 pb-16 overflow-hidden">
        {/* Background lines удалены для исправления билда */}

        <div className="relative z-10 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-5xl font-bold mb-2">
              <span className="text-gray-900 dark:text-white">Get</span>
              <span className="text-orange-500">2B</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-12">
            <div>
              <h3 className="text-lg font-medium mb-4">Компания</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    О нас
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Команда
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Карьера
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Контакты
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Услуги</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Международные платежи
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Работа с поставщиками
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Юридическое сопровождение
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Аналитика
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Ресурсы</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Блог
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Документация
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Руководства
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Вебинары
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Поддержка</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Помощь
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Связаться с нами
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Статус системы
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-4 md:mb-0">
                © {new Date().getFullYear()} Get2B. Все права защищены.
              </div>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Условия использования
                </a>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Политика конфиденциальности
                </a>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Правовая информация
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
