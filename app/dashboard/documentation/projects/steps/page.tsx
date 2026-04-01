import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardList,
  Building2,
  FileText,
  Wallet,
  CreditCard,
  Landmark,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Bell,
  CircleDot,
  Info,
  XCircle,
  Clock,
  HelpCircle,
  Send
} from "lucide-react"

export default function ProjectStepsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Этапы проекта
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Подробное описание каждого из 7 шагов рабочего процесса проекта на платформе Get2B
            </p>
          </div>
        </div>
      </div>

      {/* Обзор workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Обзор рабочего процесса
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Каждый проект на платформе Get2B проходит через 7 последовательных этапов.
            Переход к следующему шагу возможен только после завершения предыдущего.
            На каждом этапе вы и ваш менеджер получаете уведомления в Telegram.
          </p>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                {step < 7 && <ArrowRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />}
              </div>
            ))}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Визуально прогресс проекта отображается 7 точками в таймлайне.
                Каждая точка окрашена в цвет текущего статуса этапа.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Цвета статусов */}
      <Card>
        <CardHeader>
          <CardTitle>Цвета статусов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Завершено</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ожидание</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">На рассмотрении</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Отклонено</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
              1
            </span>
            <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Данные клиента
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            На первом этапе заполняется информация о компании-клиенте, которая будет использоваться
            во всех документах проекта.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Необходимые данные:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Название компании</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Юридический адрес</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> ИНН / регистрационный номер</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Контактное лицо и email</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Телефон</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">После завершения</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">Данные сохраняются, открывается Шаг 2</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Send className="w-4 h-4" />
            <span>Telegram: уведомление менеджеру о новом проекте</span>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
              2
            </span>
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Спецификация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Детальное описание товаров или услуг, которые являются предметом сделки.
            Можно загрузить инвойс, и система автоматически извлечет данные через OCR.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Необходимые данные:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Наименование товара / услуги</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Количество и единицы измерения</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Цена за единицу и общая сумма</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Валюта платежа</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Загрузка инвойса (опционально, OCR)</li>
            </ul>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Совет:</strong> Загрузите инвойс поставщика -- OCR автоматически заполнит поля спецификации.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">После завершения</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">Спецификация подтверждена, открывается Шаг 3</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Send className="w-4 h-4" />
            <span>Telegram: уведомление об утверждении спецификации</span>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
              3
            </span>
            <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Пополнение агента
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Клиент переводит средства на счет Get2B (агентский платеж). После перевода необходимо
            загрузить квитанцию об оплате для подтверждения.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Необходимые данные:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Сумма перевода</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Дата перевода</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Загрузка квитанции (скриншот или PDF)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Важно:</strong> Квитанция проверяется менеджером. Статус может быть: ожидание, одобрено или отклонено.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">После завершения</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">Менеджер подтверждает получение, открывается Шаг 4</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Send className="w-4 h-4" />
            <span>Telegram: уведомление менеджеру о загрузке квитанции</span>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
              4
            </span>
            <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Способ оплаты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Выбор способа оплаты поставщику. Платформа поддерживает несколько вариантов
            для международных расчетов.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Доступные способы:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <Landmark className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Банковский перевод</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <CreditCard className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">P2P перевод</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <Wallet className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Криптовалюта</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">После завершения</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">Способ оплаты зафиксирован, открывается Шаг 5</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Send className="w-4 h-4" />
            <span>Telegram: уведомление о выбранном способе оплаты</span>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 5 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
              5
            </span>
            <Landmark className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Реквизиты поставщика
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Банковские реквизиты поставщика для перевода средств. Менеджер вносит данные
            или они загружаются из каталога поставщиков.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Необходимые данные:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Название банка</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Номер счета / IBAN</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> SWIFT / BIC код</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Имя получателя</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Адрес банка (для международных переводов)</li>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">После завершения</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">Реквизиты подтверждены, открывается Шаг 6</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Send className="w-4 h-4" />
            <span>Telegram: уведомление клиенту о заполнении реквизитов</span>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 6 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
              6
            </span>
            <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Квитанция менеджера
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Менеджер загружает подтверждение перевода средств поставщику. Это документ,
            доказывающий, что оплата была произведена от лица Get2B.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Необходимые данные:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Квитанция / платежное поручение</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Дата проведения платежа</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-blue-500" /> Сумма перевода поставщику</li>
            </ul>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Этот шаг выполняется менеджером Get2B. Клиент ожидает уведомления о завершении.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">После завершения</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">Квитанция загружена, открывается Шаг 7</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Send className="w-4 h-4" />
            <span>Telegram: уведомление клиенту о проведенной оплате поставщику</span>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 7 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold">
              7
            </span>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Подтверждение клиента
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Финальный этап: клиент загружает закрывающие документы и подтверждает успешное
            завершение сделки. Проект переходит в статус "Завершен".
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Необходимые данные:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-green-500" /> Загрузка закрывающих документов</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-green-500" /> Подтверждение получения товара/услуги</li>
              <li className="flex items-center gap-2"><CircleDot className="w-3 h-3 text-green-500" /> Отзыв о работе (опционально)</li>
            </ul>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Проект завершен!</strong> После подтверждения проект архивируется и отображается в истории сделок.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Send className="w-4 h-4" />
            <span>Telegram: уведомление обеим сторонам о завершении проекта</span>
          </div>
        </CardContent>
      </Card>

      {/* Навигация между шагами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Навигация между шагами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            В интерфейсе проекта шаги представлены в виде визуального таймлайна с 7 точками.
            Вы можете нажать на любой завершенный шаг, чтобы просмотреть его данные.
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
              <span><strong>Завершенные шаги</strong> -- можно просматривать, но нельзя редактировать</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
              <span><strong>Текущий шаг</strong> -- активен для заполнения и редактирования</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="w-4 h-4 text-gray-400 mt-0.5" />
              <span><strong>Будущие шаги</strong> -- заблокированы до выполнения предыдущих</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Что делать если застряли */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            Что делать, если застряли на шаге
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Шаг отклонен</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Если менеджер отклонил данные на каком-либо шаге, вы получите уведомление
                  с причиной. Исправьте данные и отправьте повторно.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Долгое ожидание</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Если шаг находится в статусе "Ожидание" более 7 дней, проект помечается
                  как просроченный. Свяжитесь с менеджером через чат или Telegram.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Нет уведомлений</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Убедитесь, что Telegram бот подключен в настройках профиля. Проверьте,
                  что бот не заблокирован в вашем Telegram.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Подсказка:</strong> Используйте ИИ-ассистент в боковой панели для быстрого
                решения вопросов по проекту. Он подскажет, что нужно сделать на текущем шаге.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Следующие шаги */}
      <Card>
        <CardHeader>
          <CardTitle>Связанные разделы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/projects/templates'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Шаблоны проектов -- ускорьте создание новых проектов
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/projects/tracking'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Отслеживание проектов -- управление всеми сделками
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/ocr-features/invoice'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              OCR инвойсов -- автозаполнение спецификации
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
