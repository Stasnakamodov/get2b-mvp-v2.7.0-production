import type { Benefit } from '@/types/landing'
import {
  ShoppingCart,
  Shield,
  FileText,
  BarChart,
  MessageCircle,
  Zap,
} from 'lucide-react'

/**
 * Преимущества платформы Get2B
 */
export const benefits: Benefit[] = [
  {
    icon: ShoppingCart,
    title: 'Каталог поставщиков',
    description: '10,000+ проверенных товаров из Китая с актуальными ценами',
  },
  {
    icon: Shield,
    title: 'Легальные переводы',
    description: 'Работаем по агентскому договору — ваш банк не заблокирует',
  },
  {
    icon: FileText,
    title: 'Документы для таможни',
    description: 'Готовим контракты, инвойсы, декларации — под ключ',
  },
  {
    icon: BarChart,
    title: 'CRM система',
    description: 'Управляйте всеми закупками онлайн, история сделок',
  },
  {
    icon: MessageCircle,
    title: 'Telegram менеджер',
    description: 'Персональная поддержка 24/7, уведомления на каждом этапе',
  },
  {
    icon: Zap,
    title: 'Быстрые переводы',
    description: 'Банк 1-3 дня • P2P 1 час • Крипта 30 минут',
  },
]
