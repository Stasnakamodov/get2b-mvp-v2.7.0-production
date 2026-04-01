import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  User,
  FileText,
  ArrowRight,
  Lightbulb,
  Smartphone,
  Send,
  Settings,
  MessageSquare
} from "lucide-react"

export default function TelegramBotSetupPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Настройка Telegram бота
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Как работает Telegram-интеграция и что нужно знать для эффективного использования
            </p>
          </div>
        </div>
      </div>

      {/* Что делает бот */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Что делает Telegram бот
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Telegram бот Get2B обеспечивает мгновенную связь между вами и вашим
            персональным менеджером. Бот автоматически отправляет уведомления на каждом
            этапе проекта и позволяет менеджеру оперативно реагировать на ваши запросы.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Уведомления</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Автоматические на каждом шаге</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Документы</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Обмен файлами через бот</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Согласование</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Менеджер принимает решения</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Автоматическая настройка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Автоматическая настройка
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Бот настроен автоматически
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Telegram бот предварительно настроен для вашего аккаунта. Вам не нужно
                  выполнять дополнительных действий для его активации. Уведомления начнут
                  приходить автоматически при создании проекта.
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            В системе Get2B работают два бота:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Клиентский бот</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Отправляет вам уведомления о статусе проекта, документы и подтверждения
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Менеджерский бот</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Получает запросы от клиентов, позволяет менеджеру согласовывать и отвечать
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Как работают уведомления */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Как работают уведомления</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Автоматические уведомления на каждом шаге
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Бот работает на основе webhook-технологии, обеспечивая мгновенную доставку
              сообщений. При каждом изменении статуса проекта система автоматически
              отправляет уведомление соответствующему участнику.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">
                  1
                </span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Вы выполняете действие</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Например, создаете проект или загружаете документ на платформе
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">
                  2
                </span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Система обрабатывает событие</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Webhook мгновенно передает информацию в Telegram
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">
                  3
                </span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Менеджер получает уведомление</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    С кнопками действий для оперативного реагирования
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-sm">
                  4
                </span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Вы получаете ответ</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Подтверждение, документ или запрос дополнительной информации
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Что вы будете получать */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Что вы будете получать
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Типы уведомлений, которые приходят в ваш Telegram:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Статус</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">Обновления статуса проекта на каждом из 7 шагов</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Согласование</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">Запросы на утверждение с кнопками одобрения/отклонения</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Документы</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">Загруженные документы и файлы от менеджера</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Чеки</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">Чеки об оплате и подтверждения транзакций</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Менеджерский бот */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Как работает менеджерский бот
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Менеджерский бот позволяет вашему персональному менеджеру оперативно
            обрабатывать запросы прямо из Telegram, без необходимости заходить на платформу.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Inline-кнопки</strong> — менеджер может одобрить или отклонить запрос одним нажатием
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Загрузка документов</strong> — менеджер отправляет файлы через бот, они появляются на платформе
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Верификация чеков</strong> — менеджер получает чеки для проверки и подтверждения
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Статусные уведомления</strong> — менеджер видит все действия клиента в реальном времени
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Время ответа */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Время ответа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Рабочие часы</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Ответ в течение 1 часа. Менеджер доступен с 9:00 до 18:00 (МСК) в рабочие дни.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Нерабочее время</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Уведомления сохраняются и обрабатываются в начале следующего рабочего дня.
              </p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Доступность 24/7
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Менеджер получает все уведомления круглосуточно и может ответить в любое время
                  при наличии срочных вопросов. Для несрочных задач ожидайте ответ в рабочие часы.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Типы уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            Обзор типов уведомлений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">1</span>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">Создание проекта</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Менеджер уведомлен о новом проекте</p>
              </div>
              <Badge variant="outline">Информация</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">2</span>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">Спецификация</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Запрос на согласование с кнопками</p>
              </div>
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Действие</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">3</span>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">Оплата и чеки</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Верификация платежных документов</p>
              </div>
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Действие</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">4</span>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">Реквизиты</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Подтверждение банковских данных</p>
              </div>
              <Badge variant="outline">Информация</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-sm">5</span>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">Завершение</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Итоговая сводка по проекту</p>
              </div>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Завершено</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Советы по использованию Telegram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Не отключайте уведомления</strong> — важные статусные обновления приходят автоматически, не пропускайте их.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Отвечайте оперативно</strong> — быстрые ответы на запросы менеджера ускоряют обработку проекта.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте платформу для деталей</strong> — Telegram для быстрых уведомлений, платформа для полной работы с проектом.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте документы</strong> — всегда просматривайте полученные от менеджера документы на платформе.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Следующие шаги */}
      <Card>
        <CardHeader>
          <CardTitle>Следующие шаги</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Узнайте подробнее о командах и типах уведомлений бота:
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Команды Telegram бота
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Чат с ИИ-ассистентом
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Этапы проекта
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
