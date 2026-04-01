"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DocumentationTree } from "@/components/ui/DocumentationTree"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  BookOpen,
  Search,
  Home,
  Users,
  CreditCard,
  FileText,
  Bot,
  Info,
  Menu
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
    id: "about",
    title: "ℹ️ О платформе Get2B",
    type: "folder",
    icon: <Info className="w-4 h-4" />,
    children: [
      { id: "about-platform", title: "Кто мы и наша миссия", type: "page", href: "/dashboard/documentation/about/platform" },
      { id: "about-how-it-works", title: "Как работает Get2B", type: "page", href: "/dashboard/documentation/about/how-it-works" }
    ]
  },
  {
    id: "getting-started",
    title: "🚀 Начало работы",
    type: "folder",
    icon: <Home className="w-4 h-4" />,
    children: [
      { id: "registration", title: "Регистрация и создание аккаунта", type: "page", href: "/dashboard/documentation/getting-started/registration" },
      { id: "profile-setup", title: "Настройка профиля", type: "page", href: "/dashboard/documentation/getting-started/profile-setup" },
      { id: "first-project", title: "Создание первого проекта", type: "page", href: "/dashboard/documentation/getting-started/first-project" }
    ]
  },
  {
    id: "projects",
    title: "📋 Работа с проектами",
    type: "folder",
    icon: <FileText className="w-4 h-4" />,
    children: [
      { id: "project-steps", title: "Этапы проекта", type: "page", href: "/dashboard/documentation/projects/steps" },
      { id: "project-templates", title: "Шаблоны проектов", type: "page", href: "/dashboard/documentation/projects/templates" },
      { id: "project-tracking", title: "Отслеживание проектов", type: "page", href: "/dashboard/documentation/projects/tracking" }
    ]
  },
  {
    id: "catalog",
    title: "📦 Умный каталог поставщиков",
    type: "folder",
    icon: <Users className="w-4 h-4" />,
    children: [
      { id: "blue-room", title: "Синяя комната (личные поставщики)", type: "page", href: "/dashboard/documentation/catalog/blue-room" },
      { id: "get2b-catalog", title: "Каталог Get2B (аккредитованные)", type: "page", href: "/dashboard/documentation/catalog/get2b-catalog" },
      { id: "supplier-editing", title: "Редактирование поставщиков", type: "page", href: "/dashboard/documentation/catalog/supplier-editing" },
      { id: "logos-management", title: "Управление логотипами", type: "page", href: "/dashboard/documentation/catalog/logos-management" }
    ]
  },
  {
    id: "payments",
    title: "💳 Управление платежами",
    type: "folder",
    icon: <CreditCard className="w-4 h-4" />,
    children: [
      { id: "payment-methods", title: "Способы оплаты", type: "page", href: "/dashboard/documentation/payments/methods" },
      { id: "payment-tracking", title: "Отслеживание платежей", type: "page", href: "/dashboard/documentation/payments/tracking" },
      { id: "currency-rates", title: "Курсы валют", type: "page", href: "/dashboard/documentation/payments/currency-rates" }
    ]
  },
  {
    id: "ai-assistant",
    title: "🤖 ИИ-ассистент",
    type: "folder",
    icon: <Bot className="w-4 h-4" />,
    children: [
      { id: "ai-chat", title: "Чат с ИИ-ассистентом", type: "page", href: "/dashboard/documentation/ai-assistant/chat" },
      { id: "ai-commands", title: "Команды и возможности", type: "page", href: "/dashboard/documentation/ai-assistant/commands" }
    ]
  },
  {
    id: "telegram-bot",
    title: "📱 Telegram бот",
    type: "folder",
    icon: <Bot className="w-4 h-4" />,
    children: [
      { id: "bot-setup", title: "Настройка бота", type: "page", href: "/dashboard/documentation/telegram-bot/setup" },
      { id: "bot-commands", title: "Команды бота", type: "page", href: "/dashboard/documentation/telegram-bot/commands" }
    ]
  },
  {
    id: "ocr-features",
    title: "🔍 OCR и автозаполнение",
    type: "folder",
    icon: <Search className="w-4 h-4" />,
    children: [
      { id: "company-card-ocr", title: "OCR карточек компаний (Шаг 1)", type: "page", href: "/dashboard/documentation/ocr-features/company-card" },
      { id: "invoice-ocr", title: "OCR инвойсов (Шаг 2)", type: "page", href: "/dashboard/documentation/ocr-features/invoice" },
      { id: "supported-formats", title: "Поддерживаемые форматы", type: "page", href: "/dashboard/documentation/ocr-features/formats" }
    ]
  },
  {
    id: "faq",
    title: "❓ FAQ и поддержка",
    type: "folder",
    icon: <BookOpen className="w-4 h-4" />,
    children: [
      { id: "common-questions", title: "Часто задаваемые вопросы", type: "page", href: "/dashboard/documentation/faq/common-questions" },
      { id: "troubleshooting", title: "Решение проблем", type: "page", href: "/dashboard/documentation/faq/troubleshooting" },
      { id: "support", title: "Обращение в поддержку", type: "page", href: "/dashboard/documentation/faq/support" }
    ]
  }
]

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const isMainPage = pathname === "/dashboard/documentation"

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === "page" && node.href) {
      router.push(node.href)
      setIsSidebarOpen(false)
    }
  }

  // Filter tree based on search
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return documentationData
    const q = searchQuery.toLowerCase()
    return documentationData
      .map(folder => {
        const matchingChildren = folder.children?.filter(child =>
          child.title.toLowerCase().includes(q)
        )
        if (folder.title.toLowerCase().includes(q)) return folder
        if (matchingChildren && matchingChildren.length > 0) {
          return { ...folder, children: matchingChildren }
        }
        return null
      })
      .filter(Boolean) as TreeNode[]
  }, [searchQuery])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-white/5">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Документация
        </h2>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100 dark:border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        <DocumentationTree
          data={filteredData}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col">
      {/* Mobile: filter button */}
      <div className="md:hidden flex items-center gap-3 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center gap-2"
        >
          <Menu className="w-4 h-4" />
          Разделы
        </Button>
        {!isMainPage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/documentation")}
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Все разделы
          </Button>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[280px] shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-xl mr-5 overflow-hidden self-start sticky top-0 max-h-[calc(100vh-120px)]">
          {sidebarContent}
        </div>

        {/* Mobile sidebar sheet */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[280px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Навигация по документации</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
