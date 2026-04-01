import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wrench,
  Mail,
  Upload,
  FileX,
  ScanLine,
  AlertTriangle,
  Search,
  Image,
  Bell,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Lightbulb,
  XCircle
} from "lucide-react"

export default function TroubleshootingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Wrench className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Решение проблем
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Инструкции по устранению распространённых проблем на платформе
            </p>
          </div>
        </div>
      </div>

      {/* Общий совет */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Прежде чем обращаться в поддержку
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Попробуйте обновить страницу (Ctrl+F5), очистить кэш браузера или
              зайти с другого устройства. Многие проблемы решаются этими простыми
              шагами.
            </p>
          </div>
        </div>
      </div>

      {/* Проблемы с аккаунтом */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Аккаунт и авторизация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Не приходит письмо подтверждения
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте папку &laquo;Спам&raquo; и &laquo;Промоакции&raquo; в почте
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Убедитесь, что email введён корректно, без опечаток
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Подождите 5-10 минут и запросите повторную отправку
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Если письмо не пришло в течение 30 минут, обратитесь в поддержку
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Проблемы с файлами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            Загрузка файлов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Ошибка загрузки файла
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте формат файла: PDF, JPG, PNG, XLSX, DOCX
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Убедитесь, что размер файла не превышает 20 MB
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Попробуйте переименовать файл, убрав спецсимволы из имени
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте стабильность интернет-соединения
                  </p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Чек отклонён менеджером
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Прочитайте причину отклонения в комментарии менеджера
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Загрузите корректный чек с полной информацией о платеже
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Убедитесь, что на чеке видны дата, сумма и реквизиты
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Проблемы с OCR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-purple-600" />
            OCR и распознавание
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  OCR не распознал данные
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Используйте чёткий скан с разрешением от 300 DPI
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Убедитесь, что документ расположен ровно, без наклона
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Попробуйте электронный PDF вместо фотографии
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    При неудаче заполните данные вручную
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Проблемы с проектами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Проекты и сделки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Проект завис на определённом шаге
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте, заполнены ли все обязательные поля на текущем шаге
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Посмотрите, нет ли комментариев от менеджера в проекте
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Свяжитесь с менеджером через ЧатХаб для уточнения статуса
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Проблемы с каталогом и логотипами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            Каталог и визуальные элементы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-teal-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Не работает поиск в каталоге
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте, не активны ли фильтры, сужающие результаты
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Сбросьте все фильтры и попробуйте поиск заново
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Используйте более общие поисковые запросы
                  </p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-teal-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Проблемы с логотипом поставщика
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Поддерживаемые форматы: JPEG, PNG, WebP, SVG
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Максимальный размер файла: 5 MB
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Рекомендуемый размер: 200x200 пикселей, квадратное изображение
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    При ошибке попробуйте сконвертировать в PNG
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Проблемы с Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Telegram уведомления
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Telegram уведомления не приходят
                </h4>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Убедитесь, что Telegram аккаунт привязан к профилю Get2B
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте, что бот не заблокирован в Telegram
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Откройте диалог с ботом и нажмите /start
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте настройки уведомлений в самом Telegram
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Если ничего не помогло */}
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800 dark:text-red-200">
              Проблема не решена?
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Если ни один из способов не помог, обратитесь в поддержку. Укажите:
              номер проекта, шаг на котором возникла проблема, скриншот ошибки и
              описание действий. Это поможет решить проблему быстрее.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-300 dark:border-red-700">
                support@get2b.ru
              </Badge>
              <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-300 dark:border-red-700">
                Telegram 24/7
              </Badge>
              <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-300 dark:border-red-700">
                ЧатХаб в платформе
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
