"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ShoppingCart,
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart,
  Package,
  CreditCard,
  Mail,
  Plus,
  ChevronRight,
  Building2,
  DollarSign,
  FileCheck,
  ArrowRightLeft,
  Truck,
  Camera,
  Globe,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { supabase } from "@/lib/supabaseClient"

// Типы для проектов
interface Project {
  id: string
  name: string
  company_data?: {
    name: string
    legalName?: string
    inn?: string
    kpp?: string
    ogrn?: string
    email?: string
  }
  amount: number
  currency?: string
  created_at: string
  status: string
  current_step: number
  max_step_reached?: number
  receipts?: string
  user_id: string
}

// Этапы проекта (для timeline)
const projectSteps = [
  { id: 1, title: "Данные клиента", description: "Выбор карточки", icon: Building2 },
  { id: 2, title: "Спецификация", description: "Создание заявки", icon: FileText },
  { id: 3, title: "Пополнение агента", description: "Пополнение счета", icon: DollarSign },
  { id: 4, title: "Метод", description: "Выбор метода", icon: FileCheck },
  { id: 5, title: "Реквизиты", description: "Банковские реквизиты", icon: ArrowRightLeft },
  { id: 6, title: "Получение", description: "Получение средств", icon: Truck },
  { id: 7, title: "Подтверждение", description: "Завершение операции", icon: CheckCircle },
]

// Вспомогательная функция для римских цифр
function toRoman(num: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  return romans[num - 1] || String(num)
}

// Функция для получения корректного шага
function getCorrectStepForCard(project: Project) {
  if (project.current_step) return project.current_step
  return 1
}

// Функция для получения статуса проекта
function getProjectStatusLabel(step: number, status: string, receipts?: string) {
  let color = '#6b7280'
  let text = 'В работе'
  let Icon = FileText

  if ((status === 'completed' || step === 7) && status !== 'waiting_client_confirmation') {
    color = '#22c55e'; text = 'Завершён'; Icon = CheckCircle
  } else if (status === 'waiting_client_confirmation' && step === 7) {
    color = '#3b82f6'; text = 'Ожидание подтверждающего документа'; Icon = CheckCircle
  } else if (step === 3) {
    if (status === 'waiting_receipt') {
      color = '#3b82f6'; text = 'Ожидаем загрузки чека'; Icon = DollarSign
    } else if (status === 'receipt_rejected') {
      color = '#ef4444'; text = 'Чек отклонён'; Icon = FileText
    } else if (status === 'receipt_approved') {
      color = '#22c55e'; text = 'Чек одобрен'; Icon = CheckCircle
    }
  } else if (status === 'waiting_approval') {
    color = '#3b82f6'; text = 'Ожидание одобрения'; Icon = CheckCircle
  } else if (status === 'rejected') {
    color = '#ef4444'; text = 'Отклонён'; Icon = FileText
  }
  return { color, text, Icon }
}

