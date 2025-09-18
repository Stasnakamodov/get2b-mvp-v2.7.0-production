"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { FileText, BarChart3, MessageSquare, User, Menu, X, Home, BookOpen, PlusCircle, Package, History, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import ThemeToggle from "@/components/theme-toggle"
import { ProfileGuard } from "@/components/profile-guard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // По умолчанию открыт
  const pathname = usePathname()

  // Navigation items в нужном порядке
  const navItems = [
    {
      title: "Главная",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Ваши сделки",
      href: "/dashboard/active-projects",
      icon: BarChart3,
    },
    {
      title: "История",
      href: "/dashboard/history",
      icon: History,
    },
    {
      title: "Создать проект",
      href: "/dashboard/create-project",
      icon: PlusCircle,
    },
    {
      title: "Каталог Get2B",
      href: "/dashboard/catalog",
      icon: Package,
    },
    {
      title: "Конструктор проектов",
      href: "/dashboard/project-constructor",
      icon: FileText,
    },
    {
      title: "ЧатХаб",
      href: "/dashboard/ai-chat",
      icon: MessageSquare,
    },
    {
      title: "Профиль",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      title: "Документация",
      href: "/dashboard/documentation",
      icon: BookOpen,
    },
  ]

  return (
    <ProfileGuard>
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-card shadow-md"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar Toggle */}
      <div className="hidden md:block">
        <Button
          variant="outline"
          size="icon"
          className={`fixed top-4 z-50 h-8 w-8 bg-card border border-border shadow-md hover:bg-accent hover:text-accent-foreground transition-all duration-300 ${
            isSidebarOpen ? 'left-60' : 'left-4'
          }`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar Overlay для мобилки */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-card shadow-lg z-40 transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Logo />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <li key={item.href}>
                    <Link href={item.href} passHref>
                      <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-indicator"
                            className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                          />
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Иван Петров</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ООО "ТехноИмпорт"</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 pt-4 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
        <main className="max-w-screen-2xl mx-auto px-4 py-2">{children}</main>
      </div>
    </div>
    </ProfileGuard>
  )
}
