"use client"

import * as React from "react"
import { useState } from "react"
import { DocumentationTree } from "@/components/ui/DocumentationTree"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  Search, 
  Home, 
  Users, 
  CreditCard, 
  FileText, 
  Bot, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface TreeNode {
  id: string
  title: string
  type: "folder" | "page"
  children?: TreeNode[]
  href?: string
  icon?: React.ReactNode
}

const documentationData: TreeNode[] = [
  {
    id: "getting-started",
    title: "🚀 Начало работы",
    type: "folder",
    icon: <Home className="w-4 h-4" />,
    children: [
      {
        id: "registration",
        title: "Регистрация и создание аккаунта",
        type: "page",
        href: "/dashboard/documentation/getting-started/registration"
      },
      {
        id: "profile-setup",
        title: "Настройка профиля",
        type: "page",
        href: "/dashboard/documentation/getting-started/profile-setup"
      },
      {
        id: "first-project",
        title: "Создание первого проекта",
        type: "page",
        href: "/dashboard/documentation/getting-started/first-project"
      }
    ]
  },
  {
    id: "projects",
    title: "📋 Работа с проектами",
    type: "folder",
    icon: <FileText className="w-4 h-4" />,
    children: [
      {
        id: "project-steps",
        title: "Этапы проекта",
        type: "page",
        href: "/dashboard/documentation/projects/steps"
      },
      {
        id: "project-templates",
        title: "Шаблоны проектов",
        type: "page",
        href: "/dashboard/documentation/projects/templates"
      },
      {
        id: "project-tracking",
        title: "Отслеживание проектов",
        type: "page",
        href: "/dashboard/documentation/projects/tracking"
      }
    ]
  },
  {
    id: "catalog",
    title: "📦 Умный каталог поставщиков",
    type: "folder",
    icon: <Users className="w-4 h-4" />,
    children: [
      {
        id: "blue-room",
        title: "Синяя комната (личные поставщики)",
        type: "page",
        href: "/dashboard/documentation/catalog/blue-room"
      },
      {
        id: "get2b-catalog",
        title: "Каталог Get2B (аккредитованные)",
        type: "page",
        href: "/dashboard/documentation/catalog/get2b-catalog"
      },
      {
        id: "supplier-editing",
        title: "Редактирование поставщиков",
        type: "page",
        href: "/dashboard/documentation/catalog/supplier-editing"
      },
      {
        id: "logos-management",
        title: "Управление логотипами",
        type: "page",
        href: "/dashboard/documentation/catalog/logos-management"
      }
    ]
  },
  {
    id: "payments",
    title: "💳 Управление платежами",
    type: "folder",
    icon: <CreditCard className="w-4 h-4" />,
    children: [
      {
        id: "payment-methods",
        title: "Способы оплаты",
        type: "page",
        href: "/dashboard/documentation/payments/methods"
      },
      {
        id: "payment-tracking",
        title: "Отслеживание платежей",
        type: "page",
        href: "/dashboard/documentation/payments/tracking"
      },
      {
        id: "currency-rates",
        title: "Курсы валют",
        type: "page",
        href: "/dashboard/documentation/payments/currency-rates"
      }
    ]
  },
  {
    id: "ai-assistant",
    title: "🤖 ИИ-ассистент",
    type: "folder",
    icon: <Bot className="w-4 h-4" />,
    children: [
      {
        id: "ai-chat",
        title: "Чат с ИИ-ассистентом",
        type: "page",
        href: "/dashboard/documentation/ai-assistant/chat"
      },
      {
        id: "ai-commands",
        title: "Команды и возможности",
        type: "page",
        href: "/dashboard/documentation/ai-assistant/commands"
      }
    ]
  },
  {
    id: "telegram-bot",
    title: "📱 Telegram бот",
    type: "folder",
    icon: <Bot className="w-4 h-4" />,
    children: [
      {
        id: "bot-setup",
        title: "Настройка бота",
        type: "page",
        href: "/dashboard/documentation/telegram-bot/setup"
      },
      {
        id: "accreditation-management",
        title: "Управление аккредитацией",
        type: "page",
        href: "/dashboard/documentation/telegram-bot/accreditation"
      },
      {
        id: "bot-commands",
        title: "Команды бота",
        type: "page",
        href: "/dashboard/documentation/telegram-bot/commands"
      }
    ]
  },
  {
    id: "ocr-features",
    title: "🔍 OCR и автозаполнение",
    type: "folder",
    icon: <Search className="w-4 h-4" />,
    children: [
      {
        id: "company-card-ocr",
        title: "OCR карточек компаний (Шаг 1)",
        type: "page",
        href: "/dashboard/documentation/ocr-features/company-card"
      },
      {
        id: "invoice-ocr",
        title: "OCR инвойсов (Шаг 2)",
        type: "page",
        href: "/dashboard/documentation/ocr-features/invoice"
      },
      {
        id: "supported-formats",
        title: "Поддерживаемые форматы",
        type: "page",
        href: "/dashboard/documentation/ocr-features/formats"
      }
    ]
  },
  {
    id: "faq",
    title: "❓ FAQ и поддержка",
    type: "folder",
    icon: <BookOpen className="w-4 h-4" />,
    children: [
      {
        id: "common-questions",
        title: "Часто задаваемые вопросы",
        type: "page",
        href: "/dashboard/documentation/faq/common-questions"
      },
      {
        id: "troubleshooting",
        title: "Решение проблем",
        type: "page",
        href: "/dashboard/documentation/faq/troubleshooting"
      },
      {
        id: "support",
        title: "Обращение в поддержку",
        type: "page",
        href: "/dashboard/documentation/faq/support"
      }
    ]
  }
]

export default function DocumentationPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === "page" && node.href) {
      // Навигация к странице документации
      window.location.href = node.href
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Боковая панель */}
      <div className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-96"
      }`}>
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Документация
              </h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Поиск */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск в документации..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Дерево документации */}
        <div className="flex-1 overflow-y-auto p-2">
          {sidebarCollapsed ? (
            <div className="space-y-2">
              {documentationData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  title={item.title}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          ) : (
            <DocumentationTree
              data={documentationData}
              onNodeClick={handleNodeClick}
            />
          )}
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col">
        {/* Заголовок контента */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Документация Get2B
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Полное руководство по использованию платформы для международных платежей и управления поставками
            </p>
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl">
            {selectedNode ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedNode.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Контент для {selectedNode.title} будет загружен здесь...
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Приветствие */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      Добро пожаловать в документацию Get2B
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Здесь вы найдете подробные инструкции по использованию всех возможностей платформы Get2B. 
                      Выберите раздел в левой панели для начала изучения.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start">
                        <Home className="w-4 h-4 mr-2" />
                        Начать с основ
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Search className="w-4 h-4 mr-2" />
                        Поиск по документации
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Быстрые ссылки */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Каталог поставщиков
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Управление поставщиками, редактирование данных и загрузка логотипов
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        Создание проектов
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Пошаговое создание проектов с OCR и автозаполнением
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bot className="w-5 h-5 text-purple-600" />
                        Telegram бот
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Настройка и использование бота для управления аккредитацией
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-orange-600" />
                        OCR функции
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Автоматическое извлечение данных из документов
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-red-600" />
                        Платежи
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Управление международными платежами и отслеживание
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        FAQ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ответы на часто задаваемые вопросы и поддержка
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 