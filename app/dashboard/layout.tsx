"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { FileText, BarChart3, MessageSquare, User, Menu, X, Home, BookOpen, PlusCircle, Package, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import ThemeToggle from "@/components/theme-toggle"
import { ProfileGuard } from "@/components/profile-guard"
import { CartProvider, useCart } from "@/src/features/cart-management"

// Floating Cart Badge - отдельный компонент внутри CartProvider
function FloatingCartBadge() {
  const { cart, getTotalItems } = useCart()
  const pathname = usePathname()

  // Показываем только на страницах каталога
  const showOnPages = ['/dashboard/catalog']
  const shouldShow = showOnPages.some(page => pathname?.startsWith(page))

  if (!shouldShow || getTotalItems() === 0) return null

  return (
    <Link href="/dashboard/catalog">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-green-600 transition-all cursor-pointer"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="font-semibold">{getTotalItems()}</span>
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {getTotalItems()}
        </span>
      </motion.div>
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCatalogPage = pathname?.startsWith('/dashboard/catalog') ?? false
  const isDocumentationPage = pathname?.startsWith('/dashboard/documentation') ?? false
  const shouldCollapse = isCatalogPage || isDocumentationPage
  const [isSidebarOpen, setIsSidebarOpen] = useState(!shouldCollapse)

  // Автоматически скрываем/показываем сайдбар при переходе на/из каталога/документации
  React.useEffect(() => {
    setIsSidebarOpen(!shouldCollapse)
  }, [shouldCollapse])

  // Navigation items в нужном порядке
  const navItems = [
    {
      title: "Главная",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Каталог Get2B",
      href: "/dashboard/catalog",
      icon: Package,
    },
    {
      title: "Создать проект",
      href: "/dashboard/create-project",
      icon: PlusCircle,
    },
    {
      title: "Ваши сделки",
      href: "/dashboard/active-projects",
      icon: BarChart3,
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
    <CartProvider>
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
        className={`fixed top-0 left-0 h-full w-64 bg-card dark:bg-zinc-900/80 dark:backdrop-blur-xl border-r border-border shadow-lg z-40 transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
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
                            ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            : "text-foreground hover:bg-muted"
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
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Иван Петров</p>
                  <p className="text-xs text-muted-foreground">ООО "ТехноИмпорт"</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 pt-4 ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}`}>
        <main className="max-w-[1400px] mx-auto px-6 py-4">{children}</main>
      </div>

      {/* Floating Cart Badge */}
      <FloatingCartBadge />
    </div>
    </CartProvider>
    </ProfileGuard>
  )
}
