import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Headphones,
  Bot,
  Mail,
  MessageSquare,
  BookOpen,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  FileText,
  Camera,
  Hash,
  Lightbulb,
  Send,
  ThumbsUp,
  Zap
} from "lucide-react"

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Headphones className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Обращение в поддержку
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Способы связи, время ответа и рекомендации по описанию проблемы
            </p>
          </div>
        </div>
      </div>

      {/* Каналы поддержки */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Каналы поддержки
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                ЧатХаб (AI-ассистент)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Встроенный AI-ассистент на платформе, работающий в режиме 24/7.
                Моментально отвечает на вопросы о функциях платформы, помогает
                с навигацией и решением типичных задач.
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Мгновенный ответ</span>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Доступен через меню &laquo;ЧатХаб&raquo; в боковой панели дашборда
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                Telegram бот
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Персональный менеджер в Telegram. Отвечает на сложные вопросы,
                помогает с конкретными проектами и решает нестандартные ситуации.
                Также присылает уведомления о статусе сделок.
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Ответ в течение 1 часа</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Привяжите Telegram в настройках профиля для доступа
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                Email поддержка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Электронная почта для подробных обращений, отправки документов
                и решения вопросов, требующих детального разбора.
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Ответ в течение 24 часов</span>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                  support@get2b.ru
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                FAQ в документации
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                База знаний с ответами на часто задаваемые вопросы, пошаговыми
                инструкциями и руководствами по решению проблем. Доступна в
                любое время без ожидания.
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Доступно мгновенно</span>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Раздел &laquo;Документация&raquo; в боковой панели
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Сравнение времени ответа */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Время ответа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-purple-600">Мгновенно</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">ЧатХаб AI</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <BookOpen className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-green-600">Мгновенно</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">FAQ документация</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Bot className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-blue-600">1 час</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Telegram бот</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <Mail className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-orange-600">24 часа</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Email</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Когда обращаться в поддержку */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Когда стоит обратиться в поддержку
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Проект завис и не продвигается более 24 часов</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ошибки при оплате или несоответствие сумм</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Технические сбои в работе платформы</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Вопросы по документам и юридическим аспектам</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Нестандартные условия сделки</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Проблемы с безопасностью аккаунта</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Как описать проблему */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Как описать проблему
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Чтобы мы могли помочь вам максимально быстро, включите в обращение
            следующую информацию:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Hash className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Номер проекта</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Укажите ID проекта из дашборда (например, PRJ-001)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <ArrowRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Текущий шаг</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">На каком этапе проекта возникла проблема (Шаг 1-7)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Camera className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Скриншот</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Приложите скриншот ошибки или проблемного экрана</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Описание действий</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Опишите, что вы делали перед возникновением проблемы</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Процесс эскалации */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Процесс эскалации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">ЧатХаб / FAQ</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Попробуйте найти ответ в документации или спросить AI-ассистента.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Telegram бот</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Обратитесь к персональному менеджеру через Telegram для оперативной помощи.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Email поддержка</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Отправьте подробное описание проблемы на support@get2b.ru с документами.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold shrink-0">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Старший менеджер</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Если проблема не решена в течение 48 часов, запросите эскалацию
                  на старшего менеджера через любой канал связи.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Обратная связь */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-teal-600" />
            Обратная связь и предложения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Мы ценим вашу обратную связь и постоянно улучшаем платформу.
            Если у вас есть идеи по улучшению или пожелания, сообщите нам:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <Send className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Предложение новых функций</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Расскажите, какие функции были бы вам полезны</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <ThumbsUp className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Оценка работы</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Поделитесь впечатлениями о работе с платформой</p>
              </div>
            </div>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-teal-600 mt-0.5" />
              <p className="text-sm text-teal-700 dark:text-teal-300">
                Отправляйте предложения и отзывы на <strong>support@get2b.ru</strong> с
                пометкой &laquo;Предложение&raquo; в теме письма или напишите в Telegram бот.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
