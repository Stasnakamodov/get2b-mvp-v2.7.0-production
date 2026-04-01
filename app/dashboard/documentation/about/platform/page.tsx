import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  Shield,
  Target,
  Users,
  CreditCard,
  FileText,
  Search,
  Headphones,
  CheckCircle,
  ArrowRight,
  Zap,
  Building2,
  HandCoins,
  Scale,
  Star,
  Clock
} from "lucide-react"

export default function PlatformPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              О платформе Get2B
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Сервисный агент нового поколения для международной торговли
            </p>
          </div>
        </div>
      </div>

      {/* Кто мы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Кто мы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get2B — это платёжный агент и сервисная платформа, которая упрощает закупки
            у китайских поставщиков для российского бизнеса. Мы берём на себя всю сложность
            международных платежей, документооборота и взаимодействия с поставщиками,
            позволяя вам сосредоточиться на развитии своего дела.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Наша миссия
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Делаем международную торговлю проще, безопаснее и доступнее
                  для бизнеса любого масштаба — от начинающих предпринимателей
                  до крупных дистрибьюторов.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Какие проблемы решаем */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Какие проблемы мы решаем
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Сложности с платежами</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Прямые банковские переводы в Китай затруднены или невозможны. Мы предоставляем
                  легальные каналы оплаты.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <FileText className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Бремя документации</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Таможенные документы, валютный контроль, отчётность — мы берём это на себя.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <Search className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Поиск поставщиков</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Сложно найти проверенных партнёров в Китае. Наш каталог содержит 10 000+
                  верифицированных товаров.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <Scale className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Юридические риски</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Работа по агентскому договору обеспечивает полную правовую защиту и
                  налоговую безопасность.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <Clock className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Скорость и поддержка</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Без оперативной помощи сделки затягиваются. У нас — 24/7 поддержка
                  в Telegram и персональный менеджер.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <Zap className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Прозрачность</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  CRM с 7-шаговым воркфлоу обеспечивает полную прозрачность каждого этапа сделки.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6 ключевых сервисов */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">6 ключевых сервисов</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
                Удобные международные платежи
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Банковский перевод (1-3 дня), P2P (1 час), криптовалюта (30 минут).
                Выбирайте удобный способ для каждой сделки.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                Полный документооборот
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Формируем все необходимые документы: агентский договор, инвойсы,
                таможенные декларации, акты сверки и закрывающие документы.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-purple-600" />
                Юридическая и налоговая безопасность
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Работаем по агентскому договору (ГК РФ гл. 52). Все операции
                легальны и прозрачны. Полное соответствие валютному законодательству.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="w-5 h-5 text-orange-600" />
                Каталог поставщиков
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Доступ к каталогу 10 000+ верифицированных товаров от проверенных
                китайских поставщиков. Удобный поиск, фильтрация и корзина.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-indigo-600" />
                Поиск клиентов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Помогаем находить покупателей для вашего бизнеса. Расширяйте
                клиентскую базу с помощью платформы Get2B.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HandCoins className="w-5 h-5 text-yellow-600" />
                Платёжное агентирование
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Выступаем официальным платёжным агентом по агентскому договору.
                Принимаем средства от вас и оплачиваем поставщику от своего имени.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Для кого */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Для кого Get2B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">B2B-закупщики</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Компании, импортирующие товары из Китая</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Продавцы на маркетплейсах</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">WB, Ozon, YandexMarket — закупка товаров для перепродажи</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Розничные ритейлеры</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Магазины и сети, работающие с китайскими товарами</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Дистрибьюторы</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Оптовые компании и дистрибьюторские сети</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* География */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            География работы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Импорт</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Китай, Турция, ЕАЭС</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Целевой рынок</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Россия</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Валюты</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">RUB, CNY, USD, EUR</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Бизнес-модель */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Условия работы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-2xl font-bold text-yellow-600">2-5%</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Комиссия за сделку</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-2xl font-bold text-green-600">0%</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Первая сделка бесплатно</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-2xl font-bold text-blue-600">24/7</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Поддержка в Telegram</p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Попробуйте бесплатно
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Первая сделка проходит без комиссии. Убедитесь в качестве сервиса,
                    прежде чем принимать решение о долгосрочном сотрудничестве.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Наши ценности */}
      <Card>
        <CardHeader>
          <CardTitle>Наши ценности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Прозрачность</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Вы видите каждый этап сделки в CRM. Никаких скрытых платежей и комиссий.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Скорость</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Оплата поставщику от 30 минут. Оперативная поддержка и быстрое решение вопросов.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Юридическая безопасность</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Все операции в правовом поле. Агентский договор, закрывающие документы, валютный контроль.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Персональный подход</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Выделенный менеджер для каждого клиента. Индивидуальные условия для крупных объёмов.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Контакты */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-blue-600" />
            Связаться с нами
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge variant="outline">Email</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">support@get2b.ru</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge variant="outline">Telegram</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">24/7 поддержка</span>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" className="w-full justify-start">
              <ArrowRight className="w-4 h-4 mr-2" />
              Узнайте, как работает Get2B
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