export default function LandingPage() {
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  // Mock проекты для preview (если реальных нет)
  const mockProjects: Project[] = [
    {
      id: 'mock-1',
      name: 'Закупка электроники',
      company_data: { name: 'ООО "ТехноПром"' },
      amount: 2400000,
      currency: '₽',
      created_at: '2025-01-15T10:00:00Z',
      status: 'in_work',
      current_step: 3,
      user_id: 'mock',
    },
    {
      id: 'mock-2',
      name: 'Партия смартфонов',
      company_data: { name: 'ИП Смирнов А.В.' },
      amount: 156000,
      currency: '¥',
      created_at: '2025-01-18T14:30:00Z',
      status: 'waiting_approval',
      current_step: 2,
      user_id: 'mock',
    },
    {
      id: 'mock-3',
      name: 'Оптовая закупка мебели',
      company_data: { name: 'ООО "Интерьер Плюс"' },
      amount: 890000,
      currency: '₽',
      created_at: '2025-01-10T09:15:00Z',
      status: 'completed',
      current_step: 7,
      user_id: 'mock',
    },
  ]

  // Mock шаблоны для preview
  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Закупка электроники',
      description: 'Стандартный шаблон для закупки электронных компонентов из Китая',
      role: 'client',
    },
    {
      id: 'template-2',
      name: 'Оптовая мебель',
      description: 'Шаблон для массовых закупок мебели и интерьерных решений',
      role: 'client',
    },
  ]

  // 7 шагов процесса (для секции процесса)
  const steps = [
    {
      number: "01",
      title: "Данные компании",
      description: "Заполните карточку один раз",
      time: "5 мин",
      icon: Users,
    },
    {
      number: "02",
      title: "Спецификация товаров",
      description: "Выберите из каталога или загрузите",
      time: "10 мин",
      icon: Package,
    },
    {
      number: "03",
      title: "Пополнение агента",
      description: "Переведите деньги на наш счёт",
      time: "1 день",
      icon: CreditCard,
    },
    {
      number: "04",
      title: "Метод оплаты",
      description: "Выберите как мы платим поставщику",
      time: "2 мин",
      icon: Zap,
    },
    {
      number: "05",
      title: "Реквизиты поставщика",
      description: "Укажите куда переводить",
      time: "5 мин",
      icon: FileText,
    },
    {
      number: "06",
      title: "Чек от менеджера",
      description: "Получите подтверждение оплаты",
      time: "1-3 дня",
      icon: CheckCircle,
    },
    {
      number: "07",
      title: "Готово",
      description: "Отслеживайте статус в CRM",
      time: "1 мин",
      icon: TrendingUp,
    },
  ]

  // Преимущества
  const benefits = [
    {
      icon: ShoppingCart,
      title: "Каталог поставщиков",
      description: "10,000+ проверенных товаров из Китая с актуальными ценами",
    },
    {
      icon: Shield,
      title: "Легальные переводы",
      description: "Работаем по агентскому договору — ваш банк не заблокирует",
    },
    {
      icon: FileText,
      title: "Документы для таможни",
      description: "Готовим контракты, инвойсы, декларации — под ключ",
    },
    {
      icon: BarChart,
      title: "CRM система",
      description: "Управляйте всеми закупками онлайн, история сделок",
    },
    {
      icon: MessageCircle,
      title: "Telegram менеджер",
      description: "Персональная поддержка 24/7, уведомления на каждом этапе",
    },
    {
      icon: Zap,
      title: "Быстрые переводы",
      description: "Банк 1-3 дня • P2P 1 час • Крипта 30 минут",
    },
  ]

  // FAQ
  const faqItems = [
    {
      question: "Сколько стоит ваша комиссия?",
      answer:
        "Комиссия зависит от объёма сделки и составляет от 2% до 5%. Точную стоимость рассчитаем после заполнения заявки. Никаких скрытых платежей.",
    },
    {
      question: "Как быстро деньги дойдут до поставщика?",
      answer:
        "Банковский перевод: 1-3 рабочих дня. P2P перевод: в течение 1 часа. Криптовалюта (USDT, BTC, ETH): 10-30 минут.",
    },
    {
      question: "Могу ли я добавить своего поставщика в каталог?",
      answer:
        "Да! Вы можете добавить любого поставщика из Китая. Мы проверим его документы, добавим в систему и поможем провести первую сделку.",
    },
    {
      question: "Что если товар не придёт или будет не того качества?",
      answer:
        "Мы работаем только с проверенными поставщиками с историей успешных поставок. Если возникнут проблемы — наши менеджеры помогут решить вопрос напрямую с поставщиком.",
    },
    {
      question: "Какие документы вы готовите?",
      answer:
        "Полный пакет: агентский договор, внешнеторговый контракт, инвойс, спецификация товаров, таможенная декларация и другие необходимые документы.",
    },
    {
      question: "Работаете ли вы с маркетплейсами (Ozon, Wildberries)?",
      answer:
        "Да, помогаем закупать товары для продажи на Ozon, Wildberries, Яндекс.Маркет и других площадках. Готовим все документы под требования маркетплейсов.",
    },
    {
      question: "Можно ли оплатить криптовалютой?",
      answer:
        "Да, поддерживаем USDT, BTC, ETH в различных сетях. Низкие комиссии, переводы за 10-30 минут. Конвертация по выгодному курсу.",
    },
    {
      question: "Как отследить статус заказа?",
      answer:
        "В CRM системе видите статус каждого проекта в реальном времени. Telegram уведомления о каждом изменении. Менеджер всегда на связи.",
    },
  ]

  const toggleFaqItem = (index: number) => {
    setOpenFaqItem(openFaqItem === index ? null : index)
  }

  // Загрузка реальных проектов из Supabase для dashboard preview
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!error && data) {
          setProjects(data)
        }
      } catch (err) {
        console.error("Ошибка загрузки проектов для лендинга:", err)
      }
    }

    fetchProjects()
  }, [])

  // Используем реальные проекты или mock для превью (мемоизируем чтобы избежать лишних перерендеров)
  const displayProjects = React.useMemo(() => {
    return projects.length > 0 ? projects : mockProjects
  }, [projects])

  // Реальная статистика из проектов (как в дашборде)
  const activeProjects = React.useMemo(() =>
    displayProjects.filter((p) => p.status !== "completed" && p.status !== "rejected").length
  , [displayProjects])

  const pendingProjects = React.useMemo(() =>
    displayProjects.filter((p) => ["waiting_approval", "waiting_receipt"].includes(p.status)).length
  , [displayProjects])

  const completedProjects = React.useMemo(() =>
    displayProjects.filter((p) => p.status === "completed").length
  , [displayProjects])

  const rejectedProjects = React.useMemo(() =>
    displayProjects.filter((p) => ["rejected", "receipt_rejected"].includes(p.status)).length
  , [displayProjects])

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* HEADER - Transparent for dark hero */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-8 md:px-16 py-6">
          <Logo />

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#catalog"
              className="text-sm font-light text-gray-300 hover:text-white transition-colors"
            >
              Каталог
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-light text-gray-300 hover:text-white transition-colors"
            >
              Как работает
            </a>
            <a
              href="#benefits"
              className="text-sm font-light text-gray-300 hover:text-white transition-colors"
            >
              Преимущества
            </a>
            <a
              href="#faq"
              className="text-sm font-light text-gray-300 hover:text-white transition-colors"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/catalog">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                Каталог
              </Button>
            </Link>
            <Link href="/dashboard/create-project">
              <Button size="sm" className="bg-white text-black hover:bg-gray-100 rounded-full">
                Создать закупку
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION - FLEAVA INSPIRED PREMIUM */}
      <section className="relative min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        {/* Gradient orbs - subtle, not pulsating */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]"></div>

        <div className="relative max-w-[1400px] mx-auto px-8 md:px-16 pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300 font-light">Платёжный агент нового поколения</span>
            </div>

            <h1 className="text-[64px] md:text-[96px] leading-[0.92] font-light tracking-tight text-white mb-8">
              Закупки из Китая{" "}
              <span className="block mt-2 font-normal bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                под ключ
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed font-light mb-12">
              Каталог 10,000+ товаров · Легальные переводы · Документы для таможни · CRM система
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <Link href="/dashboard/catalog">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base px-8 py-6 h-auto rounded-full font-normal">
                  Открыть каталог
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/create-project">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 text-base px-8 py-6 h-auto rounded-full font-light backdrop-blur-sm">
                  Создать закупку
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard preview with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="ml-4 flex-1 bg-white/5 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-500 font-light">get2b.ru/dashboard</span>
                </div>
              </div>

              {/* Dashboard content - РЕАЛЬНЫЙ DASHBOARD PREVIEW */}
              <div className="aspect-[16/10] bg-gradient-to-br from-zinc-900/90 to-black/90 p-6 overflow-y-auto">
                {/* Top Bar: Новый проект + Поиск (как в дашборде) */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white text-sm font-medium flex items-center gap-2 shadow-lg">
                    <Plus size={16} />
                    Новый проект
                  </div>
                  <div className="flex-1 relative">
                    <div className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Каталог Get2b"
                        className="w-full pl-10 pr-32 py-2 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
                        readOnly
                      />
                      {/* Кнопка глобуса - поиск по ссылке */}
                      <button
                        className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-md"
                        title="Поиск по ссылке из интернета"
                      >
                        <Globe className="w-4 h-4 text-white" />
                      </button>
                      {/* Кнопка камеры - поиск по изображению */}
                      <button
                        className="absolute right-11 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        title="Поиск по изображению"
                      >
                        <Camera className="w-4 h-4 text-blue-400" />
                      </button>
                      {/* Кнопка корзины */}
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        title="Корзина"
                      >
                        <div className="relative">
                          <ShoppingCart className="w-4 h-4 text-blue-400" />
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                            3
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Project Cards - показываем до 2 проектов */}
                <div className="space-y-3 mb-4">
                  {displayProjects.slice(0, 2).map((proj) => {
                    const step = getCorrectStepForCard(proj)
                    const { color, text, Icon } = getProjectStatusLabel(step, String(proj.status), proj.receipts)
                    return (
                      <div key={proj.id} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-xl">
                        {/* Project Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-base font-semibold text-white mb-1">
                              {proj.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {proj.company_data?.name || 'Компания не указана'} • {proj.amount?.toLocaleString('ru-RU') || '0'} {proj.currency || '₽'}
                            </div>
                          </div>
                          <div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '6px 12px', borderRadius: '16px', fontWeight: 'bold', color: '#fff', background: color, fontSize: 12
                            }}>
                              <Icon size={14} />
                              {text} • Шаг {step}
                            </span>
                          </div>
                        </div>

                        {/* 7-Step Timeline with Roman Numerals */}
                        <div className="relative my-4">
                          {/* Базовая линия */}
                          <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-gray-700 rounded-full" />
                          {/* Линия прогресса */}
                          <div
                            className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${((step - 1) / 6) * 100}%`
                            }}
                          />
                          {/* Кружки с римскими цифрами */}
                          <div className="relative flex justify-between">
                            {projectSteps.map((s, idx) => {
                              const isActive = idx + 1 <= step
                              return (
                                <div key={s.id} className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                    isActive
                                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                                      : 'bg-gray-700 border-gray-600 text-gray-400'
                                  }`}>
                                    {toRoman(idx + 1)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mt-3">
                          <div className="px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/20 transition-all">
                            <span className="text-sm text-gray-300">Подробнее</span>
                          </div>
                          <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all">
                            <span className="text-sm text-white font-medium">Следующий шаг</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Шаблоны проектов (как в дашборде - ПЕРЕД статистикой) */}
                <div className="mt-6 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-white">Шаблоны проектов</h3>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 bg-blue-500 rounded text-xs text-white">
                        Клиенты
                      </button>
                      <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-all">
                        <Plus size={12} className="inline mr-1" />
                        Создать
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {mockTemplates.map((template) => (
                      <div key={template.id} className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm hover:bg-white/10 transition-all h-full flex flex-col">
                        <h4 className="text-lg font-semibold text-white mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-400 mb-6 flex-grow">{template.description}</p>
                        <div className="flex justify-between gap-2">
                          <button className="px-3 py-1.5 border border-white/20 rounded text-sm text-white hover:border-white/40 transition-all">
                            Удалить
                          </button>
                          <button className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded text-sm text-white shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-1">
                            <Plus size={14} />
                            Создать проект
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Cards Row - 4 Cards (как в дашборде) */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Активные проекты */}
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                    <div className="text-3xl font-bold text-white">{activeProjects}</div>
                    <div className="text-sm text-blue-300 font-light mt-1">Активные</div>
                  </div>

                  {/* Ожидающие проекты */}
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                    <div className="text-3xl font-bold text-white">{pendingProjects}</div>
                    <div className="text-sm text-amber-300 font-light mt-1">Ожидают</div>
                  </div>

                  {/* Завершённые проекты */}
                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                    <div className="text-3xl font-bold text-white">{completedProjects}</div>
                    <div className="text-sm text-green-300 font-light mt-1">Завершены</div>
                  </div>

                  {/* Отклонённые проекты */}
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                    <div className="text-3xl font-bold text-white">{rejectedProjects}</div>
                    <div className="text-sm text-red-300 font-light mt-1">Отклонены</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-blue-600 rounded-xl p-3 border border-blue-400/20 shadow-2xl backdrop-blur-sm"
            >
              <div className="text-xs text-blue-100 mb-0.5 font-light">Новая заявка</div>
              <div className="text-sm text-white font-normal">₽2.4M · Электроника</div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-green-600 rounded-xl p-3 border border-green-400/20 shadow-2xl backdrop-blur-sm"
            >
              <div className="text-xs text-green-100 mb-0.5 font-light">Оплата прошла</div>
              <div className="text-sm text-white font-normal">Shenzhen Tech · ¥1.8M</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-gray-500"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* VALUE PROPOSITION - CLEAN & PREMIUM */}
      <section className="relative py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mb-20"
          >
            <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
              Мы — <span className="font-normal">платёжный агент</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
              Не просто CRM. Мы берём деньги от вас и переводим поставщику легально.
            </p>
          </motion.div>

          {/* Flow diagram - Clean version */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-zinc-50 border border-zinc-200 rounded-3xl p-12 md:p-16"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              {/* Your company */}
              <div className="text-center flex-1">
                <div className="w-24 h-24 bg-white border-2 border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
                <div className="text-base font-normal text-black">Ваша компания</div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <ArrowRight className="w-8 h-8 text-zinc-400" />
              </div>

              {/* Get2B Agent */}
              <div className="text-center flex-1">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <div className="text-base font-normal text-black mb-1">Get2B</div>
                <div className="text-sm text-gray-600 font-light">Платёжный агент</div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <ArrowRight className="w-8 h-8 text-zinc-400" />
              </div>

              {/* Supplier */}
              <div className="text-center flex-1">
                <div className="w-24 h-24 bg-white border-2 border-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Package className="w-12 h-12 text-orange-600" />
                </div>
                <div className="text-base font-normal text-black">Поставщик в Китае</div>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-4 gap-4 pt-8 border-t border-zinc-200">
              {[
                "Агентский договор",
                "Легальные переводы",
                "Все документы",
                "Защита от блокировок",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-light text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* КАТАЛОГ СЕКЦИЯ - DARK ACCENT */}
      <section id="catalog" className="relative py-32 bg-gradient-to-b from-zinc-900 to-black">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-[56px] md:text-[72px] leading-[0.95] font-light tracking-tight text-white mb-6">
                10,000+ товаров от проверенных{" "}
                <span className="font-normal bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">поставщиков</span>
              </h2>

              <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-light">
                Выбирайте товары из нашего каталога или добавляйте своих поставщиков. Все цены актуальны, все поставщики проверены.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { title: "Проверенные поставщики", desc: "Работаем только с надёжными партнёрами" },
                  { title: "Актуальные цены в юанях", desc: "Обновляем еженедельно" },
                  { title: "Электроника, Мебель, Одежда", desc: "И ещё 15+ категорий товаров" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-normal text-white mb-0.5">{item.title}</div>
                      <div className="text-sm text-gray-500 font-light">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/dashboard/catalog">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base px-8 py-6 h-auto rounded-full font-normal">
                  Открыть каталог
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl">
                {/* Catalog preview */}
                <div className="p-6 space-y-3">
                  {[
                    { cat: "Электроника", items: "2,347 товаров", color: "blue" },
                    { cat: "Мебель", items: "1,892 товара", color: "orange" },
                    { cat: "Одежда", items: "3,156 товаров", color: "purple" },
                    { cat: "Строительство", items: "1,423 товара", color: "green" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-xl flex items-center justify-center`}>
                          <ShoppingCart className={`w-6 h-6 text-${item.color}-400`} />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="text-base font-normal text-white mb-1">{item.cat}</div>
                      <div className="text-sm text-gray-500 font-light">{item.items}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7 ШАГОВ ПРОЦЕССА - MINIMAL GRID */}
      <section id="how-it-works" className="relative py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mb-16"
          >
            <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
              7 простых{" "}
              <span className="font-normal">шагов</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
              От заявки до получения. Весь процесс — онлайн.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl font-light text-zinc-300">{step.number}</div>
                    <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-zinc-700" />
                    </div>
                  </div>
                  <h3 className="text-base font-normal mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 font-light">{step.description}</p>
                  <div className="text-xs text-gray-500 font-light">⏱ {step.time}</div>
                </motion.div>
              )
            })}
          </div>

          <div className="text-center">
            <Link href="/dashboard/create-project">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white text-base px-8 py-6 h-auto rounded-full">
                Попробовать сейчас
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ПРЕИМУЩЕСТВА - BENTO GRID */}
      <section id="benefits" className="relative py-32 bg-zinc-50">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mb-16"
          >
            <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
              Почему{" "}
              <span className="font-normal">Get2B?</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
              Всё для закупок из Китая — в одной платформе
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 transition-all"
                >
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-zinc-700" />
                  </div>
                  <h3 className="text-base font-normal mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CRM & SUPPORT - COMBINED SECTION */}
      <section className="relative py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
              CRM система + <span className="font-normal">поддержка 24/7</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
              Управляйте закупками онлайн. Персональный менеджер для каждой сделки.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* CRM Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-normal mb-4">CRM Dashboard</h3>
              <div className="space-y-3">
                {[
                  "История всех сделок",
                  "Статусы в реальном времени",
                  "Шаблоны проектов",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-light text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" className="inline-block mt-6">
                <Button size="sm" className="bg-black text-white hover:bg-gray-800 rounded-full">
                  Попробовать CRM
                </Button>
              </Link>
            </motion.div>

            {/* Telegram Support */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-normal mb-4">Telegram менеджер</h3>
              <div className="space-y-3">
                {[
                  "Одобрение спецификаций",
                  "Загрузка чеков об оплате",
                  "Ответы в течение часа",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-light text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" className="bg-black text-white hover:bg-gray-800 rounded-full mt-6">
                <MessageCircle className="mr-2 h-4 w-4" />
                Написать
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ - CLEAN & MINIMAL */}
      <section id="faq" className="relative py-32 bg-zinc-50">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12"
            >
              <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight text-black mb-6">
                Частые{" "}
                <span className="font-normal">вопросы</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">Всё что вы хотели знать о Get2B</p>
            </motion.div>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-zinc-200 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaqItem(index)}
                    className="flex items-center justify-between w-full p-6 text-left hover:bg-zinc-50 transition-all"
                  >
                    <h3 className="text-base font-normal pr-4">{item.question}</h3>
                    {openFaqItem === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqItem === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="px-6 pb-6"
                    >
                      <p className="text-sm text-gray-600 font-light leading-relaxed">{item.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-base text-gray-600 mb-4 font-light">Не нашли ответ на вопрос?</p>
              <Button size="sm" className="bg-black hover:bg-gray-800 text-white rounded-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Написать в поддержку
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ФИНАЛЬНЫЙ CTA - DARK PREMIUM */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="max-w-[1400px] mx-auto px-8 md:px-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-light tracking-tight mb-6">
                Готовы начать{" "}
                <span className="font-normal bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                  закупки?
                </span>
              </h2>
              <p className="text-lg md:text-xl mb-12 text-gray-400 font-light leading-relaxed">
                Создайте первую заявку за 5 минут
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/dashboard/catalog">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100 text-base px-8 py-6 h-auto rounded-full font-normal"
                  >
                    Открыть каталог
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard/create-project">
                  <Button
                    size="lg"
                    className="bg-transparent border border-white/20 text-white hover:bg-white/5 text-base px-8 py-6 h-auto rounded-full font-light backdrop-blur-sm"
                  >
                    Создать закупку
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 font-light">
                {["Без скрытых комиссий", "Поддержка 24/7", "Первая сделка бесплатно"].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER - MINIMAL */}
      <footer className="py-16 bg-white border-t border-zinc-200">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="mb-4">
                <Logo />
              </div>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Платёжный агент для B2B закупок из Китая
              </p>
            </div>

            <div>
              <h3 className="text-sm font-normal mb-4">Компания</h3>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li><a href="#" className="hover:text-black transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Команда</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Контакты</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-normal mb-4">Услуги</h3>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li><a href="/dashboard/catalog" className="hover:text-black transition-colors">Каталог поставщиков</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Агентский договор</a></li>
                <li><a href="#" className="hover:text-black transition-colors">CRM система</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-normal mb-4">Поддержка</h3>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li><a href="#faq" className="hover:text-black transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Telegram</a></li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  <span className="text-xs">support@get2b.ru</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-light">
              <div>© {new Date().getFullYear()} Get2B. Все права защищены.</div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-black transition-colors">Условия использования</a>
                <a href="#" className="hover:text-black transition-colors">Политика конфиденциальности</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
