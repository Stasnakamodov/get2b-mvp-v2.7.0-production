import React from 'react'
import { Mail } from 'lucide-react'
import { Logo } from '@/components/Logo'

/**
 * Footer компонент для landing page
 * Минималистичный footer с навигацией и контактами
 */
export function Footer() {
  return (
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
  )
}
