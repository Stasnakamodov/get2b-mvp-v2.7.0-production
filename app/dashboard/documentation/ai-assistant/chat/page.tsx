import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Plus,
  Bot,
  User,
  Search,
  Trash2,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  MessageCircle
} from "lucide-react"

export default function AiChatPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Чат с ИИ-ассистентом
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Полное руководство по использованию ЧатХаба для общения с ИИ и персональным менеджером
            </p>
          </div>
        </div>
      </div>

      {/* Что такое ЧатХаб */}
      <Card>
        <CardHeader>
          <CardTitle>Что такое ЧатХаб?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ЧатХаб — это единый центр коммуникации в Get2B, объединяющий ИИ-ассистента
            и связь с персональным менеджером. Вы можете создавать отдельные комнаты
            для разных задач и переключаться между ними в любое время.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Bot className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">ИИ-комнаты</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Автоматизированный ассистент на базе BotHub, доступный 24/7
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Проектные комнаты</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Общение с персональным менеджером по конкретному проекту
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Создание комнат */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Создание комнат</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                1
              </span>
              Создание ИИ-комнаты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Нажмите кнопку <Badge variant="outline"><Plus className="w-3 h-3 inline mr-1" />Новый чат</Badge> в верхней части списка комнат.
              В появившемся окне введите название комнаты, например "Поиск поставщиков электроники".
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-800 dark:text-purple-200">
                    ИИ-ассистент
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    ИИ-комната создается автоматически с подключением к BotHub. Ответы приходят
                    в реальном времени с поддержкой Markdown-форматирования.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                2
              </span>
              Создание проектной комнаты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Проектная комната привязывается к конкретному проекту и предназначена для общения
              с персональным менеджером. Чтобы создать такую комнату, выберите существующий
              проект из списка при создании нового чата.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Персональный менеджер
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Менеджер получает уведомления о новых сообщениях и отвечает в рабочее время.
                    Все документы и обсуждения привязаны к проекту.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Общение в чате */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Как общаться в чате
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Введите сообщение в поле ввода внизу чата и нажмите Enter или кнопку отправки.
            ИИ-ассистент ответит в реальном времени — вы увидите, как текст появляется постепенно
            благодаря потоковой передаче данных.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Возможности чата:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Ответы в реальном времени (streaming)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Markdown-форматирование
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  История сообщений сохраняется
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Быстрые подсказки-промпты
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Форматирование:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Заголовки и подзаголовки
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Маркированные и нумерованные списки
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Жирный и курсивный текст
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Блоки кода и таблицы
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Быстрые промпты */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Быстрые промпты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            В ЧатХабе доступны 4 встроенных быстрых промпта, которые помогут вам начать диалог
            с ИИ-ассистентом по наиболее частым задачам:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">Поиск поставщиков</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                ИИ поможет найти подходящих поставщиков по вашим критериям
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Анализ предложений</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                ИИ проанализирует коммерческие предложения поставщиков
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Стратегия переговоров</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ИИ предложит тактику ведения переговоров с поставщиком
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">Подготовка контрактов</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                ИИ поможет подготовить черновик договора или соглашения
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Управление комнатами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            Управление комнатами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ЧатХаб предоставляет удобные инструменты для организации ваших комнат:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Search className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Поиск комнат</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Используйте строку поиска для быстрого нахождения нужной комнаты по названию
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Удаление комнат</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Наведите на комнату и нажмите иконку удаления. Вся история сообщений будет удалена безвозвратно.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Переключение между комнатами</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Нажмите на любую комнату в списке слева для переключения. Контекст сохраняется.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Непрочитанные сообщения */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-600" />
            Непрочитанные сообщения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Когда в комнате появляются новые сообщения, рядом с её названием отображается
            бейдж с количеством непрочитанных сообщений. Это особенно полезно для проектных
            комнат, где менеджер может ответить в любое время.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Совет
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Регулярно проверяйте проектные комнаты на наличие новых сообщений от менеджера.
                  Бейдж исчезает после открытия комнаты и прочтения сообщений.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Лучшие практики */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Лучшие практики
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Будьте конкретны</strong> — чем точнее вопрос, тем полезнее ответ ИИ. Указывайте товар, страну, объемы и сроки.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Создавайте отдельные комнаты</strong> — для каждой задачи лучше создать отдельную комнату, чтобы не смешивать контексты.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте ИИ для подготовки</strong> — перед обсуждением с менеджером проработайте вопросы с ИИ-ассистентом.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Когда обращаться к менеджеру</strong> — для финальных решений, согласования условий и подписания документов всегда используйте проектную комнату с менеджером.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте быстрые промпты</strong> — они оптимизированы для типичных задач и дают наиболее структурированные ответы.
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
              Узнайте больше о возможностях ИИ-ассистента:
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Команды и возможности ИИ
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Настройка Telegram бота
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Создание первого проекта
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
