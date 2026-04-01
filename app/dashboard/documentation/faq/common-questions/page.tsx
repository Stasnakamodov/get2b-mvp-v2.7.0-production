import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  HelpCircle,
  DollarSign,
  Globe,
  Clock,
  Shield,
  FileText,
  Users,
  MessageSquare,
  Building2,
  CreditCard,
  CheckCircle,
  Zap,
  ArrowRight
} from "lucide-react"

export default function CommonQuestionsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Часто задаваемые вопросы
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Ответы на основные вопросы о платформе Get2B
            </p>
          </div>
        </div>
      </div>

      {/* Общие вопросы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            О платформе
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Что такое Get2B?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Get2B — это платёжный агент и сервисная платформа для международной торговли.
              Мы помогаем российским компаниям безопасно и легально оплачивать товары
              у поставщиков из Китая, Турции и стран ЕАЭС. Платформа включает CRM-систему
              для управления проектами, каталог поставщиков, OCR для автозаполнения
              документов и полный документооборот.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Что такое агентский договор?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Агентский договор (ГК РФ, глава 52) — это легальное основание для
              перевода средств через платёжного агента. Get2B выступает агентом,
              принимающим средства от вашей компании и оплачивающим поставщику от
              своего имени. Это полностью законная схема, одобренная ЦБ РФ, которая
              защищает вас от блокировок банковских счетов.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Финансовые вопросы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Финансы и комиссия
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Какая комиссия?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Комиссия составляет от 2% до 5% от суммы сделки в зависимости от объёма
              и регулярности заказов. Чем больше объём — тем ниже процент. Для новых
              клиентов действует специальное предложение.
            </p>
            <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Первая сделка бесплатно — 0% комиссии!
                </span>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Есть ли минимальная сумма сделки?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Нет, минимальных ограничений по сумме сделки не существует. Вы можете
              работать с любыми суммами — от небольших пробных закупок до крупных
              оптовых заказов.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Вопросы о странах и платежах */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            География и платежи
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Какие страны поддерживаются?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              На данный момент мы работаем с поставщиками из следующих регионов:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Китай</Badge>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">Турция</Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Россия (ЕАЭС)</Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Казахстан (ЕАЭС)</Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Беларусь (ЕАЭС)</Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Армения (ЕАЭС)</Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Кыргызстан (ЕАЭС)</Badge>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Как быстро проходит платёж?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Скорость платежа зависит от выбранного способа оплаты:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <h5 className="font-medium text-gray-900 dark:text-white text-sm">Банковский перевод</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">1-3 рабочих дня</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <h5 className="font-medium text-gray-900 dark:text-white text-sm">P2P перевод</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Около 1 часа</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <h5 className="font-medium text-gray-900 dark:text-white text-sm">Криптовалюта</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Около 30 минут</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Безопасность */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Безопасность и легальность
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Безопасно ли это?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Да, полностью безопасно. Все переводы осуществляются по агентскому
              договору в рамках Гражданского кодекса РФ. Банк не заблокирует ваш
              счёт, так как операция имеет законное основание и подтверждающие
              документы. Мы формируем полный пакет закрывающих документов для каждой
              сделки.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-300 dark:border-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Агентский договор
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-300 dark:border-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Валютный контроль
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-300 dark:border-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Закрывающие документы
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Работа с платформой */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Работа с платформой
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Можно ли работать с несколькими поставщиками?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Да, количество поставщиков не ограничено. Вы можете добавлять своих
              поставщиков в &laquo;Синюю комнату&raquo; каталога и использовать
              аккредитованных поставщиков из каталога Get2B. Для каждого поставщика
              создаётся отдельный проект со своим воркфлоу.
            </p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Как отслеживать статус сделки?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Статус каждой сделки отображается в CRM-системе в разделе
              &laquo;Активные проекты&raquo;. Проект проходит через 7 этапов,
              и вы видите текущий шаг в реальном времени. Дополнительно все
              обновления статусов приходят через Telegram бота.
            </p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Нужны ли документы для начала работы?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Для начала работы достаточно минимальных данных о вашей компании:
              ИНН и ОГРН. Эти данные можно ввести вручную или загрузить через
              OCR-систему, которая автоматически извлечёт реквизиты из карточки
              предприятия. Полный пакет документов формируется позже в процессе
              создания проекта.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Поддержка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Поддержка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
            <p className="text-sm text-teal-700 dark:text-teal-300">
              Не нашли ответ на свой вопрос? Свяжитесь с нами:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Badge variant="outline">Email</Badge>
                <span>support@get2b.ru</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Badge variant="outline">Telegram</Badge>
                <span>Поддержка 24/7</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
