import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

/**
 * Header компонент для landing page
 * Прозрачный header с навигацией и CTA кнопками
 */
export function Header() {
  return (
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
  )
}
