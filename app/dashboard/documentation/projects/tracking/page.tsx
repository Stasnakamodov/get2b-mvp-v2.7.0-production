import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Eye,
  Filter,
  Clock,
  AlertTriangle,
  Sparkles,
  History,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  LayoutGrid,
  Table2,
  ArrowUpDown,
  CircleDot,
  Activity,
  Bell,
  Search,
  Calendar,
  XCircle,
  Loader2
} from "lucide-react"

export default function ProjectTrackingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Отслеживание проектов
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Мониторинг, фильтрация и управление всеми вашими проектами на платформе Get2B
            </p>
          </div>
        </div>
      </div>

      {/* Дашборд */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Главная панель (Dashboard)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            На главной странице дашборда отображаются 3 самых актуальных активных проекта.
            Это позволяет мгновенно видеть, какие проекты требуют внимания, без необходимости
            открывать полный список.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">3</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Активных проекта на главной</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">7</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Точек прогресса (таймлайн)</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">1 клик</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Для перехода к деталям</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Каждая карточка проекта на дашборде содержит: название, текущий шаг, статус
                и визуальный таймлайн из 7 точек прогресса.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Быстрые фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-orange-600" />
            Быстрые фильтры
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            На главной панели доступны быстрые фильтры для мгновенного доступа
            к важным группам проектов.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Требуют внимания</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Проекты, где ваше действие необходимо прямо сейчас: загрузка документов,
                  подтверждение этапа, ответ на запрос менеджера.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Просроченные (7+ дней)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Проекты, застрявшие на одном шаге более 7 дней. Требуют срочного внимания
                  для предотвращения задержек.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Sparkles className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Новые (24 часа)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Проекты, созданные за последние 24 часа. Обычно находятся на первых этапах
                  и требуют начального заполнения данных.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <History className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Недавние</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Проекты с последними изменениями: обновления статуса, новые документы,
                  комментарии менеджера.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Страница всех сделок */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            Страница "Ваши сделки"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Полный список всех ваших проектов с расширенными возможностями фильтрации,
            сортировки и поиска. Доступен через пункт меню "Ваши сделки".
          </p>

          {/* Режимы отображения */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Режимы отображения:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutGrid className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Карточный вид</h4>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">По умолчанию</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Каждый проект показан как карточка с названием, статусом, текущим шагом
                  и визуальным таймлайном прогресса. Удобен для визуального обзора.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Table2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Табличный вид</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Компактная таблица со столбцами: название, дата, статус, этап, сумма.
                  Удобен для работы с большим количеством проектов.
                </p>
              </div>
            </div>
          </div>

          {/* Сортировка */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" /> Сортировка:
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <Calendar className="w-3 h-3 mr-1" /> По дате создания
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <ArrowUpDown className="w-3 h-3 mr-1" /> По названию
              </Badge>
            </div>
          </div>

          {/* Фильтр по статусу */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4" /> Фильтр по статусу:
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 px-3 py-1">
                Все проекты
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1">
                <Loader2 className="w-3 h-3 mr-1" /> Активные
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-3 py-1">
                <Clock className="w-3 h-3 mr-1" /> Ожидание
              </Badge>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-3 py-1">
                <XCircle className="w-3 h-3 mr-1" /> Отклонены
              </Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Завершены
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таймлайн проекта */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="w-5 h-5 text-purple-600" />
            Визуализация прогресса (Таймлайн)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Каждый проект имеет визуальный таймлайн из 7 точек, отображающих прогресс
            прохождения этапов. Таймлайн показывается как в карточке проекта, так и
            на странице детального просмотра.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              {[
                { step: 1, status: "completed", label: "Данные" },
                { step: 2, status: "completed", label: "Спец." },
                { step: 3, status: "completed", label: "Оплата" },
                { step: 4, status: "current", label: "Способ" },
                { step: 5, status: "pending", label: "Рекв." },
                { step: 6, status: "pending", label: "Квит." },
                { step: 7, status: "pending", label: "Итог" },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.status === "completed" ? "bg-green-500 text-white" :
                      item.status === "current" ? "bg-blue-500 text-white" :
                      "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}>
                      {item.step}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</span>
                  </div>
                  {index < 6 && (
                    <div className={`w-6 md:w-10 h-0.5 mx-1 ${
                      item.status === "completed" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">Пройденные шаги</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">Текущий шаг</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">Будущие шаги</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детальный просмотр */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            Детальный просмотр проекта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            При нажатии на карточку проекта открывается страница с полной информацией.
            Здесь вы можете видеть всю историю проекта и управлять текущим шагом.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">История таймлайна</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Полная хронология событий: когда был создан проект, когда менялись статусы,
                  кто и когда загружал документы.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowUpDown className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Изменения статусов</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Журнал всех переходов между статусами: одобрение, отклонение, возврат на доработку
                  с комментариями менеджера.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Уведомления и действия</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Список ожидающих действий: какие документы нужно загрузить, какие данные
                  подтвердить, сроки выполнения.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Виджет статистики */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Виджет статистики
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            На дашборде доступен виджет со сводной статистикой по всем вашим проектам.
            Данные обновляются в реальном времени.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-800">
              <Loader2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">--</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Активные</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">--</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Ожидание</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">--</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Завершены</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center border border-red-200 dark:border-red-800">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">--</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Отклонены</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Значения обновляются автоматически при изменении статусов проектов.
                Виджет показывает данные только по вашим проектам.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы по управлению */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Советы по управлению проектами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте дашборд ежедневно</strong> -- быстрый обзор 3 активных проектов
                поможет не пропустить важные действия.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте фильтр "Требуют внимания"</strong> -- это самый важный фильтр.
                Он показывает проекты, где нужно ваше немедленное действие.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Не допускайте просрочек</strong> -- проекты в статусе "Просрочен" (7+ дней)
                могут вызвать задержки и дополнительные согласования.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Настройте Telegram-уведомления</strong> -- получайте мгновенные оповещения
                о каждом изменении статуса прямо в мессенджер.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте табличный вид</strong> -- при работе с более чем 10 проектами
                одновременно табличное представление дает лучший обзор.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Подсказка:</strong> Если у вас много активных проектов, используйте
                ИИ-ассистент для быстрого получения сводки по всем текущим статусам.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Связанные разделы */}
      <Card>
        <CardHeader>
          <CardTitle>Связанные разделы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/projects/steps'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Этапы проекта -- подробное описание каждого шага
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/projects/templates'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Шаблоны проектов -- быстрое создание типовых проектов
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/telegram-bot/setup'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Настройка Telegram бота -- уведомления о проектах
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
