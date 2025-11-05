import type { ProcessStep } from '@/types/landing'
import {
  Users,
  Package,
  CreditCard,
  Zap,
  FileText,
  CheckCircle,
  TrendingUp,
} from 'lucide-react'

/**
 * 7 шагов процесса закупки Get2B
 */
export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Данные компании',
    description: 'Заполните карточку один раз',
    time: '5 мин',
    icon: Users,
  },
  {
    number: '02',
    title: 'Спецификация товаров',
    description: 'Выберите из каталога или загрузите',
    time: '10 мин',
    icon: Package,
  },
  {
    number: '03',
    title: 'Пополнение агента',
    description: 'Переведите деньги на наш счёт',
    time: '1 день',
    icon: CreditCard,
  },
  {
    number: '04',
    title: 'Метод оплаты',
    description: 'Выберите как мы платим поставщику',
    time: '2 мин',
    icon: Zap,
  },
  {
    number: '05',
    title: 'Реквизиты поставщика',
    description: 'Укажите куда переводить',
    time: '5 мин',
    icon: FileText,
  },
  {
    number: '06',
    title: 'Чек от менеджера',
    description: 'Получите подтверждение оплаты',
    time: '1-3 дня',
    icon: CheckCircle,
  },
  {
    number: '07',
    title: 'Готово',
    description: 'Отслеживайте статус в CRM',
    time: '1 мин',
    icon: TrendingUp,
  },
]
