import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Bell,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  CreditCard,
  Building2,
  Receipt,
  Upload,
  ArrowRight,
  Lightbulb,
  Send,
  ThumbsUp,
  ThumbsDown,
  FolderCheck
} from "lucide-react"

export default function TelegramBotCommandsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Send className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Команды Telegram бота
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Подробное описание всех типов уведомлений и действий, доступных через Telegram бот
            </p>
          </div>
        </div>
      </div>

      {/* Типы уведомлений по шагам */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Уведомления по шагам проекта</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                1
              </span>
              Новый проект создан
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Когда вы создаете новый проект на платформе, менеджер мгновенно получает
              уведомление в Telegram с основной информацией о проекте.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                <span className="font-bold">Новый проект!</span><br />
                Клиент: Иван Петров<br />
                Проект: Закупка электроники<br />
                Дата: 20.02.2026
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Получатель</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">Менеджер</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                2
              </span>
              Спецификация отправлена
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              После заполнения спецификации товара менеджер получает запрос на согласование
              с inline-кнопками для быстрого принятия решения.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-3">
                <span className="font-bold">Запрос на согласование спецификации</span><br />
                Проект: Закупка электроники<br />
                Товар: Микросхемы STM32<br />
                Количество: 5000 шт
              </p>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-pointer">
                  <ThumbsUp className="w-3 h-3 mr-1" /> Одобрить
                </Badge>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 cursor-pointer">
                  <ThumbsDown className="w-3 h-3 mr-1" /> Отклонить
                </Badge>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Действие менеджера
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Менеджер может одобрить или отклонить спецификацию прямо из Telegram,
                    нажав соответствующую кнопку. Результат отобразится на платформе.
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
                3
              </span>
              Чек загружен
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Когда вы загружаете чек об оплате, менеджер получает запрос на верификацию
              платежного документа с приложенным файлом.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-3">
                <span className="font-bold">Запрос на верификацию чека</span><br />
                Проект: Закупка электроники<br />
                Сумма: $25,000<br />
                <span className="text-blue-600 dark:text-blue-400">[Прикрепленный файл: receipt.pdf]</span>
              </p>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-pointer">
                  <CheckCircle className="w-3 h-3 mr-1" /> Подтвердить
                </Badge>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 cursor-pointer">
                  <XCircle className="w-3 h-3 mr-1" /> Отклонить
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                4
              </span>
              Способ оплаты выбран
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Информационное уведомление менеджеру о том, какой способ оплаты выбрал клиент.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                <span className="font-bold">Способ оплаты выбран</span><br />
                Проект: Закупка электроники<br />
                Метод: Банковский перевод (SWIFT)<br />
                Валюта: USD
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Информационное уведомление, действие не требуется</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                5
              </span>
              Реквизиты поставщика заполнены
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Подтверждение о том, что клиент заполнил реквизиты поставщика для проведения оплаты.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                <span className="font-bold">Реквизиты поставщика заполнены</span><br />
                Проект: Закупка электроники<br />
                Поставщик: Shenzhen Electronics Co.<br />
                Банк: Bank of China
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Менеджер проверяет корректность данных</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                6
              </span>
              Чек от менеджера
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Клиент получает подтверждение оплаты от менеджера с приложенным
              чеком или платежным поручением.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Receipt className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Уведомление клиенту
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Вы получите чек от менеджера в Telegram с подтверждением проведения платежа
                    поставщику. Документ также будет доступен на платформе.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold">
                7
              </span>
              Проект завершен
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Финальное уведомление с итоговой сводкой по проекту. Отправляется и клиенту,
              и менеджеру.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                <span className="font-bold">Проект завершен!</span><br />
                Проект: Закупка электроники<br />
                Поставщик: Shenzhen Electronics Co.<br />
                Сумма сделки: $25,000<br />
                Статус: Успешно завершен
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <FolderCheck className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Завершение
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    После завершения проекта вся история переписки и документы сохраняются
                    на платформе для дальнейшего доступа.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Действия менеджера */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            Действия менеджера через Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Менеджер может выполнять следующие действия прямо из Telegram,
            используя inline-кнопки в уведомлениях:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900 dark:text-white">Одобрить</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Спецификации, документы, чеки и запросы на проведение операций
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-gray-900 dark:text-white">Отклонить</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                С указанием причины отклонения и рекомендациями по исправлению
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Обмен документами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Обмен документами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Telegram бот поддерживает двусторонний обмен файлами между платформой и мессенджером:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Отправка на платформу</strong> — документы, загруженные на платформе, автоматически пересылаются менеджеру в Telegram
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Получение от менеджера</strong> — менеджер может отправить файл через бот, и он появится на платформе
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Поддерживаемые форматы</strong> — PDF, JPEG, PNG, XLSX, DOCX и другие документы до 20 МБ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статусные обновления */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Статусные обновления в реальном времени
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Вы всегда в курсе прогресса своего проекта благодаря автоматическим обновлениям:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Менеджер одобрил вашу спецификацию</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Платеж поставщику проведен успешно</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Требуется дополнительная информация по проекту</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Менеджер загрузил новый документ в проект</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Спецификация отклонена — требуются правки</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Советы по работе с уведомлениями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Следите за уведомлениями с кнопками</strong> — они требуют действия и могут задерживать прогресс проекта, если их проигнорировать.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте детали на платформе</strong> — Telegram дает краткую сводку, полная информация доступна в дашборде проекта.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Не удаляйте сообщения бота</strong> — они служат журналом событий проекта и могут понадобиться для справки.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Закрепите чат с ботом</strong> — это позволит быстро находить уведомления среди других диалогов в Telegram.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Обращайте внимание на цвет бейджей</strong> — зеленый означает информационное сообщение, оранжевый требует действия, красный сигнализирует о проблеме.
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
                Настройка Telegram бота
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Чат с ИИ-ассистентом
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Команды и возможности ИИ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
