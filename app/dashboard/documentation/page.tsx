"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Search,
  Home,
  Users,
  CreditCard,
  FileText,
  Bot,
  Info
} from "lucide-react"

const quickLinks = [
  {
    title: "О платформе",
    description: "Кто мы, наша миссия и как работает Get2B",
    href: "/dashboard/documentation/about/platform",
    icon: Info,
    color: "text-indigo-600",
  },
  {
    title: "Начало работы",
    description: "Регистрация, настройка профиля и первый проект",
    href: "/dashboard/documentation/getting-started/registration",
    icon: Home,
    color: "text-emerald-600",
  },
  {
    title: "Каталог поставщиков",
    description: "Управление поставщиками, редактирование данных и логотипы",
    href: "/dashboard/documentation/catalog/blue-room",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Создание проектов",
    description: "Пошаговое создание проектов с OCR и автозаполнением",
    href: "/dashboard/documentation/projects/steps",
    icon: FileText,
    color: "text-green-600",
  },
  {
    title: "Telegram бот",
    description: "Настройка и использование бота для управления проектами",
    href: "/dashboard/documentation/telegram-bot/setup",
    icon: Bot,
    color: "text-purple-600",
  },
  {
    title: "OCR функции",
    description: "Автоматическое извлечение данных из документов",
    href: "/dashboard/documentation/ocr-features/company-card",
    icon: Search,
    color: "text-orange-600",
  },
  {
    title: "Платежи",
    description: "Управление международными платежами и отслеживание",
    href: "/dashboard/documentation/payments/methods",
    icon: CreditCard,
    color: "text-red-600",
  },
  {
    title: "FAQ",
    description: "Ответы на часто задаваемые вопросы и поддержка",
    href: "/dashboard/documentation/faq/common-questions",
    icon: BookOpen,
    color: "text-indigo-600",
  },
]

export default function DocumentationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Документация Get2B
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Полное руководство по использованию платформы для международных платежей и управления поставками
        </p>
      </div>

      {/* Welcome card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Добро пожаловать в документацию Get2B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Здесь вы найдете подробные инструкции по использованию всех возможностей платформы Get2B.
            Выберите раздел в левой панели или кликните на карточку ниже для начала изучения.
          </p>
        </CardContent>
      </Card>

      {/* Quick links grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${link.color}`} />
                    {link.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
