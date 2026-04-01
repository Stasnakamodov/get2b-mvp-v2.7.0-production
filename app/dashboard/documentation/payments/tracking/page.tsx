import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Bell,
  FileText,
  Eye,
  Upload,
  RefreshCw,
  MessageSquare,
  History,
  Zap,
  Send
} from "lucide-react"

export default function PaymentTrackingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Search className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Отслеживание платежей
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Статусы платежей, уведомления и управление квитанциями в ваших проектах
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Как отслеживать платежи</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Каждый платеж в Get2B проходит через несколько этапов. Вы можете отслеживать
            статус в реальном времени в карточке проекта, а также получать уведомления
            в Telegram при каждом изменении статуса.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Статус в проекте</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Актуальный статус на таймлайне</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Telegram уведомления</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Мгновенные оповещения</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <History className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">История платежей</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Полный архив операций</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Жизненный цикл платежа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Платеж проходит через следующие статусы от момента создания проекта до получения
            подтверждения от поставщика:
          </p>

          {/* Status 1 */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Ожидание квитанции</h4>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">waiting_receipt</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Проект создан, менеджер назначен. Система ожидает загрузку квитанции об оплате
                на агентский счет Get2B. Переведите средства и загрузите подтверждение.
              </p>
            </div>
          </div>

          {/* Status 2 */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Квитанция загружена</h4>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">receipt_uploaded</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Квитанция загружена и отправлена на проверку менеджеру. Менеджер проверит поступление
                средств на агентский счет. Обычно это занимает от 30 минут до нескольких часов.
              </p>
            </div>
          </div>

          {/* Status 3a - Approved */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="w-0.5 h-4 bg-transparent"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Квитанция подтверждена</h4>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">receipt_approved</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Менеджер подтвердил поступление средств. Проект переходит к следующим этапам:
                выбор способа оплаты поставщику и непосредственно оплата.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          {/* Status 3b - Rejected */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="w-0.5 h-4 bg-transparent"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Квитанция отклонена</h4>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">receipt_rejected</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Менеджер не смог подтвердить поступление средств. Необходимо загрузить
                корректную квитанцию или связаться с поддержкой.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What to Do if Rejected */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Что делать, если квитанция отклонена
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">Не паникуйте!</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Отклонение квитанции не означает потерю средств. Чаще всего это связано
                  с техническими причинами, которые легко устранить.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Частые причины отклонения:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-xs font-bold mt-0.5">1</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Нечитаемый документ</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Загрузите квитанцию в лучшем качестве (PDF предпочтительнее скриншота)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-xs font-bold mt-0.5">2</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Сумма не совпадает</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Убедитесь, что сумма перевода соответствует сумме в проекте (с учетом комиссии)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-xs font-bold mt-0.5">3</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Средства еще не поступили</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Банковский перевод может занять до 3 рабочих дней. Подождите и загрузите квитанцию снова</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-xs font-bold mt-0.5">4</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Неверные реквизиты</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Проверьте, что перевод был выполнен на правильные реквизиты агентского счета</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Confirmation (Step 6) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Подтверждение от менеджера (Шаг 6)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            После оплаты поставщику менеджер Get2B загружает подтверждение в ваш проект.
            Это финальный этап платежного процесса, означающий что поставщик получил оплату.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Что содержит подтверждение</h4>
                <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                  <li>- Документ об оплате поставщику (банковская выписка или подтверждение перевода)</li>
                  <li>- Сумма и валюта платежа поставщику</li>
                  <li>- Дата и время проведения операции</li>
                  <li>- Реквизиты получателя (поставщика)</li>
                </ul>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Рекомендуем скачать и сохранить этот документ для вашей бухгалтерской отчетности.
          </p>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Типичные сроки обработки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Этап</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Банк</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">P2P</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Крипто</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-400">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium">Перевод на агентский счет</td>
                    <td className="py-3 px-4">1-3 дня</td>
                    <td className="py-3 px-4">~1 час</td>
                    <td className="py-3 px-4">~30 мин</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium">Проверка квитанции</td>
                    <td className="py-3 px-4">1-4 часа</td>
                    <td className="py-3 px-4">1-4 часа</td>
                    <td className="py-3 px-4">30 мин - 2 часа</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium">Оплата поставщику</td>
                    <td className="py-3 px-4">1-2 дня</td>
                    <td className="py-3 px-4">1-2 дня</td>
                    <td className="py-3 px-4">2-12 часов</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Итого</td>
                    <td className="py-3 px-4 font-medium">3-6 дней</td>
                    <td className="py-3 px-4 font-medium">1-3 дня</td>
                    <td className="py-3 px-4 font-medium">3-15 часов</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            Уведомления в Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            При подключенном Telegram боте вы получаете мгновенные уведомления о каждом
            изменении статуса платежа. Настройте бота для максимальной оперативности.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Квитанция загружена</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Уведомление менеджеру о загрузке вашей квитанции</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Bell className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Квитанция подтверждена</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Менеджер подтвердил получение средств</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Bell className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Квитанция отклонена</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Необходимо загрузить корректную квитанцию</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Bell className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Оплата поставщику</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Поставщик получил оплату, подтверждение загружено</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Как подключить уведомления</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Привяжите Telegram аккаунт в настройках профиля. После этого все уведомления
                  о платежах будут приходить в бот автоматически.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            История платежей
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Все платежи сохраняются в истории проектов. Вы можете просмотреть детали
            любой прошлой транзакции в разделе "Ваши сделки".
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Доступная информация:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Сумма и валюта платежа
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Способ оплаты
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Даты всех этапов
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Загруженные документы и квитанции
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Фильтры:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  По номеру проекта
                </li>
                <li className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  По поставщику
                </li>
                <li className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  По дате
                </li>
                <li className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  По статусу
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Советы для быстрой обработки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Загружайте квитанцию сразу</strong> после перевода, не дожидаясь зачисления. Менеджер начнет проверку раньше.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте PDF</strong> вместо скриншотов. PDF-документы проверяются быстрее и содержат больше информации.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Подключите Telegram</strong> для мгновенных уведомлений. Так вы не пропустите изменение статуса.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте реквизиты</strong> перед переводом. Корректные реквизиты ускоряют подтверждение.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Переводите в рабочие часы</strong> (09:00 - 18:00 МСК). Квитанции, загруженные в рабочее время, проверяются быстрее.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Следующие шаги</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Связанные разделы документации:
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/payments/methods'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Способы оплаты
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/payments/currency-rates'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Курсы валют
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/telegram-bot/setup'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Настройка Telegram бота
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}