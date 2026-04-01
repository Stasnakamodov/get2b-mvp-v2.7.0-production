import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Building2,
  Users,
  Bitcoin,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  Upload,
  Percent,
  Scale,
  Zap
} from "lucide-react"

export default function PaymentMethodsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Способы оплаты
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Полное руководство по способам оплаты, комиссиям и агентскому договору на платформе Get2B
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Обзор способов оплаты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get2B предлагает три способа оплаты для международных переводов из России в Китай.
            Каждый способ имеет свои преимущества в зависимости от срочности, суммы и ваших предпочтений.
            Все платежи проходят через агентский договор, что обеспечивает полную юридическую защиту.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Банковский перевод</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">1-3 рабочих дня</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">P2P перевод</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">~1 час</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Bitcoin className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Криптовалюта</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">~30 минут</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            Сравнительная таблица
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Параметр</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Банк</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">P2P</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Крипто</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Скорость</td>
                  <td className="py-3 px-4">1-3 дня</td>
                  <td className="py-3 px-4">~1 час</td>
                  <td className="py-3 px-4">~30 мин</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Документация</td>
                  <td className="py-3 px-4"><Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Полная</Badge></td>
                  <td className="py-3 px-4"><Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Частичная</Badge></td>
                  <td className="py-3 px-4"><Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Частичная</Badge></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Рекомендуемая сумма</td>
                  <td className="py-3 px-4">от 500 000 RUB</td>
                  <td className="py-3 px-4">100 000 - 1 000 000 RUB</td>
                  <td className="py-3 px-4">любая сумма</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Безопасность</td>
                  <td className="py-3 px-4"><Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Максимальная</Badge></td>
                  <td className="py-3 px-4"><Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Высокая</Badge></td>
                  <td className="py-3 px-4"><Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Высокая</Badge></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Валюты</td>
                  <td className="py-3 px-4">RUB, USD, EUR, CNY</td>
                  <td className="py-3 px-4">RUB, CNY</td>
                  <td className="py-3 px-4">USDT, BTC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Payment Methods */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Подробно о каждом способе</h2>

        {/* Bank Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Банковский перевод
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Рекомендуемый</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Классический банковский перевод на агентский счет Get2B. Самый безопасный способ
              с полным комплектом документов. Рекомендуется для крупных сумм и регулярных поставок.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Преимущества:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Полная банковская документация
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Максимальная защита по агентскому договору
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Подходит для крупных сумм (от 500 000 RUB)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Поддержка всех валют: RUB, USD, EUR, CNY
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Параметры:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Срок: 1-3 рабочих дня
                  </li>
                  <li className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-gray-500" />
                    Комиссия: от 2%
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Документы: платежное поручение, акт
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* P2P Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              P2P перевод
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Быстрый</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Перевод между физическими лицами через банковские приложения. Подходит для средних сумм,
              когда нужна скорость при сохранении удобства обычных банковских переводов.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Преимущества:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Быстрое зачисление (~1 час)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Простой процесс через банковское приложение
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Подходит для сумм 100 000 - 1 000 000 RUB
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Параметры:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Срок: ~1 час
                  </li>
                  <li className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-gray-500" />
                    Комиссия: от 3%
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Документы: скриншот перевода
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cryptocurrency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-orange-600" />
              Криптовалюта
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Самый быстрый</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Перевод в криптовалюте (USDT, BTC) для максимально быстрой обработки.
              Идеальный вариант для срочных платежей, когда каждый час на счету.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Преимущества:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Самая быстрая обработка (~30 минут)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Нет ограничений по сумме
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Идеально для срочных поставок
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Параметры:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Срок: ~30 минут
                  </li>
                  <li className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-gray-500" />
                    Комиссия: от 3.5%
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Документы: хэш транзакции
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agency Agreement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Агентский договор
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Все платежи на платформе Get2B проходят через агентский договор. Это ключевой элемент
            безопасности, который защищает вас от блокировок банковских счетов и обеспечивает
            юридическую чистоту операций.
          </p>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-indigo-800 dark:text-indigo-200">Как это работает</h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                  Вы переводите средства на агентский счет Get2B по официальному договору. Get2B выступает
                  платежным агентом и оплачивает поставщику от своего имени. Вы получаете полный
                  комплект закрывающих документов: акт, отчет агента и подтверждение оплаты поставщику.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Защита от блокировок:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Легальное основание для перевода
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Документы для налоговой отчетности
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Соответствие 115-ФЗ
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Вы получаете:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Агентский договор
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Акт выполненных работ
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Отчет агента с подтверждением оплаты
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-green-600" />
            Структура комиссии
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Комиссия Get2B составляет от 2% до 5% и зависит от объема сделки. Чем больше сумма,
            тем ниже процент комиссии.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Объем сделки</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Комиссия</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Пример</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">до 500 000 RUB</td>
                  <td className="py-3 px-4"><Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">5%</Badge></td>
                  <td className="py-3 px-4">300 000 RUB = 15 000 RUB комиссия</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">500 000 - 2 000 000 RUB</td>
                  <td className="py-3 px-4"><Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">3.5%</Badge></td>
                  <td className="py-3 px-4">1 000 000 RUB = 35 000 RUB комиссия</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">2 000 000 - 5 000 000 RUB</td>
                  <td className="py-3 px-4"><Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">2.5%</Badge></td>
                  <td className="py-3 px-4">3 000 000 RUB = 75 000 RUB комиссия</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">от 5 000 000 RUB</td>
                  <td className="py-3 px-4"><Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">2%</Badge></td>
                  <td className="py-3 px-4">10 000 000 RUB = 200 000 RUB комиссия</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-step Workflow */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Как проходит оплата в проекте</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">3</span>
              Шаг 3: Пополнение агентского счета
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              На этом этапе вы переводите средства на агентский счет Get2B выбранным способом оплаты.
              После перевода обязательно загрузите квитанцию (платежное поручение, скриншот перевода
              или хэш транзакции) для подтверждения.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Не забудьте загрузить квитанцию!</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Без загрузки квитанции проект не перейдет к следующему шагу. Менеджер проверяет
                    поступление средств по загруженному документу.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">4</span>
              Шаг 4: Выбор способа оплаты поставщику
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Менеджер Get2B согласовывает с вами способ оплаты поставщику. Это может отличаться
              от того, как вы перевели средства на агентский счет. Get2B подбирает оптимальный
              маршрут оплаты для вашего поставщика в Китае.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold">6</span>
              Шаг 6: Получение квитанции от менеджера
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              После оплаты поставщику менеджер Get2B загружает подтверждение оплаты в ваш проект.
              Вы получите уведомление в Telegram и сможете скачать документ из карточки проекта.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">Платеж завершен</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Квитанция от менеджера подтверждает, что оплата поставщику прошла успешно.
                    Сохраните этот документ для своей отчетности.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Важная информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">Всегда загружайте квитанцию</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    После каждого перевода на агентский счет обязательно загрузите подтверждение (Шаг 3).
                    Без этого менеджер не сможет подтвердить поступление средств и проект будет приостановлен.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Совет:</strong> Для регулярных поставок используйте банковский перевод с минимальной комиссией.
                Для разовых срочных оплат подойдет криптовалюта или P2P.
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
              Узнайте больше о платежной системе Get2B:
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/payments/tracking'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Отслеживание платежей
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/payments/currency-rates'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Курсы валют и конвертация
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/projects/steps'}>
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