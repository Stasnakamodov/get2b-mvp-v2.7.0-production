import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Search,
  BarChart3,
  Handshake,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Lightbulb,
  ArrowRight,
  MessageSquare,
  Database,
  HelpCircle
} from "lucide-react"

export default function AiCommandsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Bot className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Команды и возможности ИИ
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Подробный обзор всех возможностей ИИ-ассистента и быстрых промптов в ЧатХабе
            </p>
          </div>
        </div>
      </div>

      {/* Обзор возможностей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Полный список возможностей
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ИИ-ассистент Get2B работает на базе BotHub и специализируется на задачах
            международной торговли и управления поставками. Вот что он умеет:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Search className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Поиск и анализ</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Поставщики, рынки, цены</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Handshake className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Переговоры</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Стратегии и тактики</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Документы</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Контракты и соглашения</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Быстрые промпты — детально */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Быстрые промпты</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold">
                1
              </span>
              <Search className="w-5 h-5 text-orange-600" />
              Поиск поставщиков
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              ИИ помогает найти подходящих поставщиков по заданным критериям. Укажите категорию
              товара, страну происхождения, объемы закупки и бюджет.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Пример запроса:</p>
              <code className="text-sm text-gray-600 dark:text-gray-400">
                "Найди поставщиков электроники из Китая с минимальным заказом до $5000 и опытом работы от 5 лет"
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Что предоставит ИИ:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Рекомендации по выбору поставщиков
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Критерии оценки надежности
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Советы по проверке поставщика
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Рыночный обзор по категории
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold">
                2
              </span>
              <BarChart3 className="w-5 h-5 text-green-600" />
              Анализ предложений
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              ИИ проанализирует коммерческое предложение от поставщика, выявит сильные и слабые
              стороны, сравнит с рыночными стандартами.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Пример запроса:</p>
              <code className="text-sm text-gray-600 dark:text-gray-400">
                "Проанализируй предложение: цена $12 за единицу, MOQ 1000 шт, доставка 30 дней, оплата 50/50"
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Что предоставит ИИ:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Оценка конкурентоспособности цены
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Анализ условий оплаты и рисков
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Сравнение с рыночными стандартами
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Рекомендации по улучшению условий
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                3
              </span>
              <Handshake className="w-5 h-5 text-blue-600" />
              Стратегия переговоров
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              ИИ предложит стратегию ведения переговоров с учетом вашей позиции,
              целевых условий и особенностей рынка.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Пример запроса:</p>
              <code className="text-sm text-gray-600 dark:text-gray-400">
                "Помоги выстроить переговоры: хочу снизить цену на 15% при объеме 5000 единиц в месяц"
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Что предоставит ИИ:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Аргументы для снижения цены
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Возможные компромиссные варианты
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Тактика ведения диалога
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Минимально приемлемые условия
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                4
              </span>
              <FileText className="w-5 h-5 text-purple-600" />
              Подготовка контрактов
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              ИИ поможет подготовить черновик договора или соглашения с поставщиком,
              учитывая согласованные условия и стандартные практики международной торговли.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Пример запроса:</p>
              <code className="text-sm text-gray-600 dark:text-gray-400">
                "Подготовь черновик контракта на поставку 1000 единиц товара с условиями FOB Shanghai"
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Что предоставит ИИ:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Структура контракта
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Ключевые пункты и условия
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Стандартные защитные оговорки
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Рекомендации по доработке с юристом
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Свободные вопросы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Свободные вопросы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Помимо быстрых промптов, вы можете задавать ИИ любые вопросы, связанные
            с международной торговлей и управлением поставками:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Можно спросить:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Таможенные правила и пошлины
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Логистика и варианты доставки
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Валютные операции и риски
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Сертификация и стандарты
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Условия поставки (Incoterms)
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Также доступно:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Расчет стоимости доставки
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Сравнение условий поставщиков
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Обзор рынков по странам
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Проверка контрагентов
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Оптимизация цепочки поставок
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ограничения */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Ограничения ИИ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Важно понимать, что ИИ-ассистент имеет определенные ограничения:
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">Не заменяет юридическую консультацию — контракты нужно проверять с юристом</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">Не может выполнять операции в системе (платежи, заказы)</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">Не гарантирует точность рыночных данных в реальном времени</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">Не имеет доступа к внутренним данным поставщиков</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">Не заменяет персонального менеджера для принятия решений</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Интеграция с проектными данными */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Интеграция с проектными данными
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ИИ-ассистент может использовать контекст вашего проекта для более точных ответов.
            В проектных комнатах ИИ учитывает информацию о выбранных поставщиках,
            условиях сделки и текущем этапе проекта.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Контекстные подсказки
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Чем больше данных в вашем проекте, тем точнее и полезнее ответы ИИ.
                  Заполняйте все поля проекта для максимальной эффективности.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы для эффективного использования */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Советы для эффективного использования
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Указывайте контекст</strong> — добавляйте информацию о товаре, стране, объемах и бюджете в каждый запрос.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Задавайте уточняющие вопросы</strong> — если ответ недостаточно подробный, попросите ИИ раскрыть конкретный аспект.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте итеративный подход</strong> — начните с общего вопроса, затем углубляйтесь в детали.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте критические данные</strong> — всегда перепроверяйте цифры и юридические аспекты с профессионалами.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Сохраняйте полезные ответы</strong> — копируйте важные рекомендации ИИ для дальнейшего использования.
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
              Продолжите изучение возможностей платформы:
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Чат с ИИ-ассистентом — начало работы
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Настройка Telegram бота
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
